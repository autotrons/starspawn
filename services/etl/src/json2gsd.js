const uuid = require("uuid")
const ObjectTemplate = require("json2json").ObjectTemplate
const {
  failure,
  payload,
  success,
  isFailure
} = require("@pheasantplucker/failables")

async function json2gsd(req, res) {
  const id = uuid.v4()
  const body = getBodyData(req)
  if (isFailure(body)) return body
  const message = payload(body)
  const merged = await blend(message.jobJson, message.types)
  if (isFailure(merged)) return merged
  const mergedResult = payload(merged)
  const translator = await assemble(message.tmpl, mergedResult)
  if (isFailure(translator)) return translator
  const result = payload(translator)
  return success(result)
}

const getBodyData = req => {
  try {
    if (req.body.message.data) {
      return success(req.body.message.data)
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

function blend(obj) {
  let types = {
    identifierType: "PropertyValue",
    hiringOrganizationType: "Organization",
    postalAddressType: "PostalAddress",
    baseSalaryType: "MonetaryAmount",
    valueType: "QuantitativeValue"
  }
  try {
    Object.keys(types).forEach(key => {
      obj[key] = types[key]
    })
    return success(obj)
  } catch (e) {
    return failure(e.toString(), {
      error: "Couldn't merge objects",
      obj,
      types
    })
  }
}

function res_ok(res, payload) {
  // console.info(payload)
  res.status(200).send(success(payload))
  return success(payload)
}

function res_err(res, payload) {
  // console.error(payload)
  res.status(500).send(failure(payload))
  return failure(payload)
}

module.exports = {
  json2gsd,
  assemble,
  blend
}
