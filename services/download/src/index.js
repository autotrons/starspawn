const storage = require("@google-cloud/storage")()
const download = async (req, res) => {
  console.log("some log message")
  res.send("Downloading this shit")
}

module.exports = {
  download
}
