const { assertSuccess, payload } = require('@pheasantplucker/failables')
const {
  createDatastoreClient,
  readEntities,
  makeEntityByName,
  batch_delete,
  batch_set,
} = require('@pheasantplucker/gc-datastore')
const { getFile } = require('@pheasantplucker/gc-cloudstorage')

const {
  loader,
  jobsToEntities,
  make_batches,
  appcast_datastore_job,
  findMissingEntities,
  check_job_changes,
} = require('./loader')
const equal = require('assert').deepEqual
const assert = require('assert')
const uuid = require('uuid')

const filename = `starspawn_tests/parsed_output.json`
const { forJobsToEntities } = require(`../../../samples/loaderJobs`)

const thisId = uuid.v4()

createDatastoreClient('starspawn-201921')

describe('loader.js', function() {
  this.timeout(540 * 1000)

  describe(`batches()`, () => {
    it(`create the batches`, () => {
      const expected = [[1, 2], [3, 4], [5, 6], [7, 8], [9]]
      const result = make_batches([1, 2, 3, 4, 5, 6, 7, 8, 9], 2)
      equal(result, expected)
    })
  })

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

  describe(`jobstoEntities()`, () => {
    it(`should take an array of jobs and return an array of entities`, () => {
      const result = jobsToEntities(thisId, forJobsToEntities)
      assertSuccess(result)
      const p = payload(result)
      equal(p[0].key.kind, 'job')
    })
  })

  //const log = console.log
  describe(`check_job_changes()`, () => {
    const namespace = 'loadertest'
    const result = jobsToEntities(thisId, forJobsToEntities)
    assertSuccess(result)
    const jobs_to_check = payload(result).slice(0, 3)
    const j1 = jobs_to_check[0]
    const data1 = [['job', j1.data.id, j1.data]]
    const meta1 = {
      excludeFromIndexes: ['body', 'gsd'],
      method: 'upsert',
    }
    //const ids = jobs_to_check.map(j => j.data.id)
    //console.log(ids)
    it('load one of the jobs', async () => {
      const r1 = await batch_set(namespace, data1, meta1)
      assertSuccess(r1)
    })
    it(`return new and updated ids`, async () => {
      const r1 = await check_job_changes(jobs_to_check)
      assertSuccess(r1)
      const p = payload(r1)
      equal(p, {
        old: ['63cad8c260faf7da8148bddc7857f05a'],
        new: [
          '73c9950112133be42bd41acc75e98e47',
          '10921aa3c735209eecaa51806eb4b86f',
        ],
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
      const writtenJobs = payload(result)
      const job1Key = writtenJobs.jobEntities[0].key
      const job1UniqueId = job1Key.name
      const readCheckResult = await readEntities([job1Key])
      assertSuccess(readCheckResult)

      const readData = payload(readCheckResult)
      equal(readData[job1UniqueId].title, 'Per Diem TRAVEL ICU Nurse (RN)')
    })
  })

  describe(`findMissingEntities()`, () => {
    it(`should return the array of entities not in DB`, async () => {
      const newEntity = payload(
        makeEntityByName('testKind', uuid.v4(), { a: 'c' })
      )
      const ents = [newEntity]
      const r1 = await findMissingEntities(ents)
      assertSuccess(r1)
      const newEntities = payload(r1)
      assert(newEntities.length)
      equal(newEntities.length, 1)
    })
  })
})
