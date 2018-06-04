const { assertSuccess } = require('@pheasantplucker/failables')
const { exists } = require('@pheasantplucker/gc-cloudstorage')
const uuid = require('uuid')
const { unzip } = require('./unzip')
describe('unzip.js', function() {
  this.timeout(540 * 1000)
  describe('unzip()', () => {
    const source_file = 'datafeeds/full_feed/feed_100.xml.gz'
    const target_file = `datafeeds/unziped/${uuid.v4()}.xml`

    it('split up a file', async () => {
      const id = uuid.v4()
      const result = await unzip(id, {
        source_file,
        target_file,
      })
      assertSuccess(result, {target_file})
    })

    it(`should have streamed file`, async () => {
      const result = await exists(target_file)
      assertSuccess(result, true)
    })
  })
})
