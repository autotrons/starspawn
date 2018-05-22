const assert = require("assert")
const { assertSuccess, payload } = require("@pheasantplucker/failables")
const { json2gsd, assemble, blend } = require("./json2gsd")
const { jobJson, types, tmpl } = require("./mocks")

describe("json2gsd.js", function() {
  describe("json2gsd()", function() {
    it("Should return success and a result of rendered data", async function() {
      const input = { jobJson, types, tmpl }
      const { req, res } = make_req_res(input)
      const result = await json2gsd(req, res)
      const re = payload(result)
      console.log(re)
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
      const result = blend(jobJson, types)
      const ext = payload(result)
      assert(typeof ext === "object")
      assertSuccess(result)
    })
  })
})

function make_req_res(data) {
  const req = {
    body: {
      message: {
        data
      }
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
