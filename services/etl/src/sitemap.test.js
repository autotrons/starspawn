const { assertSuccess, payload } = require("@pheasantplucker/failables-node6")
const { sitemap, formatUrl } = require("./sitemap")
const equal = require("assert")
const { example1 } = require("../samples/example")
const MEGABYTE = Math.pow(2, 20)
const uuid = require("uuid")

describe("sitemap.js", function() {
  this.timeout(540 * 1000)

  describe(`sitemap()`, () => {
    const id = uuid.v4()
    const url = "http://imawebsite.com/plz"
    const lastModified = "2018-05-01"
    const changeFrequency = "daily"
    const priority = 0.5
    const expected = example1

    it(`should build the sitemap`, async () => {
      const data = { url, lastModified, changeFrequency, priority }
      const result = await sitemap(id, data)
      assertSuccess(result)
      const xmlString = payload(result)
      equal(xmlString, expected)
    })
  })

  describe(`formatUrl()`, () => {
    it(`should thing the do slash trailing`, () => {
      const url = "http://plzslashtrail.me/ok"
      const result = formatUrl(url)
      equal(result, `${url}/`)
    })

    it(`should not append another slash`, () => {
      const url = "http://plzslashtrail.me/ok/"
      const result = formatUrl(url)
      equal(result, url)
    })
  })
})
