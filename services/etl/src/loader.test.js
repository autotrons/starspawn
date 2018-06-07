const { assertSuccess, payload } = require('@pheasantplucker/failables')
const {
  createDatastoreClient,
  readEntities,
} = require('@pheasantplucker/gc-datastore')

const { loader, jobsToEntities } = require('./loader')
const equal = require('assert').deepEqual
const uuid = require('uuid')

const filename = `starspawn_tests/parsed_output.json`
const fakeJobArray = require(`../../../samples/fakejobsarray.json`)

const thisId = uuid.v4()

createDatastoreClient()

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

describe(`jobstoEntities()`, () => {
  it(`should take an array of jobs and return an array of entities`, () => {
    const result = jobsToEntities(thisId, fakeJobArray)
    assertSuccess(result)
  })
})
