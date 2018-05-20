const { assertSuccess } = require("@pheasantplucker/failables-node6")
const { sitemap, buildSitemap } = require("./sitemap")
const equal = require("assert")
const { example1 } = require("./example")
const MEGABYTE = Math.pow(2, 20)

describe("sitemap.js", function() {
  this.timeout(540 * 1000)
  it("should pull a batch of tags between two points in the file", async () => {
    const input = {
      url: `http://bleepblopbloop.com/dangson`,
      lastModified: "2018-5-1",
      changeFrequency: "daily",
      priority: 0.5
    }
    const { req, res } = make_req_res(input)
    const result = await sitemap(req, res)
    assertSuccess(result)
  })

  describe.only(`buildSitemap()`, () => {
    const url = "http://imawebsite.com/plz/"
    const lastModified = "2018-05-01"
    const changeFrequency = "daily"
    const priority = 0.5
    const expected = example1
    it(`should build the sitemap`, () => {
      const data = { url, lastModified, changeFrequency, priority }
      const result = buildSitemap([data])
      equal(result, expected)
    })
  })

  describe(`urlHasTrailingSlash()`, () => {
    it(`should thing the do slash trailing`, () => {
      const url = "http://plzslashtrail.me/ok"
      const result = urlHasTrailingSlash(url)
      equal()
    })
  })
})

function make_req_res(data) {
  const req = {
    body: {
      message: { data }
    }
  }
  const res = {
    status: function() {
      return {
        send: () => {}
      }
    },
    send: () => {}
  }
  return {
    req,
    res
  }
}
