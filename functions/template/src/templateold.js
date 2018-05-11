const uuid = require("uuid")
const zlib = require("zlib")
const storage = require("@google-cloud/storage")()
const xmlsplit = require("xmlsplit")
const es = require("event-stream")
const fs = require("fs")
const Writable = require("stream").Writable

const gzip = zlib.createUnzip()
const myBucket = storage.bucket("datafeeds")
const spliter = new xmlsplit(10, "job")

const template = async event => {
  const id = uuid.v4()
  console.log(`${id} starting`)
  const file = event.data
  const context = event.context
  const readFileHandle = myBucket.file(file.name)
  const writeFileHandle = myBucket.file(file.name)
  let counter = 0
  console.log(__dirname)
  const ws = Writable()
  ws._write = function(template, enc, next) {
    counter += 1
    const c = counter
    const filename = `templates/${id}/${counter}.xml`
    const f = myBucket.file(filename)
    f.save(
      template,
      {
        validation: false
      },
      err => {
        if (err) {
          console.error("saveError: " + err.toString())
          next()
        } else {
          console.info(`wrote ${filename}`)
          next()
        }
      }
    )
  }
  return new Promise((resolve, reject) => {
    readFileHandle
      .createReadStream()
      .pipe(gzip)
      .pipe(spliter)
      .pipe(ws)
      .on("end", () => {
        console.info(`map complete`)
        resolve({
          id,
          status: "complete"
        })
      })
      .on("error", err => {
        console.error(`${id} ${err.toString()}`)
        reject({
          id,
          status: "error",
          error: err.toString()
        })
      })
  })
}

module.exports = {
  template
}