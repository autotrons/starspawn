const equal = require("assert").deepEqual
const { setupPubSub, TOPICS } = require("./etl.js")
const { assertSuccess, payload, meta } = require("@pheasantplucker/failables")
const { exists } = require("@pheasantplucker/gc-cloudstorage")
const { topicExists } = require("@pheasantplucker/gc-pubsub")
const uuid = require("uuid")
const rp = require("request-promise")

async function health_check(id) {
  const options = {
    uri: "http://localhost:8080/health_check",
    method: "POST",
    headers: {
      "User-Agent": "Request-Promise"
    },
    body: { message: { data: { id } } },
    json: true // Automatically stringifies the body to JSON
  }
  const result = await rp(options)
  return result
}

describe("etl.js", function() {
  this.timeout(540 * 1000)

  describe(`setupPubSub()`, () => {
    it(`should setup topics`, async () => {
      const result = await setupPubSub()
      assertSuccess(result)
    })

    TOPICS.forEach(topic => {
      it(`should have created the topic: ${topic}`, async () => {
        const result = await topicExists(topic)
        assertSuccess(result)
      })
    })
  })
  
  describe("/health_check", () => {
    it("should return the id in a payload", async () => {
      const id = uuid.v4()
      const result = await health_check(id)
      assertSuccess(result)
    })
  })
})
