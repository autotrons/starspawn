const { assertSuccess } = require("@pheasantplucker/failables-node6")
const { loader } = require("./loader")
const MEGABYTE = Math.pow(2, 20)

describe("loader.js", function() {
  this.timeout(540 * 1000)
  it("should load a list of jobs into Datastore", async () => {
    const input = {
      start: 1 * MEGABYTE,
      end: 2 * MEGABYTE,
      start_text: "<job>",
      end_text: "</job>"
    }
    const { req, res } = make_req_res(input)
    const result = await loader(req, res)
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
