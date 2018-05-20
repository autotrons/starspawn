const uuid = require("uuid")
const ObjectTemplate = require("json2json").ObjectTemplate
const {
  failure,
  payload,
  success,
  isFailure
} = require("@pheasantplucker/failables-node6")

async function translate(req, res) {
  const id = uuid.v4()
  console.log(`${id} starting...`)
  const bodyData = getBodyData(req)
  if (isFailure(bodyData)) return bodyData
  const dataResult = payload(bodyData)
  const extended = extend(dataResult.data, dataResult.types)
  if (isFailure(extended)) return extended
  const extendedResult = payload(extended)
  console.log(extendedResult)
  const assembly = await assemble(dataResult.tmpl, extendedResult)
  if (isFailure(assembly)) return assembly
  const result = payload(assembly)
  console.log(JSON.parse(result))
  return res_ok(res, { result })
}

function extend(obj, src) {
  try {
    let result = Object.keys(src).forEach(function(key) {
      obj[key] = src[key]
      return obj
    })
    return success(result)
  } catch (e) {
    return failure(e.toString(), {
      error: "Could not merge objects",
      obj,
      src
    })
  }
}

const getBodyData = req => {
  try {
    if (req.body.data) {
      return success(req.body)
    } else {
      return failure(req, { error: "couldnt access req.data" })
    }
  } catch (e) {
    return failure(e.toString(), {
      error: "couldnt access req.data",
      req: req
    })
  }
}

async function assemble(tmpl, data) {
  try {
    const result = new ObjectTemplate(tmpl).transform(data)
    return success(result)
  } catch (e) {
    return failure(e.toString(), {
      error: "Couldn't translate template/data",
      tmpl,
      data
    })
  }
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
  translate,
  assemble,
  extend
}
