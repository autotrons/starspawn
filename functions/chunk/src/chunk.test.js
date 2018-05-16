const equal = require("assert").deepEqual
const uuid = require(`uuid`)
const {
  assertSuccess,
  success,
  payload
} = require("@pheasantplucker/failables-node6")
const { chunk, find_blocks, write_blocks, continue_work } = require("./chunk")
const {
  pull,
  ack,
  createSubscription,
  createTopic,
  deleteSubscription,
  deleteTopic
} = require("./pubsub")
const fs = require("fs")
const storage = require("@google-cloud/storage")()
const MEGABYTE = Math.pow(2, 20)

const TOPIC = `test-${uuid.v4()}`
const SUBSCRIPTION = `test-${uuid.v4()}`

describe("chunk.js", function() {
  this.timeout(540 * 1000)
  before("should set shit up", async () => {
    const r1 = await createTopic(TOPIC)
    assertSuccess(r1)
    const r2 = await createSubscription(TOPIC, SUBSCRIPTION)
    assertSuccess(r2)
  })
  describe("write_block", () => {
    it("write blocks to a file", async () => {
      const blocks = ["<job><id>1</id></job>", "<job><id>2</id></job>"]
      const id = "test_" + uuid.v4()
      const filename = `datafeeds/chunks/${id}/1.xml`
      const r1 = await write_blocks(id, filename, blocks, TOPIC)
      assertSuccess(r1)
      const r2 = await exists("datafeeds", `chunks/${id}/1.xml`)
      assertSuccess(r2, true)
      const r3 = await pull(SUBSCRIPTION, 1, false)
      assertSuccess(r3)
      const msg1 = payload(r3)[0].receivedMessages[0]
      equal(msg1.message.attributes.filename, filename)
      const ackId = msg1.ackId
      const r4 = await ack(SUBSCRIPTION, [ackId])
      assertSuccess(r4)
    })
  })
  describe("find_blocks", async () => {
    it("chop the file into blocks of tag pairs", async () => {
      const id = uuid.v4()
      const start_text = "<job>"
      const end_text = "</job>"
      const readstream = fs.createReadStream(__dirname + "/feed_100.xml", {
        start: 0,
        end: 6000
      })
      const result = await find_blocks(readstream, start_text, end_text)
      assertSuccess(result)
      equal(payload(result).blocks.length > 0, true)
    })
  })
  describe("continue_work", async () => {
    it("if we do not need to do more work return false", async () => {
      const id = uuid.v4()
      const filename = "datafeeds/full_feed/feed_100.xml"
      const cursor = Math.pow(2, 10)
      const end_byte_offset = Math.pow(2, 10)
      const start_text = "<job>"
      const end_text = "</job>"
      const result = continue_work(
        id,
        filename,
        cursor,
        end_byte_offset,
        start_text,
        end_text
      )
      equal(result, false)
    })
    it("if we need more work return the payload to the next call", async () => {
      const id = uuid.v4()
      const filename = "datafeeds/full_feed/feed_100.xml"
      const cursor = Math.pow(2, 5)
      const end_byte_offset = Math.pow(2, 10)
      const start_text = "<job>"
      const end_text = "</job>"
      const parse_topic = "chunk_created"
      const continue_topic = "chunk_work"
      const expected = {
        id,
        filename,
        start_byte_offset: cursor,
        end_byte_offset,
        start_text,
        end_text,
        parse_topic,
        continue_topic
      }
      const result = continue_work(
        id,
        filename,
        cursor,
        end_byte_offset,
        start_text,
        end_text,
        parse_topic,
        continue_topic
      )
      equal(JSON.parse(result.data), expected)
    })
  })
  describe("chunk", async () => {
    it("chunk a big xml file into blocks and write the file", async () => {
      const input = {
        filename: "datafeeds/full_feed/feed_500k.xml",
        start_byte_offset: 0,
        end_byte_offset: 1 * Math.pow(2, 20),
        start_text: "<job>",
        end_text: "</job>",
        parse_topic: "chunk_created",
        continue_topic: "chunk_work"
      }
      const { req, res } = make_req_res(input)
      const result = await chunk(req, res)
      assertSuccess(result)
    })
  })
  after("clean up the topic and subscription", async () => {
    const r1 = await deleteTopic(TOPIC)
    assertSuccess(r1)
    const r2 = await deleteSubscription(TOPIC, SUBSCRIPTION)
    assertSuccess(r2)
  })
})

async function exists(bucket, filename) {
  const result = await storage
    .bucket(bucket)
    .file(filename)
    .exists()
  return success(result[0])
}

function make_req_res(data) {
  const req = {
    body: {
      data
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
