const equal = require("assert").deepEqual
const { assertSuccess, payload, meta } = require("@pheasantplucker/failables")
const { exists } = require("@pheasantplucker/gc-cloudstorage")
const uuid = require("uuid")
const { chunk } = require("./chunk")
describe("chunk.js", function() {
  this.timeout(540 * 1000)
  describe("chunk()", () => {
    it("split up a file", async () => {
      const source_file =
        "https://storage.googleapis.com/datafeeds/feed_100.xml"
      const id = uuid.v4()
      const result = await chunk(id, { source_file })
      assertSuccess(result, "foobar")
    })
  })
})
