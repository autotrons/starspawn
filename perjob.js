const fs = require("fs")
const flow = require("xml-flow")
const inFile = fs.createReadStream("./feed.xml")
const xmlStream = flow(inFile)

let count = 0
xmlStream.on("tag:job", function(person) {
  count += 1
  if(count % 1000 === 0) console.log(count)
})
