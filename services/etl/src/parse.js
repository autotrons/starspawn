const uuid = require('uuid')
const {
  failure,
  success,
  isFailure,
  payload,
} = require('@pheasantplucker/failables')
const storage = require('@google-cloud/storage')()
const xml2js = require('xml2js')
const rp = require('request-promise')
const parser = new xml2js.Parser({ explicitArray: false, trim: true })
const {
  createBucket,
  bucketExists,
  uploadFile,
  exists,
  save,
  getFile,
} = require('@pheasantplucker/gc-cloudstorage')

async function parse(req, res) {
  const id = uuid.v4()
  // console.log(`${id} starting`)
  const r1 = getAttributes(req)
  if (isFailure(r1)) return r1
  const attrs = payload(r1)
  const filePath = attrs.fileName

  const r2 = await getFile(filePath)
  if (isFailure(r2)) return r2
  const xmlFile = payload(r2)

  const r3 = await parseXmlToJson(xmlFile)
  if (isFailure(r3)) return r3
  const jsonJobs = payload(r3)

  var options = {
    method: 'POST',
    uri: 'https://us-central1-starspawn-201921.cloudfunctions.net/loader',
    body: { attributes: jsonJobs.root.job },
    json: true, // Automatically stringifies the body to JSON
  }

  const postToLoader = await rp(options)

  // console.log(`postToLoader:`, postToLoader)

  return res_ok(res, { id, postToLoader })
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

function res_ok(res, payload) {
  res.status(200).send(success(payload))
  return success(payload)
}

function res_err(res, payload) {
  res.status(500).send(failure(payload))
  return failure(payload)
}

const getAttributes = req => {
  try {
    if (req.body.message.data) {
      return success(req.body.message.data)
    } else {
      return failure(req, { error: 'couldnt access req.body.message.data' })
    }
  } catch (e) {
    return failure(e.toString(), {
      error: 'couldnt access req.body.message.data',
      req: req,
    })
  }
}

module.exports = {
  parse,
  parseXmlToJson,
}
