const { get } = require(`@pheasantplucker/http`)
const { assertSuccess } = require(`@pheasantplucker/failables`)
const { PORT, start, stop } = require('./default')

describe(`default.js`, () => {
  describe(`sitemaps`, () => {
    it(`should start`, async () => {
      await start()
    })
    it(`should get the sitemap`, async () => {
      const id = 'test_sitemap_0.xml'
      const result = await get(`http://localhost:${PORT}/${id}`)
      assertSuccess(result)
    })
    it(`should stop`, async () => {
      await stop()
    })
  })
})
