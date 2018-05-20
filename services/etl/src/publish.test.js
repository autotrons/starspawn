const { assertSuccess } = require(`@pheasantplucker/failables`)

describe(`publish.js`, () => {
  const topicName = `etl-test-${uuid.v4()}`
  it(`should publish a message`, async () => {
    const body = {
      truth: true
    }
    const message = {data: body}
    const result = await publish(topicName, message)
    assertSuccess(result)
  })
})
