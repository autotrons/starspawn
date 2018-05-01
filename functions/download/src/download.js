const uuid = require("uuid")
const download = async (req, res) => {
  const id = uuid.v4()
  console.log(`uuid ${id}`)
  res.send(`v1 ${id}`)
}

module.exports = {
  download
}
