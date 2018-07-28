const { assertSuccess, payload } = require('@pheasantplucker/failables')
// const equal = require('assert').deepEqual
const { processFeed } = require('./process-feed.js')
const { doesFileExist } = require('./fs-failable')

// const filename = `starspawn_tests/parsed_output.json`

describe('process-feed.js', () => {
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

  it.skip(`should have loaded the file`, async () => {
    const loaded_steps_data = processStepResults[3]
  })
})
