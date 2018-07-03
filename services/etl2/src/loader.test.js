const { assertSuccess, payload } = require('@pheasantplucker/failables')
const {
  createDatastoreClient,
  readEntities,
  batch_delete,
  batch_set,
} = require('@pheasantplucker/gc-datastore')
const { getFile } = require('@pheasantplucker/gc-cloudstorage')

const { loader, appcast_datastore_job, check_job_changes } = require('./loader')
const equal = require('assert').deepEqual
const uuid = require('uuid')

const filename = `starspawn_tests/parsed_output.json`
const { forJobsToEntities } = require(`../../../samples/loaderJobs`)

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
      const data = transformed_job.data
      equal(typeof data.body, 'string')
      equal(data.body.length > 100, true)
      equal(typeof data.gsd, 'string')
      equal(data.gsd.length > 100, true)
      equal(transformed_job.key.kind, 'job')
    })
  })

  describe(`check_job_changes()`, () => {
    const namespace = 'loadertest'
    const result = forJobsToEntities.map(j => appcast_datastore_job(j))
    const jobs_to_check = result.slice(0, 3)
    const j1 = jobs_to_check[0]
    const j2 = jobs_to_check[1]
    const data1 = [['job', j1.id, j1], ['job', j2.id, j2]]
    const meta1 = {
      excludeFromIndexes: ['body', 'gsd'],
      method: 'upsert',
    }
    it('load one of the jobs', async () => {
      const r1 = await batch_set(namespace, data1, meta1)
      assertSuccess(r1)
    })
    it(`return new and updated ids`, async () => {
      jobs_to_check[1].hash = 'a changed hash'
      const r1 = await check_job_changes(jobs_to_check)
      assertSuccess(r1)
      const p = payload(r1)
      equal(p, {
        exist: ['63cad8c260faf7da8148bddc7857f05a'],
        add: ['10921aa3c735209eecaa51806eb4b86f'],
        changed: ['73c9950112133be42bd41acc75e98e47'],
      })
    })
    it(`should clean up`, async () => {
      const r1 = await batch_delete(namespace, data1)
      assertSuccess(r1)
    })
  })

  describe('loader()', function() {
    it('should load a list of jobs into Datastore', async () => {
      const isTest = true
      const result = await loader(thisId, { filename, isTest })
      assertSuccess(result)
    })
  })
})
