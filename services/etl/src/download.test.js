const { assertSuccess } = require('@pheasantplucker/failables')
const { exists } = require('@pheasantplucker/gc-cloudstorage')
const uuid = require('uuid')
const { download } = require('./download')

describe(`download.js`, function() {
  this.timeout(10 * 1000)
  describe('download()', () => {
    it('download a file', async () => {
      const id = uuid.v4()
      const source_url =
        'https://storage.googleapis.com/starspawn_tests/feed.xml.gz'
      const target_file = `datafeeds/full_feed/${id}.xml.gz`
      const result = await download(id, { source_url, target_file })
      assertSuccess(result, { target_file })
      const r2 = await exists(target_file)
      assertSuccess(r2, true)
    })
  })
})
