const uuid = require('uuid')
const rp = require('request-promise')
const equal = require('assert').deepEqual
const { assertSuccess, payload } = require(`@pheasantplucker/failables`)
const { start, stop } = require('./etl')
const {
  pull,
  createSubscriber,
  createSubscription,
} = require('@pheasantplucker/gc-pubsub')

const PROJECT_ID = 'starspawn-201921'

async function publish(id, topic, msg) {
  const options = {
    uri: 'http://localhost:8080/publish',
    method: 'POST',
    headers: {
      'User-Agent': 'Request-Promise',
    },
    body: { message: { data: { id, topic, msg } } },
    json: true, // Automatically stringifies the body to JSON
  }
  const result = await rp(options)
  return result
}

describe(`publish.js`, function() {
  this.timeout(540 * 1000)

  before(async () => {
    await start()
  })
  after(() => {
    stop()
  })
  const id = uuid.v4()
  const topic = `etl_test_${uuid.v4()}`
  const sub = `etl_test_${uuid.v4()}`
  it(`should publish a message`, async () => {
    const body = {
      truth: true,
    }
    const message = { data: body }
    const result = await publish(id, topic, message)
    assertSuccess(result)
  })
})
