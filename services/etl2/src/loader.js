const {
  success,
  failure,
  isFailure,
  payload,
} = require('@pheasantplucker/failables')
const {
  createDatastoreClient,
  batch_get,
  batch_set,
} = require('@pheasantplucker/gc-datastore')
const { getFile } = require('@pheasantplucker/gc-cloudstorage')
const he = require('he')
const md5 = require('md5')
const R = require('ramda')

createDatastoreClient('starspawn-201921')

async function loader(id, data) {
  try {
    let { filename, isTest } = data
    const set_meta = {
      excludeFromIndexes: ['body', 'gsd'],
      method: 'upsert',
    }

    const r1 = await getFile(filename)
    if (isFailure(r1)) return r1
    const jobs = JSON.parse(payload(r1))
    const jobArray = jobs.root.job

    const preped_jobs = jobArray.map(j => appcast_datastore_job(j))
    const changes_result = await check_job_changes(preped_jobs)
    if (isFailure(changes_result)) return changes_result
    const changes = payload(changes_result)
    console.log(changes.add)
    // const add = filter_records(preped_jobs, changes.add, 'id')
    // const changed = filter_records(preped_jobs, changes.changed, 'id')
    // const batch_add = add.map(j => ['job', j.id, j])
    // const batch_changed = changed.map(j => ['job', j.id, j])
    // return batch_set('loadertest', [...batch_add, ...batch_changed], set_meta)
    return success()
  } catch (e) {
    return failure(e.toString())
  }
}

function filter_records(records, record_ids, field) {
  return R.innerJoin((record, id) => record[field] === id, records, record_ids)
}

function appcast_hash(j) {
  const copy = Object.assign({}, j, { gsd: '' })
  return md5(JSON.stringify(copy))
}
function appcast_id(j) {
  return md5(j.job_reference)
}

function appcast_to_url(j) {
  const t0 = `${j.title.slice(0, 25)}_${j.city}_${j.state}`
  const t1 = t0.replace(/\s+/g, '_')
  const t2 = t1.replace(/[^a-z0-9_+]+/gi, '')
  const t3 = t2.replace(/_+/g, '_')
  const t4 = t3.replace(/_+/g, '-')
  const id = `${t4}-${md5(j.job_reference).slice(0, 4)}`
  return id
}

function appcast_datastore_job(j, is_test = false) {
  const id = appcast_id(j)
  const sanitizedDescription = removeEscapeCharacters(j.gsd.description)
  if (isFailure(sanitizedDescription)) return sanitizedDescription
  const gsd = Object.assign({}, j.gsd, {
    description: payload(sanitizedDescription),
  })
  return {
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
    gsd: JSON.stringify(gsd),
    hash: appcast_hash(j),
    source: 'appcast',
    url: appcast_to_url(j),
    is_test,
  }
}

const removeEscapeCharacters = html => {
  try {
    const decodedHtml = he.unescape(html)
    return success(decodedHtml)
  } catch (e) {
    return failure(e.toString())
  }
}

async function check_job_changes(jobs) {
  const jobs_set = to_map(jobs, 'id')
  const namespace = 'loadertest'
  // convert jobs to batch format
  const batch = jobs.map(j => ['job', j.id])
  // pull all the jobs by id
  const r1 = await batch_get(namespace, batch)
  if (isFailure(r1)) return r1
  const main_db = payload(r1)
  const db_add = main_db.missing
  // check the hashes of all that are in the db
  // any hashes that do not match need to be updated
  const db_changed = main_db.found.filter(
    id => main_db.items[id].hash !== jobs_set[id].hash
  )

  const db_exist = main_db.found.filter(
    id => main_db.items[id].hash === jobs_set[id].hash
  )
  return success({
    exist: db_exist,
    add: db_add,
    changed: db_changed,
  })
}

function to_map(list, key) {
  const the_map = {}
  for (let i = 0; i < list.length; i++) {
    const element = list[i]
    the_map[element[key]] = element
  }
  return the_map
}

module.exports = {
  loader,
  appcast_datastore_job,
  check_job_changes,
}
