const { assertSuccess, payload } = require("@pheasantplucker/failables-node6")
const assert = require("assert")
const equal = assert.deepEqual
const { parse } = require("himalaya")
const { render, getDataFromDatastore, unsanitizeDescriptionHtml } = require("./render")
const {
  createDatastoreClient,
  readEntities,
  getDatastoreKeySymbol
} = require("@pheasantplucker/gc-datastore")

describe("render.js ", () => {
  describe.skip("getDataFromDatastore()", function() {
    this.timeout(540 * 1000)
    it("Should get data from GCE Datastore", async () => {
      const keyName = "63_Apr43245"
      const result = await getDataFromDatastore(keyName)
      assertSuccess(result)
      const data = payload(result)
      assert(typeof data === "object")
    })
  })

  describe('unsanitizeDescriptionHtml()', () => {
    it(`should take a piece of sanitized html and make it renderable`, () => {
      const sanHtml = '&lt;li&gt;Minimum'
      const html = '<li>Minimum'
      const r1 = unsanitizeDescriptionHtml(sanHtml)
      assertSuccess(r1)
      const ret = payload(r1)
      equal(ret, html)
    })
  })

  describe.skip("render()", () => {
    it("Should render an AMP page from a query string", async () => {
      const { req, res } = make_req_res()
      const result = await render(req, res)
      assertSuccess(result)
      const renderedAmp = payload(result)
      const parsed = parse(renderedAmp)
      assert(typeof renderedAmp === "string")
      assert(parsed[0].tagName === "!doctype")
    })
  })
})

function make_req_res() {
  const req = {
    query: {
      jobId: "63_Apr43245"
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
