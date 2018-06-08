const { assertSuccess, payload } = require('@pheasantplucker/failables')
const {
  createDatastoreClient,
  readEntities,
} = require('@pheasantplucker/gc-datastore')
const { getFile } = require('@pheasantplucker/gc-cloudstorage')

const {
  loader,
  jobsToEntities,
  make_batches,
  appcast_datastore_job,
} = require('./loader')
const equal = require('assert').deepEqual
const uuid = require('uuid')

const filename = `starspawn_tests/parsed_output.json`
const fakeJobArray = require(`../../../samples/fakejobsarray.json`)

const thisId = uuid.v4()

createDatastoreClient()

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
    const result = jobsToEntities(thisId, fakeJobArray)
    assertSuccess(result)
    const p = payload(result)
    equal(p[0].key.kind, 'job')
  })
})

// describe(`drain_write_entities()`, () => {
//   it(`should take an array of jobs and return an array of entities`, () => {
//     const result = jobsToEntities(thisId, fakeJobArray)
//     assertSuccess(result)
//   })
// })

describe('loader.js', function() {
  this.timeout(540 * 1000)
  it('should load a list of jobs into Datastore', async () => {
    const result = await loader(thisId, { filename })
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
