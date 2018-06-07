const equal = require('assert')
const { start, stop, PORT } = require('./helloworld')
const { get } = require('@pheasantplucker/http')
const { assertSuccess, payload } = require('@pheasantplucker/failables')

describe(`helloworld.js`, () => {
  before(async () => {
    await start()
  })
  after(async () => {
    await stop()
  })

  describe(`getSitemapIndex()`, () => {
    const indexPath = `sitemapindex.xml`
    const url = `http://localhost:${PORT}/${indexPath}`
    it(`should retrieve the index file`, async () => {
      const result = await get(url)
      assertSuccess(result)
      equal(typeof payload(result), 'string')
    })
  })
})
