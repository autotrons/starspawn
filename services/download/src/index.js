const storage = require("@google-cloud/storage")()
const download = async (req, res) => {
  res.send("Downloading this shit")
}

module.exports = {
  download
}
