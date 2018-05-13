const { assertSuccess, payload } = require("@pheasantplucker/failables-node6")
const assert = require("assert")
const { parse } = require("himalaya")
const { render, getDataFromDatastore } = require("./render")
const {
  createDatastoreClient,
  // makeDatastoreKey,
  // makeEntityByName,
  // writeEntity,
  // deleteEntity,
  readEntities,
  // formatResponse,
  // createQueryObj,
  // runQuery,
  // runQueryKeysOnly,
  // deleteByKey,
  // getRawEntitiesByKeys,
  // formatKeyResponse,
  getDatastoreKeySymbol
} = require("@pheasantplucker/gc-datastore")

describe("render.js ", () => {
  describe("getDataFromDatastore()", function() {
    this.timeout(540 * 1000)
    it("Should get data from GCE Datastore", async () => {
      const keyName = "63_Apr43245"
      const result = await getDataFromDatastore(keyName)
      assertSuccess(result)
      const data = payload(result)
      assert(typeof data === "object")
    })
  })

  describe("renderer()", function() {
    it("render an AMP page from a payload", async () => {
      const { req, res } = make_req_res()
      const result = await render(req, res)
      assertSuccess(result)
      const renderedAmp = payload(result)
      const parsed = parse(renderedAmp)
      assert(typeof renderedAmp === "string")
      assert(parsed[0].tagName == "!doctype")
      assert(parsed[2].tagName === "html")
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
