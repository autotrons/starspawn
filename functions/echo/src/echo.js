const uuid = require("uuid")
const { failure, success } = require("@pheasantplucker/failables-node6")

async function echo(req, res) {
  const id = uuid.v4()
  console.log(`${id} starting`)
  let counter = 0
  return res_ok(res, { id })
}

function res_ok(res, payload) {
  console.info(payload)
  res.status(200).send(success(payload))
  return success(payload)
}

function res_err(res, payload) {
  console.error(payload)
  res.status(500).send(failure(payload))
  return failure(payload)
}

module.exports = {
  echo
}
