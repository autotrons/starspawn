const uuid = require('uuid')
const {
  success,
  failure,
  isFailure,
  payload,
} = require('@pheasantplucker/failables')
const {
  createDatastoreClient,
  makeEntityByName,
  writeEntity,
  readEntities,
} = require('@pheasantplucker/gc-datastore')

const loader = async (id, jobs) => {
  const datastore = createDatastoreClient()
  // all jobs need extra field IS_TEST = true/false

  const jobEntitiesResult = await jobsToEntities(id, jobs)
  if (isFailure(jobEntitiesResult)) return failure(jobEntitiesResult)

  const jobEntities = payload(jobEntitiesResult)

  const writeResult = await writeEntity(jobEntities)
  if (isFailure(writeResult)) return failure(writeResult)
  const writePayload = payload(writeResult)

  return success({ jobEntities, writePayload })
}

const jobsToEntities = (id, jobs) => {
  const kind = 'jobs' //hmm, testing data?
  try {
    const entities = jobs.map(job => {
      const tasketId = { tasketId: id }
      const fullJob = Object.assign({}, job, tasketId)
      const r1 = makeEntityByName(kind, job.job_reference, fullJob)
      if (isFailure(r1)) return failure(r1)
      return payload(r1)
    })
    return success(entities)
  } catch (e) {
    return failure(e.toString(), {
      jobs: jobs,
    })
  }
}

module.exports = {
  loader,
  jobsToEntities,
}
