const {
  success,
  failure,
  isFailure,
  payload,
} = require('@pheasantplucker/failables')
const {
  makeDatastoreKey,
  writeEntity,
  createDatastoreClient,
  lookup,
} = require('@pheasantplucker/gc-datastore')
const { getFile } = require('@pheasantplucker/gc-cloudstorage')
const md5 = require('md5')

createDatastoreClient('starspawn-201921')

async function loader(id, data) {
  try {
    return do_file_things(id, data)
  } catch (e) {
    return failure(e.toString())
  }
}

async function do_file_things(id, data) {
  const { filename } = data

  const r1 = await getFile(filename)
  if (isFailure(r1)) return r1
  const jobs = JSON.parse(payload(r1))
  const jobArray = jobs.root.job

  const jobEntitiesResult = await jobsToEntities(id, jobArray)
  if (isFailure(jobEntitiesResult)) return jobEntitiesResult

  const jobEntities = payload(jobEntitiesResult)

  const drain_result = await drain_write_entities(id, jobEntities)
  if (isFailure(drain_result)) return drain_result

  return success({ jobEntities })
}

const jobsToEntities = (id, jobs) => {
  try {
    const entities = []
    for (let i = 0; i < jobs.length; i++) {
      const ent = appcast_datastore_job(jobs[i])
      entities.push(ent)
    }
    return success(entities)
  } catch (e) {
    return failure(e.toString())
  }
}

async function drain_write_entities(id, ents) {
  const batches = make_batches(ents, 500)
  let write_results = []
  for (let i = 0; i < batches.length; i++) {
    const r1 = await findMissingEntities(batches[i])

    if (isFailure(r1)) return r1
    const missingEntities = payload(r1)
    console.info(
      `${id} loader drain_write_entities writing ${missingEntities.length} jobs`
    )
    const r2 = await writeEntity(missingEntities)
    if (isFailure(r2)) {
      console.log(r2)
      return r2
    }
    write_results = [...write_results, payload(r2)]
  }
  return success(write_results)
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

function appcast_hash(j) {
  const copy = Object.assign({}, j, { gsd: '' })
  return md5(JSON.stringify(copy))
}
function appcast_id(j) {
  return md5(j.job_reference + j.posted_at)
}

function appcast_datastore_job(j, is_test = false) {
  const kind = 'job'
  const id = appcast_id(j)
  const key = payload(makeDatastoreKey(kind, id))
  const data = {
    id: id,
    body: j.body,
    category: j.category,
    city: j.city,
    company: j.company,
    country: j.country,
    cpc: j.cpc,
    cpa: j.cpa,
    html_jobs: j.html_jobs,
    job_reference: j.job_reference,
    job_type: j.job_type,
    location: j.location,
    mobile_friendly_apply: j.mobile_friendly_apply,
    posted_at: new Date(j.posted_at),
    created_at: new Date(Date.now()),
    state: j.state,
    title: j.title,
    url: j.url,
    zip: j.zip,
    gsd: JSON.stringify(j.gsd),
    hash: appcast_hash(j),
    source: 'appcast',
    is_test,
  }
  return {
    key,
    excludeFromIndexes: ['body', 'gsd'],
    method: 'insert',
    data,
  }
}

async function findMissingEntities(ents) {
  const entityKeys = await ents.map(e => {
    return e.key
  })
  const lookupResp = await lookup(entityKeys)
  if (isFailure(lookupResp)) return lookupResp
  const lookupObj = payload(lookupResp)
  const missing = lookupObj.missing
  const missingArray = makeArray(missing)

  const makePath = (kind, name) => {
    return kind + '/' + name
  }

  const missingPaths = await missingArray.map(ent => {
    const kind = ent.entity.key.path[0].kind
    const name = ent.entity.key.path[0].name
    return makePath(kind, name)
  })

  const cleanMissing = [].concat.apply([], missingPaths)

  const missingEntities = await ents.filter(e => {
    if (e === undefined) return false
    const kind = e.key.kind
    const name = e.key.name
    const thisPath = makePath(kind, name)
    if (cleanMissing.indexOf(thisPath) > -1) return true
    return false
  })

  return success(missingEntities)
}

const makeArray = input => {
  if (Array.isArray(input)) return input
  return [input]
}

module.exports = {
  loader,
  jobsToEntities,
  make_batches,
  appcast_datastore_job,
  drain_write_entities,
  findMissingEntities,
}
