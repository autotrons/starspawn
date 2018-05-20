const uuid = require('uuid')
const {
  success,
  failure,
  isFailure,
  payload,
} = require('@pheasantplucker/failables-node6')
const {
  createDatastoreClient,
  makeEntityByName,
  writeEntity,
  readEntities,
} = require('@pheasantplucker/gc-datastore')

const loader = async (req, res) => {
  const id = uuid.v4()

  const jobsResult = getAttributes(req)
  if (isFailure(jobsResult)) return jobsResult
  const jobs = payload(jobsResult)

  const datastore = createDatastoreClient()
  // all jobs need extra field IS_TEST = true/false

  const jobEntitiesResult = await jobsToEntities(jobs)
  if (isFailure(jobEntitiesResult)) return jobEntitiesResult

  const jobEntities = payload(jobEntitiesResult)

  const writeResult = await writeEntity(jobEntities)
  if (isFailure(writeResult)) return writeResult
  const writePayload = payload(writeResult)

  return res_ok(res, { jobEntities, writePayload })
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

function res_ok(res, payload) {
  res.status(200).send(success(payload))
  return success(payload)
}

const jobsToEntities = jobs => {
  const kind = 'jobs' //hmm, testing data?
  try {
    const entities = jobs.map(job => {
      const thisEntity = makeEntityByName(kind, job.job_reference, job)
      return payload(thisEntity)
    })
    return success(entities)
  } catch (e) {
    return failure(e.toString(), {
      jobs: jobs,
    })
  }
}

// function res_err(res, payload) {
//   console.error(payload)
//   res.status(500).send(failure(payload))
//   return failure(payload)
// }

module.exports = {
  loader,
  getAttributes,
  jobsToEntities,
}
