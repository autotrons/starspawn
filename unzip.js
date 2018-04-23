const zlib = require("zlib")
const XmlSplit = require("xmlsplit")
const fs = require("fs")

const gzip = zlib.createUnzip()
const inp = fs.createReadStream("./samples/feed.xml.gz")
const xmlsplit = new XmlSplit(100, "job")
const inputStream = fs.createReadStream("./samples/feed.xml") // from somewhere

let counter = 0
inp
  .pipe(gzip)
  .pipe(xmlsplit)
  .on("data", function(data) {
    counter += 1
    const filename = `${counter}.xml`
    fs.writeFile(filename, data.toString(), () => {
      console.log(filename)
      inputStream.destroy()
    })
  })
