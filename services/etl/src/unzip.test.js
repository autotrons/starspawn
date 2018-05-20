const equal = require("assert").deepEqual
const { assertSuccess, payload, meta } = require("@pheasantplucker/failables")
const { exists } = require("@pheasantplucker/gc-cloudstorage")
const uuid = require("uuid")
const { unzip } = require("./unzip")
describe("unzip.js", function() {
  this.timeout(540 * 1000)
  describe("unzip()", () => {
    it("split up a file", async () => {
      const source_file =
        "https://storage.googleapis.com/datafeeds/feed_100.xml"
      const id = uuid.v4()
      const result = await unzip(id, { source_file })
      assertSuccess(result, "foobar")
    })
  })
})
