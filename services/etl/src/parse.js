const {
  failure,
  success,
  isFailure,
  payload,
} = require('@pheasantplucker/failables')
const xml2js = require('xml2js')
const uuid = require('uuid')
const { json2gsd } = require('./json2gsd.js')
const parser = new xml2js.Parser({ explicitArray: false, trim: true })
const { getFile, save } = require('@pheasantplucker/gc-cloudstorage')
const target_bucket = `datafeeds/parsed/`

async function parse(id, data) {
  try {
    return do_file_things(id, data)
  } catch (e) {
    return failure(e.toString())
  }
}

async function do_file_things(id, data) {
  const filePath = data

  const r2 = await getFile(filePath)
  if (isFailure(r2)) return r2
  const xmlFile = payload(r2)

  const r3 = await parseXmlToJson(xmlFile)
  if (isFailure(r3)) return r3
  const json = payload(r3)

  const r4 = await addGoogleStructuredData(json)
  if (isFailure(r4)) return r4
  const gsd = payload(r4)

  const jsonJobs = { root: { job: gsd } }

  const subid = uuid.v4()
  const filename = `${target_bucket}${id}/${subid}.json`
  const r5 = await save(filename, JSON.stringify(jsonJobs))
  if (isFailure(r5)) return r5

  return success({ id, jsonJobs, filename })
}

async function addGoogleStructuredData(json) {
  const gsd = await json.root.job.map(function(job) {
    const r1 = json2gsd(job)
    if (isFailure(r1)) return r1
    const gsdJob = payload(r1).rendered
    const newJob = Object.assign({}, job, { gsd: gsdJob })
    return newJob
  })
  return success(gsd)
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
