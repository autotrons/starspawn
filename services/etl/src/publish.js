const {
  isFailure,
  failure,
  success,
  payload
} = require("@pheasantplucker/failables")
const {
  publishJson,
  createPublisher,
  createTopic
} = require("@pheasantplucker/gc-pubsub")

const PROJECT_ID = "starspawn-201921"
async function publish(id, data) {
  const { topic, msg } = data
  const res1 = createPublisher(PROJECT_ID)
  const topicResult = await createTopic(topic)
  if (isFailure(topicResult)) return topicResult
  return publishJson(topic, msg)
}

module.exports = {
  publish
}
