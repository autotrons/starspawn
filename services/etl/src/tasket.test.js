const equal = require("assert").deepEqual
const {
  assertSuccess,
  assertFailure,
  payload,
  meta
} = require("@pheasantplucker/failables")
const { tasket_ok, tasket_err } = require("./tasket")
const uuid = require("uuid")

describe.skip("tasket.js", function() {
  describe("tasket_ok()", () => {
    it("create a new tasket_ok from nothing", () => {
      const result = tasket_ok()
      assertSuccess(result)
      equal(meta(result).id)
      equal(meta(result).dt < 10, true)
      equal(meta(result).wn, "tasket_test")
    })
    it("create a new ok tasket", () => {
      const id = uuid.v4()
      const result = tasket_ok(
        {},
        {},
        { id, st: Date.now(), wn: "tasket_test" }
      )
      assertSuccess(result)
      equal(meta(result).id, id)
      equal(meta(result).dt < 10, true)
      equal(meta(result).wn, "tasket_test")
    })
    it("create a err tasket", () => {
      const id = uuid.v4()
      const result = tasket_err({}, { id, st: Date.now(), wn: "tasket_test" })
      assertFailure(result)
      equal(meta(result).id, id)
      equal(meta(result).dt < 10, true)
      equal(meta(result).wn, "tasket_test")
    })
  })
})
