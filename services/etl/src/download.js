const {
  isFailure,
  failure,
  success,
  payload
} = require("@pheasantplucker/failables")
const get = require("simple-get")
const { createWriteStream } = require("@pheasantplucker/gc-cloudstorage")
const {} = require("@pheasantplucker/gc-pubsub")

async function download(id, data) {
  try {
    let { source_url, target_file } = data
    return stream_to_storage(source_url, target_file)
  } catch (e) {
    return failure(e.toString())
  }
}

async function stream_to_storage(source_url, target_file) {
  const r1 = await createWriteStream(target_file)
  if (isFailure(r1)) return r1
  const write_stream = payload(r1)
  return new Promise(resolve => {
    get(source_url, function(err, getResponse) {
      if (err) {
        resolve(failure(err.toString()))
        return
      }

      getResponse
        .pipe(write_stream)
        .on("error", function(err) {
          console.log("here")
          resolve(failure(err.toString()))
        })
        .on("finish", function() {
          console.log("finish")
          resolve(success())
        })
    })
  })
}

module.exports = {
  download
}
