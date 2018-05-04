const uuid = require("uuid")
const zlib = require("zlib")
const storage = require("@google-cloud/storage")()
const xmlsplit = require("xmlsplit")
const es = require("event-stream")
const fs = require("fs")
const gzip = zlib.createUnzip()
const myBucket = storage.bucket("datafeeds")
const spliter = new xmlsplit(10000, "job")

const chunk = async event => {
  const id = uuid.v4()
  console.log(`${id} starting`)
  const file = event.data
  const context = event.context
  const readFileHandle = myBucket.file(file.name)
  let counter = 0
  console.log(__dirname)
  return new Promise((resolve, reject) => {
    readFileHandle
      .createReadStream()
      .pipe(gzip)
      .pipe(spliter)
      //.pipe(fs.createWriteStream("foo.xml"))
      .pipe(
        es.through(
          function write(data) {
            counter += 1
            const c = counter
            const filename = `chunk${counter}.xml`
            //const f = myBucket.file(filename)
            fs.writeFile(filename, data, () => {
              console.info(`wrote ${filename}`)
              //callback(null, c.toString())
              this.emit("data", c.toString())
            })

            //this.pause()
          },
          function end() {
            //optional
            console.log("through end")
            this.emit("end")
          }
        )
      )
      .on("end", () => {
        console.info(`map complete`)
        resolve({ id, status: "complete" })
        process.exit(0)
      })
      .on("error", err => {
        console.error(`${id} ${err.toString()}`)
        reject({ id, status: "error", error: err.toString() })
      })
  })
}

module.exports = {
  chunk
}

// console.log(`Event ${context.eventId}`)
// console.log(`Event Type: ${context.eventType}`)
// console.log(`Bucket: ${file.bucket}`)
// console.log(`File: ${file.name}`)
// console.log(`Metageneration: ${file.metageneration}`)
// console.log(`Created: ${file.timeCreated}`)
// console.log(`Updated: ${file.updated}`)
// console.log(`ResourceState: ${file.resourceState}`)
