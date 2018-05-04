const equal = require("assert").deepEqual
const util = require("util")
const uuid = require(`uuid`)
const { chunk } = require("./chunk")
const exec = util.promisify(require("child_process").exec)

//var myBucket = storage.bucket("starspawn_xmlfeeds")

describe("chunk.js", function() {
  this.timeout(30 * 1000)
  before(() => {})
  it("should chunk a file", async () => {
    const event = {
      data: {
        bucket: "datafeeds",
        name: "full_feed/test_feed.xml.gz",
        metageneration: 1,
        timeCreated: Date.now()
      },
      context: {
        eventType: "et"
      }
    }
    const result = await chunk(event)
    equal(result.status, "complete")
  })
  after(() => {})
})
