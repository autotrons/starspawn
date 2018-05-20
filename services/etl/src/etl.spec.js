const equal = require("assert").deepEqual
const { start, stop, setENV, sendEmail } = require("./etl.js")
const { assertSuccess, payload } = require("@pheasantplucker/failables")
const uuid = require("uuid")
const rp = require("request-promise")

async function download(id, source_url) {
  const options = {
    uri: "http://localhost:8080/download",
    method: "POST",
    headers: {
      "User-Agent": "Request-Promise"
    },
    body: { message: { data: { id, source_url } } },
    json: true // Automatically stringifies the body to JSON
  }
  const result = await rp(options)
  return result
}

describe("etl.js", function() {
  this.timeout(30 * 1000)
  before(async () => {
    await start()
  })
  after(() => {
    stop()
  })
  describe("/download", () => {
    it("download a file", async () => {
      const id = uuid.v4()
      const result = await download(id, "https://foo/bar")
      assertSuccess(result)
      equal(payload(result).id, id)
    })
  })
})
