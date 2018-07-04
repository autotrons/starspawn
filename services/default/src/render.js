const cons = require('consolidate')
const path = require('path')
const he = require('he')
const timeago = require('time-ago')
const {
  success,
  failure,
  isFailure,
  payload,
  isSuccess,
  isEmpty,
} = require('@pheasantplucker/failables')
const {
  createDatastoreClient,
  createQueryObj,
  runQuery,
  batch_get,
} = require('@pheasantplucker/gc-datastore')

const projectFullName = 'starspawn-201921'
const JOB_KIND = 'job'
const NAMESPACE = 'prod'
createDatastoreClient(projectFullName)

async function render(req, res) {
  const jobIdResult = getJobId(req)
  if (isFailure(jobIdResult)) {
    res_err(res, `Couldn't find that job ID from req:${req}`)
    return jobIdResult
  }

  const jobId = payload(jobIdResult)
  const jobDataResult = await getDataFromDatastore(jobId)
  if (isFailure(jobDataResult)) {
    res_err(res, `Couldn't find job ID [${jobId}] in DS`)
    return jobDataResult
  }
  const jobData = payload(jobDataResult)

  const r1 = unsanitizeDescriptionHtml(jobData.body)
  if (isFailure(r1)) {
    res_err(res, `Couldn't clean up that dirty, dirty job body.`)
    return r1
  }
  const cleanBody = payload(r1)
  const cleanBodyObj = { body: cleanBody }

  const r2 = timeAgo(jobData.posted_at)
  if (isFailure(r2)) {
    res_err(res, `Couldn't figure out how long ago the job was posted.`)
    return r2
  }
  const cleanTimeAgo = payload(r2)
  const cleanTimeAgoObj = { timeAgo: cleanTimeAgo }

  const cleanJobData = Object.assign({}, jobData, cleanBodyObj, cleanTimeAgoObj)

  try {
    const filePath = path.join(__dirname, '../template/index.ejs')
    const html = await cons.ejs(filePath, cleanJobData)
    return res_ok(res, html)
  } catch (e) {
    console.log(e.toString())
    return res_err(res, e.toString())
  }
}

function timeAgo(datePosted) {
  try {
    const result = timeago.ago(Date.parse(datePosted))
    return success(result)
  } catch (e) {
    return failure(e.toString(), { datePosted })
  }
}

async function getDataFromDatastore(keyName) {
  // try by url first
  const result_by_url = await getByUrl(keyName)

  if (isSuccess(result_by_url) && isEmpty(result_by_url) === false)
    return result_by_url

  const batch = [[JOB_KIND, keyName]]
  const r1 = await batch_get(NAMESPACE, batch)
  if (isFailure(r1)) return r1
  const main_db = payload(r1)

  const jobData = Object.values(main_db.items)[0]
  return success(jobData)
}

async function getByUrl(url) {
  const query = payload(createQueryObj(JOB_KIND, [NAMESPACE]))
  query.filter('url', '=', url)
  const result = await runQuery(query)
  if (isFailure(result)) return result
  const responses = payload(result)
  const job_data = Object.values(responses)[0]
  return success(job_data)
}

const unsanitizeDescriptionHtml = sanHtml => {
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
      return failure(req, { error: 'couldnt access req.query' })
    }
  } catch (e) {
    return failure(e.toString(), {
      error: 'couldnt access req.query',
      req: req,
    })
  }
}

function res_ok(res, payload) {
  res.status(200).send(payload)
  return success(payload)
}

function res_err(res, payload) {
  console.error(payload)
  res
    .status(404)
    .send(
      "<html><h1>404</h1><br/>Sorry we couldn't find what you were looking four.</html>"
    )
  return failure(payload)
}

module.exports = {
  render,
  getDataFromDatastore,
  unsanitizeDescriptionHtml,
  timeAgo,
  getByUrl,
}
