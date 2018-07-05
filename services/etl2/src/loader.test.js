const { assertSuccess, payload } = require('@pheasantplucker/failables')
const {
  createDatastoreClient,
  batch_delete,
  batch_set,
} = require('@pheasantplucker/gc-datastore')
const { getFile } = require('@pheasantplucker/gc-cloudstorage')

const {
  loader,
  appcast_datastore_job,
  check_job_changes,
  add_jobs_to_cache,
  delete_jobs_from_cache,
  diff_for_cache,
  delete_jobs_from_cache_by_id,
} = require('./loader')
const equal = require('assert').deepEqual
const uuid = require('uuid')

const filename = `starspawn_tests/parsed_output.json`
const { forJobsToEntities } = require(`../../../samples/loaderJobs`)

const NAMESPACE = 'test'
const APPCAST_JOBS = forJobsToEntities.map(j => appcast_datastore_job(j))
const thisId = uuid.v4()

createDatastoreClient('starspawn-201921')

describe('loader.js', function() {
  this.timeout(540 * 1000)

  describe(`datastore_job()`, () => {
    it(`create a job with datastore schema`, async () => {
      const file_data = await getFile(filename)
      const as_json = JSON.parse(payload(file_data))
      const job = as_json.root.job[0]
      const transformed_job = appcast_datastore_job(job)
      const data = transformed_job
      equal(typeof data.body, 'string')
      equal(data.body.length > 100, true)
      equal(typeof data.gsd, 'string')
      equal(data.gsd.length > 100, true)
    })
  })

  describe(`check_job_changes()`, async () => {
    const jobs_to_check = APPCAST_JOBS.slice(0, 4)
    const exist_job = jobs_to_check[0]
    const changed_job = jobs_to_check[1]
    const job_to_add = jobs_to_check[2]
    const cached_job = jobs_to_check[3]
    const data1 = [
      ['job', exist_job.id, exist_job],
      ['job', changed_job.id, changed_job],
    ]
    const meta1 = {
      excludeFromIndexes: ['body', 'gsd'],
      method: 'upsert',
    }
    it('load one of the jobs', async () => {
      const r1 = await batch_set(NAMESPACE, data1, meta1)
      assertSuccess(r1)
      const r2 = await add_jobs_to_cache([cached_job])
      assertSuccess(r2)
    })
    it(`return new and updated ids`, async () => {
      // change the hash so we get a changed job
      jobs_to_check[1].hash = uuid.v4()
      const r1 = await check_job_changes(NAMESPACE, jobs_to_check)
      assertSuccess(r1)
      const p = payload(r1)
      equal(p, {
        cached: [cached_job.id],
        exist: [exist_job.id],
        add: [job_to_add.id],
        changed: [changed_job.id],
      })
    })
    it(`should clean up`, async () => {
      const r1 = await batch_delete(NAMESPACE, data1)
      assertSuccess(r1)
      const r2 = await delete_jobs_from_cache([cached_job])
      assertSuccess(r2)
    })
  })

  describe('diff_for_cache()', function() {
    it('turn check_job_changes into a list of ids for caching', async () => {
      const jobs = [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }]
      const diff = [{ id: 'a' }, { id: 'b' }, { id: 'd' }]
      const check_job_changes_output = {
        cached: ['c'],
        exist: ['a'],
        add: ['b'],
        changed: ['d'],
      }
      const r1 = diff_for_cache(jobs, check_job_changes_output)
      equal(r1, diff)
    })
  })

  describe('loader()', function() {
    it('should load a list of jobs into Datastore', async () => {
      const isTest = true
      const r1 = await loader(thisId, { filename, isTest })
      assertSuccess(r1)
      // If this fails it may be because the jobs
      // are already in the loadertest namespace in datastore
      // remove them via the UI or by running the rest again
      // also the cache needs to be cleared of the ids
      const batch = payload(r1).checked.map(id => ['job', id])
      const r2 = await batch_delete(NAMESPACE, batch)
      assertSuccess(r2)
      const p = payload(r1)
      const r3 = await delete_jobs_from_cache_by_id(p.checked)
      assertSuccess(r3)
      equal(payload(r1).written.length, 100)
      equal(payload(r1).checked.length, 100)
    })
  })
})
