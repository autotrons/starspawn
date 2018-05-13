const uuid = require("uuid")
const datastore = require("@google-cloud/datastore")
const cons = require("consolidate")
const path = require("path")
const {
  success,
  failure,
  isFailure,
  payload
} = require("@pheasantplucker/failables-node6")
const {
  createDatastoreClient,
  makeDatastoreKey,
  makeEntityByName,
  writeEntity,
  // deleteEntity,
  readEntities
  // formatResponse,
  // createQueryObj,
  // runQuery,
  // runQueryKeysOnly,
  // deleteByKey,
  // getRawEntitiesByKeys,
  // formatKeyResponse,
  // getDatastoreKeySymbol,
} = require("@pheasantplucker/gc-datastore")

async function render(req, res) {
  const id = uuid.v4()
  const jobIdResult = getAttributes(req)
  if (isFailure(jobIdResult)) return jobIdResult
  const jobId = payload(jobIdResult)
  const jobDataResult = await getDataFromDatastore(jobId)
  if (isFailure(jobDataResult)) return jobDataResult
  const jobData = payload(jobDataResult)[jobId]

  try {
    const filePath = path.join(__dirname, "../template/index.ejs")
    const html = await cons.ejs(filePath, jobData)
    return res_ok(res, html)
  } catch (e) {
    console.log(e.toString())
    return res_err(res, e.toString())
  }

  return res_err(res, e.toString())
}

async function getDataFromDatastore(keyName) {
  const datastore = createDatastoreClient("starspawn-201921")
  const entityKeyResult = makeDatastoreKey("jobs", keyName)
  if (isFailure(entityKeyResult)) return entityKeyResult
  const entityKey = payload(entityKeyResult)
  const entity = await readEntities([entityKey])
  if (isFailure(entity)) return entity
  const jobData = payload(entity)
  return success(jobData)
}

const getAttributes = req => {
  try {
    if (req.body.attributes) {
      return success(req.body.attributes)
    } else {
      return failure(req, { error: "couldnt access req.body.attributes" })
    }
  } catch (e) {
    return failure(e.toString(), {
      error: "couldnt access req.body.attributes",
      req: req
    })
  }
}

function res_ok(res, payload) {
  res.status(200).send(success(payload))
  return success(payload)
}

function res_err(res, payload) {
  console.error(payload)
  res.status(500).send(failure(payload))
  return failure(payload)
}

module.exports = {
  render,
  getDataFromDatastore
}
