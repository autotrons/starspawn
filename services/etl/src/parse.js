const uuid = require("uuid")
const {
  failure,
  success,
  isFailure,
  payload
} = require("@pheasantplucker/failables")
const storage = require("@google-cloud/storage")()
const xml2js = require("xml2js")
const parser = new xml2js.Parser({ explicitArray: false, trim: true })
const {
  createBucket,
  bucketExists,
  uploadFile,
  exists,
  save,
  getFile
} = require("@pheasantplucker/gc-cloudstorage")

async function parse(id, data) {
  const filePath = data

  const r2 = await getFile(filePath)
  if (isFailure(r2)) return r2
  const xmlFile = payload(r2)

  const r3 = await parseXmlToJson(xmlFile)
  if (isFailure(r3)) return r3
  const jsonJobs = payload(r3)

  return success({ id, jsonJobs })
}

function parseXmlToJson(xml) {
  try {
    let json = {}
    const parsedToJson = parser.parseString(xml, function(err, result) {
      json = result
    })
    return success(json)
  } catch (e) {
    return failure(e.toString())
  }
}

module.exports = {
  parse,
  parseXmlToJson
}
