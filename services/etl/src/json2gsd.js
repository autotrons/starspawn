const { ObjectTemplate } = require('json2json')
const {
  failure,
  payload,
  success,
  isFailure,
} = require('@pheasantplucker/failables')
const APPCAST_TEMPLATE = require('../templates/appcast.json')

function json2gsd(jobs) {
  const r1 = mergeMeta(jobs)
  if (isFailure(r1)) return r1
  const merged = payload(r1)
  return assemble(APPCAST_TEMPLATE, merged)
}

function assemble(tmpl, data) {
  try {
    const r1 = new ObjectTemplate(tmpl).transform(data)
    return success({ rendered: r1 })
  } catch (e) {
    return failure(e.toString(), {
      error: 'could not translate template/data',
      tmpl,
      data,
    })
  }
}

function mergeMeta(jobJson) {
  let types = {
    identifierType: 'PropertyValue',
    hiringOrganizationType: 'Organization',
    postalAddressType: 'PostalAddress',
    baseSalaryType: 'MonetaryAmount',
    valueType: 'QuantitativeValue',
    jobPostingContext: 'http://schema.org',
    jobPostingType: 'jobPosting',
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
      types,
    })
  }
}

module.exports = {
  json2gsd,
  assemble,
  mergeMeta,
}
