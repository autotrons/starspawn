const { assertSuccess, payload } = require('@pheasantplucker/failables')
const {
  createDatastoreClient,
  batch_delete,
  batch_set,
} = require('@pheasantplucker/gc-datastore')
const { getFile } = require('@pheasantplucker/gc-cloudstorage')

const { loader, appcast_datastore_job, check_job_changes } = require('./loader')
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

  describe(`check_job_changes()`, () => {
    const jobs_to_check = APPCAST_JOBS.slice(0, 3)
    const j1 = jobs_to_check[0]
    const j2 = jobs_to_check[1]
    const data1 = [['job', j1.id, j1], ['job', j2.id, j2]]
    const meta1 = {
      excludeFromIndexes: ['body', 'gsd'],
      method: 'upsert',
    }
    it('load one of the jobs', async () => {
      const r1 = await batch_set(NAMESPACE, data1, meta1)
      assertSuccess(r1)
    })
    it(`return new and updated ids`, async () => {
      // change the hash so we get a changed job
      jobs_to_check[1].hash = uuid.v4()
      const r1 = await check_job_changes(NAMESPACE, jobs_to_check)
      assertSuccess(r1)
      const p = payload(r1)
      equal(p, {
        exist: ['e56bb6a26601368047248800dad8a656'],
        add: ['9b70cbd30e85bcf58c8b6d72647cda48'],
        changed: ['4e92e055181b53c84ed6bba99b66aff0'],
      })
    })
    it(`should clean up`, async () => {
      const r1 = await batch_delete(NAMESPACE, data1)
      assertSuccess(r1)
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
      const batch = payload(r1).checked.map(id => ['job', id])
      const r2 = await batch_delete(NAMESPACE, batch)
      assertSuccess(r2)
      equal(payload(r1).written.length, 100)
      equal(payload(r1).checked.length, 100)
    })
  })
})
