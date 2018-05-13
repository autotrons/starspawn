const { assertSuccess } = require("@pheasantplucker/failables-node6")
const { parse } = require("./parse")

describe("parse.js", function() {
  this.timeout(540 * 1000)
  it("should pull a batch of tags between two points in the file", async () => {
    const input = {}
    const { req, res } = make_req_res(input)
    const result = await parse(req, res)
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
