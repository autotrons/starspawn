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
const target_bucket = `datafeeds/parsed`
const sanitizeHtml = require('sanitize-html')
const { map } = require('ramda')

async function parse(id, data) {
  try {
    return do_file_things(id, data)
  } catch (e) {
    return failure(e.toString())
  }
}

async function do_file_things(id, data) {
  let { filePath } = data

  const r2 = await getFile(filePath)
  if (isFailure(r2)) return r2
  const xmlFile = payload(r2)

  const r3 = await parseXmlToJson(xmlFile)
  if (isFailure(r3)) return r3
  const json = payload(r3)

  const r4 = await cleanAllJobBodies(json)
  if (isFailure(r4)) return r4
  const cleanJson = payload(r4)

  const r5 = await addGoogleStructuredData(cleanJson)
  if (isFailure(r5)) return r5
  const gsd = payload(r5)

  const jsonJobs = { root: { job: gsd } }

  const subid = uuid.v4()
  const target_file = `${target_bucket}/${id}/${subid}.json`
  const r6 = await save(target_file, JSON.stringify(jsonJobs))
  if (isFailure(r6)) return r6

  return success({ id, jsonJobs, target_file })
}

function addGoogleStructuredData(json) {
  const gsd = map(j => {
    const r1 = json2gsd(j)
    if (isFailure(r1)) return r1
    const gsdJob = payload(r1).rendered
    return Object.assign({}, j, { gsd: gsdJob })
  }, json.root.job)
  return success(gsd)
}

async function cleanAllJobBodies(json) {
  const cleaned = await json.root.job.map(function(job) {
    const r1 = cleanHtmlBody(job.body)
    if (isFailure(r1)) return r1
    const cleanBody = payload(r1)
    const newJob = Object.assign({}, job, { body: cleanBody })
    return newJob
  })
  return success({ root: { job: cleaned } })
}

function cleanHtmlBody(dirtyHtml) {
  try {
    return success(sanitizeHtml(dirtyHtml))
  } catch (e) {
    return failure(e.toString())
  }
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
  cleanHtmlBody,
  cleanAllJobBodies,
}
