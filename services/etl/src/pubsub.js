const PROJECT = 'starspawn-201921'
const pubsub = require('@google-cloud/pubsub')
const pub_client = new pubsub.v1.PublisherClient({})
const sub_client = new pubsub.v1.SubscriberClient({})
const { failure, success } = require('@pheasantplucker/failables-node6')

function createTopic(topic) {
  const formattedName = pub_client.topicPath(PROJECT, topic)
  return pub_client
    .createTopic({ name: formattedName })
    .then(responses => {
      return success(responses)
    })
    .catch(err => {
      return failure(err.toString())
    })
}

function deleteTopic(topic) {
  const formattedName = pub_client.topicPath(PROJECT, topic)
  return pub_client
    .deleteTopic({ topic: formattedName })
    .then(responses => {
      return success(responses)
    })
    .catch(err => {
      return failure(err.toString())
    })
}

function createSubscription(topic, sub) {
  const formattedName = sub_client.subscriptionPath(PROJECT, sub)
  const formattedTopic = sub_client.topicPath(PROJECT, topic)
  const request = {
    name: formattedName,
    topic: formattedTopic,
  }
  return sub_client
    .createSubscription(request)
    .then(responses => {
      return success(responses)
    })
    .catch(err => {
      return failure(err.toString())
    })
}

function deleteSubscription(topic, sub) {
  const formattedName = sub_client.subscriptionPath(PROJECT, sub)
  return sub_client
    .deleteSubscription({ subscription: formattedName })
    .then(responses => {
      return success(responses)
    })
    .catch(err => {
      return failure(err.toString())
    })
}

function publish(topic, messagesElement) {
  const formattedTopic = pub_client.topicPath(PROJECT, topic)
  const messages = [messagesElement]
  const request = {
    topic: formattedTopic,
    messages: messages,
  }
  return pub_client
    .publish(request)
    .then(responses => {
      const response = responses[0]
      return success(response)
    })
    .catch(err => {
      console.log(err)
      return failure(err.toString())
    })
}

function pull(sub, maxMessages) {
  var formattedSubscription = sub_client.subscriptionPath(PROJECT, sub)
  var request = {
    subscription: formattedSubscription,
    maxMessages,
    returnImmediately: false,
  }
  return sub_client
    .pull(request)
    .then(responses => {
      return success(responses)
    })
    .catch(err => {
      return failure(err.toString())
    })
}

function ack(sub, ackIds) {
  const formattedSubscription = sub_client.subscriptionPath(PROJECT, sub)
  const request = {
    subscription: formattedSubscription,
    ackIds: ackIds,
  }
  return sub_client
    .acknowledge(request)
    .then(res => {
      return success(res)
    })
    .catch(err => {
      return failure(err.toString())
    })
}

module.exports = {
  pull,
  ack,
  publish,
  createTopic,
  createSubscription,
  deleteTopic,
  deleteSubscription,
}
