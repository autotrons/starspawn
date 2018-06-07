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

  const r1 = await getFile(filename)
  if (isFailure(r1)) return r1
  const jobs = JSON.parse(payload(r1))
  const jobArray = jobs.root.job

  // all jobs need extra field IS_TEST = true/false

  const jobEntitiesResult = await jobsToEntities(id, jobArray)
  if (isFailure(jobEntitiesResult)) return jobEntitiesResult

  const jobEntities = payload(jobEntitiesResult)

  const drain_result = await drain_write_entities(jobEntities)
  if (isFailure(drain_result)) return drain_result

  return success({ jobEntities })
}

const jobsToEntities = (id, jobs) => {
  try {
    const kind = 'jobs' //hmm, testing data?
    const entities = []
    for (let i = 0; i < jobs.length; i++) {
      const job = jobs[i]
      const tasketId = { tasketId: id }
      const fullJob = Object.assign({}, job, tasketId)
      const ent = payload(makeEntityByName(kind, job.job_reference, fullJob))
      entities.push(ent)
    }
    return success(entities)
  } catch (e) {
    return failure(e.toString())
  }
}

async function drain_write_entities(ents) {
  const batches = make_batches(ents, 500)
  for (let i = 0; i < batches.length; i++) {
    const writeResult = await writeEntity(batches[i])
    if (isFailure(writeResult)) return writeResult
  }
  return success()
}

function make_batches(items, batch_size) {
  let batches = []
  let i, j, temp
  for (i = 0, j = items.length; i < j; i += batch_size) {
    temp = items.slice(i, i + batch_size)
    batches.push(temp)
  }
  return batches
}

module.exports = {
  loader,
  jobsToEntities,
  make_batches,
}
