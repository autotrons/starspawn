const { assertSuccess } = require('@pheasantplucker/failables')
const { download } = require('./download')
const { doesFileExist } = require('./fs-failable')

describe(`download.js`, function() {
  this.timeout(10 * 1000)
  describe('download()', () => {
    it('download a file', async () => {
      const source_url =
        'https://storage.googleapis.com/starspawn_tests/test_feed.xml.gz'
      // THIS IS SPECIFIC TO THE ABOVE FILE
      const output_file = `./cache/5269_1532295509000.gz`
      const result = await download(source_url)
      assertSuccess(result, { output_file })
      const r2 = await doesFileExist(output_file)
      assertSuccess(r2, true)
    })
  })
})
