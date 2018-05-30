const equal = require('assert').deepEqual
const { start, stop } = require('./etl.js')
const { assertSuccess, payload, meta } = require('@pheasantplucker/failables')
const { exists } = require('@pheasantplucker/gc-cloudstorage')
const uuid = require('uuid')
const rp = require('request-promise')

async function download(id, source_url, target_file) {
  const options = {
    uri: 'http://localhost:8080/download',
    method: 'POST',
    headers: {
      'User-Agent': 'Request-Promise',
    },
    body: { message: { data: { id, source_url, target_file } } },
    json: true, // Automatically stringifies the body to JSON
  }
  const result = await rp(options)
  return result
}
describe(`download.js`, function() {
  this.timeout(10 * 1000)
  before(async () => {
    await start()
  })
  after(() => {
    stop()
  })

  describe('download()', () => {
    it('download a file', async () => {
      const id = uuid.v4()
      const source_url =
        'https://storage.googleapis.com/starspawn_tests/feed.xml.gz'
      const target_file = `datafeeds/full_feed/${id}.xml.gz`
      const result = await download(id, source_url, target_file)
      assertSuccess(result)
      equal(meta(result).id, id)
      equal(meta(result).wn, 'download')
      const r2 = await exists(target_file)
      assertSuccess(r2, true)
    })
  })
})
