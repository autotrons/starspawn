const assert = require("assert")
const { assertSuccess } = require("@pheasantplucker/failables-node6")
const { translate, assemble, extend } = require("./translate")
const { data, types, tmpl } = require("./mocks")

describe("translate.js", function() {
  describe("translate()", function() {
    it("Should return a success and an id", async function() {
      const input = { data, types, tmpl }
      const { req, res } = make_req_res(input)
      const result = await translate(req, res)
      assert(typeof result === "object")
      assertSuccess(result)
    })
  })
  describe("assemble()", function() {
    it("should return an object and success", async function() {
      const input = {}
      const { req, res } = make_req_res(input)
      const result = await assemble(req, res)
      assert(typeof result === "object")
      assertSuccess(result)
    })
  })
  describe("extend()", function() {
    it("should combine two objects", () => {
      //console.log(data, types)
      const extended = extend(data, types)
      assert(typeof extended === "object")
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
