const uuid = require("uuid")
const { failure, success } = require("@pheasantplucker/failables-node6")

const storage = require("@google-cloud/storage")()
const myBucket = storage.bucket("datafeeds")

async function loader(req, res) {
  const id = uuid.v4()
  console.log(`${id} starting`)

  //const readFileHandle = myBucket.file(file.name)
  //const writeFileHandle = myBucket.file(file.name)
  let counter = 0
  return res_ok(res, { id })
}

function readSomeData() {
  const readable = getReadableStreamSomehow()
  readable.on("readable", () => {
    let loader
    while (null !== (loader = readable.read())) {
      console.log(`Received ${loader.length} bytes of data.`)
    }
  })
}

function res_ok(res, payload) {
  console.info(payload)
  res.status(200).send(success(payload))
  return success(payload)
}

function res_err(res, payload) {
  console.error(payload)
  res.status(500).send(failure(payload))
  return failure(payload)
}

module.exports = {
  loader
}
