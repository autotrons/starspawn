const {
  failure,
  success,
  isFailure,
  payload,
} = require('@pheasantplucker/failables')
const xml2js = require('xml2js')
const { json2gsd } = require('./json2gsd.js')
const parser = new xml2js.Parser({ explicitArray: false, trim: true })
const { getFile } = require('@pheasantplucker/gc-cloudstorage')

async function parse(id, data) {
  const filePath = data

  const r2 = await getFile(filePath)
  if (isFailure(r2)) return r2
  const xmlFile = payload(r2)

  const r3 = await parseXmlToJson(xmlFile)
  if (isFailure(r3)) return r3
  const json = payload(r3)

  const gsd = await json.root.job.map(function(job) {
    const thisJob = job
    const r1 = json2gsd(thisJob)
    if (isFailure(r1)) return r1
    const gsdJob = payload(r1).rendered
    const newJob = Object.assign({}, thisJob, { gsd: gsdJob })

    return newJob
  })

  const jsonJobs = { root: { job: gsd } }

  return success({ id, jsonJobs })
}

function parseXmlToJson(xml) {
  try {
    let json = {}
    parser.parseString(xml, function(err, result) {
      json = result
    })
    return success(json)
  } catch (e) {
    return failure(e.toString())
  }
}

module.exports = {
  parse,
  parseXmlToJson,
}
