const equal = require("assert").deepEqual
const { assertSuccess, payload, meta } = require("@pheasantplucker/failables")
const { exists } = require("@pheasantplucker/gc-cloudstorage")
const uuid = require("uuid")
const { unzip } = require("./unzip")
describe("unzip.js", function() {
  this.timeout(540 * 1000)
  describe("unzip()", () => {
    const source_file = "full_feed/feed_100.xml.gz"
    const source_bucket = "datafeeds"
    const target_bucket = "datafeeds"
    const target_file = `unziped/${uuid.v4()}.xml`
    const targetPath = `${target_bucket}/${target_file}`

    it("split up a file", async () => {
      const id = uuid.v4()
      const result = await unzip(id, {
        source_file,
        source_bucket,
        target_bucket,
        target_file
      })
      assertSuccess(result, targetPath)
    })

    it(`should have streamed file`, async () => {
      const result = await exists(targetPath)
      assertSuccess(result, true)
    })
  })
})
