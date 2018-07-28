const { assertSuccess, payload } = require('@pheasantplucker/failables')
// const equal = require('assert').deepEqual
const { processFeed } = require('./process-feed.js')
const { doesFileExist } = require('./fs-failable')
const { delete_jobs_from_cache_by_id } = require('./loader')

const {
  createDatastoreClient,
  batch_delete,
} = require('@pheasantplucker/gc-datastore')
const equal = require('assert').deepEqual

createDatastoreClient('starspawn-201921')

// const filename = `starspawn_tests/parsed_output.json`

describe('process-feed.js', function() {
  this.timeout(540 * 1000)
  const IS_TEST = true
  const source_url =
    'https://storage.googleapis.com/starspawn_tests/test_feed.xml.gz'
  let processStepResults
  it(`should run`, async () => {
    const result = await processFeed(source_url, IS_TEST)
    assertSuccess(result)
    processStepResults = payload(result)
  })

  it(`should have downloaded the feed locally`, async () => {
    const download_output_file = processStepResults[0]
    const result = await doesFileExist(download_output_file)
    assertSuccess(result, true)
  })

  it(`should have unzipped the feed locally`, async () => {
    const unzip_output_file = processStepResults[1]
    const result = await doesFileExist(unzip_output_file)
    assertSuccess(result, true)
  })

  it(`should have parsed the file`, async () => {
    const parsed_steps_data = processStepResults[2]
    const parsed_output_file = parsed_steps_data[0]
    const result = await doesFileExist(parsed_output_file)
    assertSuccess(result, true)
  })

  it(`should have loaded the file`, async () => {
    const loaded_steps_data = processStepResults[3]
    // If this fails it may be because the jobs
    // are already in the loadertest namespace in datastore
    // remove them via the UI or by running the test again
    // also the cache needs to be cleared of the ids
    const batch = loaded_steps_data.checked.map(id => ['job', id])
    const NAMESPACE = 'test'
    const r2 = await batch_delete(NAMESPACE, batch)
    assertSuccess(r2)
    const r3 = await delete_jobs_from_cache_by_id(loaded_steps_data.checked)
    assertSuccess(r3)
    equal(loaded_steps_data.added.length, 100)
    equal(loaded_steps_data.checked.length, 100)
    equal(loaded_steps_data.cached.length, 100)
    //
    //
  })
})
