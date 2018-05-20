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
async function publish(id, topic, msg) {
  const { topic, msg } = data
  const res1 = createPublisher(PROJECT_ID)
  const topicResult = await createTopic(topic)
  if (isFailure(topicResult)) return topicResult
  const publishResult = await publishJson(topic, msg)
  if (isFailure(publishResult)) return publishResult
  return success(data)
}

module.exports = {
  publish
}
