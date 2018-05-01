const equal = require("assert").deepEqual
const util = require("util")
const rp = require("request-promise-native")
const uuid = require(`uuid`)
const { download } = require("./index")
const exec = util.promisify(require("child_process").exec)
var storage = require("@google-cloud/storage")()

var myBucket = storage.bucket("starspawn_xmlfeeds")

describe("download.js", () => {
  before(() => {})
  it("should download a file", async () => {
    const name = uuid.v4()
    const req = {
      body: {
        url: "https://storage.googleapis.com/starspawn_tests/feed.xml.gz"
      }
    }
    const res = {
      send: () => {}
    }
    download(req, res)
    const result = await rp("https://google.com")
  })
  after(() => {})
})
