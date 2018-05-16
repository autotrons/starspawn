const { assertSuccess } = require("@pheasantplucker/failables-node6")
const { echo } = require("./echo")
const MEGABYTE = Math.pow(2, 20)

describe("echo.js", function() {
  this.timeout(540 * 1000)
  const input = {}
  it("should return a success failable", async () => {
    const { req, res } = make_req_res(input)
    const result = await echo(req, res)
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
