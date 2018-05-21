const uuid = require("uuid")
const ObjectTemplate = require("json2json").ObjectTemplate
const {
  failure,
  payload,
  success,
  isFailure
} = require("@pheasantplucker/failables")

async function translate(req, res) {
  const id = uuid.v4()
  const body = getBodyData(req)
  if (isFailure(body)) return body
  const { data, types, tmpl } = payload(body)
  const merged = await blend(data, types)
  if (isFailure(merged)) return merged
  const mergedResult = payload(merged)
  const translator = await assemble(tmpl, mergedResult)
  if (isFailure(translator)) return translator
  const result = payload(translator)
  return success(result)
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

function blend(obj, src) {
  try {
    Object.keys(src).forEach(key => {
      obj[key] = src[key]
    })
    return success(obj)
  } catch (e) {
    return failure(e.toString(), {
      error: "Couldn't merge objects",
      obj,
      src
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
  blend
}
