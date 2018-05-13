const equal = require("assert").deepEqual
const { assertSuccess } = require("@pheasantplucker/failables-node6")
const { chunk, find_file_offsets, split_at } = require("./chunk")
const MEGABYTE = Math.pow(2, 20)
const fs = require("fs")

describe("chunk.js", function() {
  this.timeout(540 * 1000)
  it("split_at should return two strings split at index", async () => {
    const text = "<job></job>"
    const result = split_at(text, 5)
    equal(result, ["<job>", "</job>"])
  })
  it("should process a batch of tags between two points in the file", async () => {
    const start_text = "<job>"
    const end_text = "</job>"
    const readstream = fs.createReadStream(__dirname + "/feed_100.xml", {
      start: 0,
      end: 6000
    })
    const result = await find_file_offsets(readstream, start_text, end_text, 2)
    assertSuccess(result, [[63, 1964], [1969, 3868], [3873, 5773]])
  })
  it.skip("should pull a batch of tags between two points in the file", async () => {
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
