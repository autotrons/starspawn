const uuid = require("uuid")
const { failure, success } = require("@pheasantplucker/failables-node6")

const storage = require("@google-cloud/storage")()
const myBucket = storage.bucket("datafeeds")

async function render(req, res) {
  const id = uuid.v4()
  console.log(`${id} starting`)
  console.log(req.params)
  console.log(req.url)
  console.log("werxing")
  console.log("got to here")
  //const readFileHandle = myBucket.file(file.name)
  //const writeFileHandle = myBucket.file(file.name)
  let counter = 0
  return res_ok(res, { id })
}

function readSomeData() {
  const readable = getReadableStreamSomehow()
  readable.on("readable", () => {
    let render
    while (null !== (render = readable.read())) {
      console.log(`Received ${render.length} bytes of data.`)
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
  render
}
