const { assertSuccess, payload } = require('@pheasantplucker/failables')
const { doesFileExist } = require('./fs-failable')
const { unzip } = require('./unzip')
describe('unzip.js', function() {
  let outputFile
  describe('unzip()', () => {
    const source_file = './cache/test_feed.xml.gz'
    it('split up a file', async () => {
      const result = await unzip(source_file)
      assertSuccess(result)
      outputFile = payload(result).output_file
    })

    it(`should have streamed file`, async () => {
      const result = await doesFileExist(outputFile)
      assertSuccess(result, true)
    })
  })

  // after(async () => {
  //   const r1 = await deleteFile(outputFile)
  //   assertSuccess(r1)
  // })
})
