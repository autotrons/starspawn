const ObjectTemplate = require("json2json").ObjectTemplate
const {
  failure,
  payload,
  success,
  isFailure
} = require("@pheasantplucker/failables")

async function json2gsd(id, data) {
  let { jobJson, tmpl } = data
  const r1 = mergeMeta(jobJson)
  if (isFailure(r1)) return r1
  const r1Result = payload(r1)
  const r2 = await assemble(tmpl, r1Result)
  if (isFailure(r2)) return r2
  const r2Result = payload(r2)
  return success(r2Result)
}

async function assemble(tmpl, data, meta) {
  try {
    const r1 = new ObjectTemplate(tmpl).transform(data)
    const r1Result = {
      rendered: r1,
      meta: meta
    }
    return success(r1Result)
  } catch (e) {
    return failure(e.toString(), {
      error: "could not translate template/data",
      tmpl,
      data,
      meta
    })
  }
}

function mergeMeta(jobJson) {
  let types = {
    identifierType: "PropertyValue",
    hiringOrganizationType: "Organization",
    postalAddressType: "PostalAddress",
    baseSalaryType: "MonetaryAmount",
    valueType: "QuantitativeValue",
    jobPostingContext: "http://schema.org",
    jobPostingType: "jobPosting"
  }
  try {
    Object.keys(types).forEach(key => {
      jobJson[key] = types[key]
    })
    return success(jobJson)
  } catch (e) {
    return failure(e.toString(), {
      error: "Couldn't merge objects",
      jobJson,
      types
    })
  }
}

module.exports = {
  json2gsd,
  assemble,
  mergeMeta
}
