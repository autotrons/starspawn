const {
  success,
  failure,
  isFailure,
  payload,
} = require('@pheasantplucker/failables')
const {
  makeEntityByName,
  writeEntity,
  createDatastoreClient,
} = require('@pheasantplucker/gc-datastore')
const { getFile } = require('@pheasantplucker/gc-cloudstorage')

const { GC_PROJECT_ID } = process.env

async function loader(id, data) {
  try {
    return do_file_things(id, data)
  } catch (e) {
    return failure(e.toString())
  }
}

async function do_file_things(id, data) {
  const { filename } = data

  createDatastoreClient(GC_PROJECT_ID)

  const r2 = await getFile(filename)
  if (isFailure(r2)) return r2
  const jobs = JSON.parse(payload(r2))
  const jobArray = jobs.root.job

  // all jobs need extra field IS_TEST = true/false

  const jobEntitiesResult = await jobsToEntities(id, jobArray)
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
