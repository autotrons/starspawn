const assert = require("assert")
const { assertSuccess, payload } = require("@pheasantplucker/failables")
const { translate, assemble, blend } = require("./translate")
const { data, types, tmpl } = require("./mocks")

describe("translate.js", function() {
  describe("translate()", function() {
    it("Should return success and a result of rendered data", async function() {
      const input = { data, types, tmpl }
      const { req, res } = make_req_res(input)
      const result = await translate(req, res)
      assert(typeof result === "object")
      assertSuccess(result)
    })
  })
  describe("assemble()", function() {
    it("should add template and data", async function() {
      const input = {}
      const { req, res } = make_req_res(input)
      const result = await assemble(req, res)
      assert(typeof result === "object")
      assertSuccess(result)
    })
  })
  describe("blend()", function() {
    it("should combine two objects", () => {
      const result = blend(data, types)
      const ext = payload(result)
      assert(typeof ext === "object")
      assertSuccess(result)
    })
  })
})

function make_req_res(body) {
  const req = {
    body
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
