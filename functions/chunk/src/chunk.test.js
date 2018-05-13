const equal = require("assert").deepEqual
const uuid = require(`uuid`)
const { assertSuccess, success } = require("@pheasantplucker/failables-node6")
const { pull } = require("@pheasantplucker/gc-pubsub-node6")
const { chunk, pipeline, write_blocks } = require("./chunk")
const fs = require("fs")
const storage = require("@google-cloud/storage")()
const MEGABYTE = Math.pow(2, 20)

describe("chunk.js", function() {
  this.timeout(540 * 1000)
  describe("write_block", async () => {
    it("write blocks to a file", async () => {
      const blocks = ["<job><id>1</id></job>", "<job><id>2</id></job>"]
      const id = "test_" + uuid.v4()
      const result = await write_blocks(
        id,
        `datafeeds/chunks/${id}/1.xml`,
        blocks
      )
      assertSuccess(result)
      const r2 = await exists("datafeeds", `chunks/${id}/1.xml`)
      assertSuccess(r2, true)
      const maxMessages = 1
      const subscriptionName = "chunk_created"
      const r3 = await pull(subscriptionName, maxMessages)
      console.log(r3)
      assertSuccess(r3)
    })
  })
  describe("pipeline", async () => {
    it("chop the file into blocks of tag pairs", async () => {
      const start_text = "<job>"
      const end_text = "</job>"
      const readstream = fs.createReadStream(__dirname + "/feed_100.xml", {
        start: 0,
        end: 6000
      })
      const result = await pipeline(readstream, start_text, end_text)
      assertSuccess(result, [[61, 1962], [1967, 3866], [3871, 5771]])
    })
  })
  describe("chunk", async () => {
    it.skip("chunk a big xml file into blocks and write the file", async () => {
      const input = {
        filename: "datafeeds/full_feed/feed_100.xml",
        start_byte_offset: 0,
        end_byte_offset: 200,
        start_text: "<job>",
        end_text: "</job>"
      }
      const { req, res } = make_req_res(input)
      const result = await chunk(req, res)
      assertSuccess(result)
    })
  })
})

async function exists(bucket, filename) {
  const result = await storage
    .bucket(bucket)
    .file(filename)
    .exists()
  return success(result[0])
}

function make_req_res(attributes) {
  const req = {
    body: {
      attributes
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
