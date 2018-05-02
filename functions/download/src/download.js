const uuid = require("uuid")
var storage = require("@google-cloud/storage")()
var myBucket = storage.bucket("datafeeds")
const get = require("simple-get")

const download = async (req, res) => {
  const id = uuid.v4()
  console.log(`${id} starting`)
  const file = myBucket.file(`${id}.xml.gz`)
  get("git stat", function(err, res) {
    if (err) {
      console.error(`${id} ${err.toString()}`)
    }
    console.log(`${id} ${res.statusCode}`)
    res
      .pipe(file.createWriteStream())
      .on("error", function(err) {
        console.error(`${id} ${err.toString()}`)
      })
      .on("finish", function() {
        console.log(`${id} complete`)
      }) // `res` is a stream
  })

  res.send({ id, status: "downloading" })
}

module.exports = {
  download
}
