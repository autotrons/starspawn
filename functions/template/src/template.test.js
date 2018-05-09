const { assertSuccess } = require("@pheasantplucker/failables-node6")
const { template } = require("./template")
const MEGABYTE = Math.pow(2, 20)

describe("template.js", function() {
  this.timeout(540 * 1000)
  it("should pull a batch of tags between two points in the file", async () => {
    const input = {
      start: 1 * MEGABYTE,
      end: 2 * MEGABYTE,
      start_text: "<job>",
      end_text: "</job>"
    }
    const { req, res } = make_req_res(input)
    const result = await template(req, res)
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
