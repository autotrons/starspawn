const equal = require("assert").deepEqual
const util = require("util")
const uuid = require(`uuid`)
const { chunk } = require("./chunk")
const exec = util.promisify(require("child_process").exec)

//var myBucket = storage.bucket("starspawn_xmlfeeds")

describe("chunk.js", function() {
  this.timeout(540 * 1000)
  before(() => {})
  it("should chunk a file", async () => {
    const event = {
      data: {
        bucket: "datafeeds",
        name: "full_feed/feed_100.xml.gz",
        metageneration: 1,
        timeCreated: Date.now()
      },
      context: {
        eventType: "et"
      }
    }
    try {
      const result = await chunk(event)
      equal(result.status, "complete")
    } catch (e) {
      console.log(e.toString())
    }
  })
  after(() => {})
})
