const uuid = require("uuid")
var storage = require("@google-cloud/storage")()
var myBucket = storage.bucket("datafeeds")

const download = async (req, downloadResponse) => {
  const id = uuid.v4()
  console.log(`${id} starting`)
  downloadResponse.status(200).send({ id, status: "complete" })
}

module.exports = {
  download
}
