const XmlSplit = require("xmlsplit")
const fs = require("fs")

const xmlsplit = new XmlSplit(1000, "job")
const inputStream = fs.createReadStream("./feed.xml") // from somewhere

let counter = 0
inputStream.pipe(xmlsplit).on("data", function(data) {
  counter += 1
  const filename = `${counter}.xml`
  fs.writeFile(filename, data.toString(), ()=> {
      console.log(filename)
  })
})
