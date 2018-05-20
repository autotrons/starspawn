const uuid = require("uuid")
const cons = require("consolidate")
const path = require("path")
const he = require('he');
const {
  success,
  failure,
  isFailure,
  payload
} = require("@pheasantplucker/failables")
const {
  createDatastoreClient,
  makeDatastoreKey,
  readEntities
} = require("@pheasantplucker/gc-datastore")

const projectFullName = "starspawn-201921"
const entityKeyKind = "jobs"

async function render(req, res) {
  const id = uuid.v4()
  const jobIdResult = getJobId(req)
  if (isFailure(jobIdResult)) return jobIdResult
  const jobId = payload(jobIdResult)
  const jobDataResult = await getDataFromDatastore(jobId)
  if (isFailure(jobDataResult)) return jobDataResult
  const jobData = payload(jobDataResult)[jobId]

  const r1 = unsanitizeDescriptionHtml(jobData.body)
  if (isFailure(r1)) return r1
  const cleanBody = payload(r1)

  const cleanBodyObj = {body: cleanBody}
  const cleanJobData = Object.assign({}, jobData, cleanBodyObj)

  try {
    const filePath = path.join(__dirname, "../template/index.ejs")
    const html = await cons.ejs(filePath, cleanJobData)
    return res_ok(res, html)
  } catch (e) {
    console.log(e.toString())
    return res_err(res, e.toString())
  }

  return res_err(res, e.toString())
}

async function getDataFromDatastore(keyName) {
  const datastore = createDatastoreClient(projectFullName)
  const entityKeyResult = makeDatastoreKey(entityKeyKind, keyName)
  if (isFailure(entityKeyResult)) return entityKeyResult
  const entityKey = payload(entityKeyResult)
  const entity = await readEntities([entityKey])
  if (isFailure(entity)) return entity
  const jobData = payload(entity)
  return success(jobData)
}

const unsanitizeDescriptionHtml = (sanHtml) => {
  try {
      const decodedHtml = he.unescape(sanHtml)
      return success(decodedHtml)
  } catch (e) {
      return failure(e.toString())
  }
}

const getJobId = req => {
  try {
    if (req.params.jobId) {
      return success(req.params.jobId)
    } else {
      return failure(req, { error: "couldnt access req.query" })
    }
  } catch (e) {
    return failure(e.toString(), {
      error: "couldnt access req.query",
      req: req
    })
  }
}

function res_ok(res, payload) {
  res.status(200).send(payload)
  return success(payload)
}

function res_err(res, payload) {
  console.error(payload)
  res.status(500).send(payload)
  return failure(payload)
}

module.exports = {
  render,
  getDataFromDatastore,
  unsanitizeDescriptionHtml,
}
