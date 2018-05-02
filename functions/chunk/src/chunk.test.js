const equal = require("assert").deepEqual
const util = require("util")
const rp = require("request-promise-native")
const uuid = require(`uuid`)
const { chunk } = require("./chunk")
const exec = util.promisify(require("child_process").exec)

//var myBucket = storage.bucket("starspawn_xmlfeeds")

describe("chunk.js", () => {
  before(() => {})
  it("should chunk a file", async () => {})
  after(() => {})
})
