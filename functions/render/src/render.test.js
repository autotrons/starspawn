const { assertSuccess, payload } = require("@pheasantplucker/failables-node6")
const assert = require("assert")
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
      const input = "63_Apr43245"
      const { req, res } = make_req_res(input)
      const result = await render(req, res)
      assertSuccess(result)
      const renderedAmp = payload(result)
    })
  })
})

function make_req_res(attributes) {
  const req = {
    body: {
      attributes
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
