const { failure, success } = require('@pheasantplucker/failables')

async function health_check(id, data) {
  try {
    return success()
  } catch (e) {
    return failure(e.toString())
  }
}

module.exports = {
  health_check,
}
