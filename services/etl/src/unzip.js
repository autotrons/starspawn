const {
  isFailure,
  failure,
  success,
  payload
} = require("@pheasantplucker/failables")
const { save } = require("@pheasantplucker/gc-cloudstorage")

async function unzip(id, data) {
  try {
    let { source_file } = data

    return success("foobar")
  } catch (e) {
    return failure(e.toString())
  }
}

module.exports = {
  unzip
}
