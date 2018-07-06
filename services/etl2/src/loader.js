const {
  success,
  failure,
  isFailure,
  isSuccess,
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
const redis = require('@pheasantplucker/redis')
const SECONDS_IN_60_DAYS = 60 * 60 * 24 * 60
let REDIS_CONNECTED = false
async function setup_redis() {
  if (REDIS_CONNECTED) return success()
  const host = 'redis-13030.c1.us-central1-2.gce.cloud.redislabs.com'
  const password = `jWFPlekdKFdSaJhl76luvClgsRmybNem`
  const port = 13030
  const redis_opts = { host, port, password }
  REDIS_CONNECTED = true
  return redis.createClient(redis_opts)
}

createDatastoreClient('starspawn-201921')

async function loader(id, data) {
  try {
    // setup
    await setup_redis()
    let namespace = 'prod'
    let { filename, isTest } = data
    if (isTest) namespace = 'test'

    // pull the jobs out of the data pipeline file
    const r1 = await getFile(filename)
    if (isFailure(r1)) return r1
    const jobs_json = JSON.parse(payload(r1))
    const jobs = jobs_json.root.job

    // turn them into "jobs" with a hash and an id
    const preped_jobs = jobs.map(j => appcast_datastore_job(j))
    const checked_ids = preped_jobs.map(j => j.id)
    // Figure out which jobs have changed or are new
    const changes_result = await check_job_changes(namespace, preped_jobs)
    if (isFailure(changes_result)) return changes_result
    const changes = payload(changes_result)
    const ids_to_insert = [...changes.add, ...changes.changed]
    if (ids_to_insert.length === 0) loader_results(id, checked_ids, [], [], [])

    // update the main database (datastore)
    const updates = filter_records(preped_jobs, ids_to_insert, 'id')
    const r2 = await add_jobs_to_db(namespace, updates)
    if (isFailure(r2)) return r2

    // update the cache
    // TODO
    let cache_diff_ids = []
    const cache_diff_jobs = diff_for_cache(preped_jobs, changes)
    const r3 = await add_jobs_to_cache(cache_diff_jobs)
    if (isSuccess(r3)) {
      cache_diff_ids = cache_diff_jobs.map(j => j.id)
    }
    // return

    return loader_results(
      id,
      checked_ids,
      changes.add,
      changes.changed,
      cache_diff_ids
    )
  } catch (e) {
    return failure(e.toString())
  }
}

function loader_results(id, checked_ids, added_ids, changed_ids, cached_ids) {
  log_results(id, checked_ids, added_ids, changed_ids, cached_ids)
  return success({
    checked: checked_ids,
    added: added_ids,
    changed: changed_ids,
    cached: cached_ids,
  })
}

function log_results(id, checked_ids, added_ids, changed_ids, cached_ids) {
  const checked = checked_ids.length
  const added = added_ids.length
  const changed = changed_ids.length
  const cached = cached_ids.length
  console.info(JSON.stringify({ id, checked, changed, added, cached }))
}

function get_datastore_meta() {
  return {
    excludeFromIndexes: ['body', 'gsd'],
    method: 'upsert',
  }
}

function filter_records(records, record_ids, field) {
  return R.innerJoin((record, id) => record[field] === id, records, record_ids)
}

function appcast_hash(j) {
  return md5(j.body)
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
    version: 1,
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
    apply_url: j.url,
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

async function check_job_changes(namespace, jobs) {
  await setup_redis()
  const jobs_set = to_map(jobs, 'id')
  // check the cache
  const redis_keys = jobs.map(j => j.id)
  const cache_result = await redis.batch_get(redis_keys)
  if (isFailure(cache_result)) {
  } // do nothing and use the DB
  const cached_jobs = payload(cache_result)
  const need_db_check = jobs.filter(j => j.hash !== cached_jobs[j.id])
  const in_cache = jobs.filter(j => j.hash === cached_jobs[j.id]).map(j => j.id)
  if (need_db_check.length === 0) {
    return success({
      exist: in_cache,
      add: [],
      changed: [],
      cached: in_cache,
    })
  }
  // convert jobs to batch format
  const batch = need_db_check.map(j => ['job', j.id])
  // pull all the jobs by id
  const r1 = await batch_get(namespace, batch)
  if (isFailure(r1)) return r1
  const main_db = payload(r1)
  const db_add = main_db.missing
  const db_items = main_db.items
  // check the hashes of all that are in the db
  // any hashes that do not match need to be updated
  const db_changed = main_db.found.filter(
    id => db_items[id].hash !== jobs_set[id].hash
  )

  const db_exist = main_db.found.filter(
    id => db_items[id].hash === jobs_set[id].hash
  )
  return success({
    exist: db_exist,
    add: db_add,
    changed: db_changed,
    cached: in_cache,
  })
}

async function add_jobs_to_db(namespace, jobs) {
  try {
    const batch = jobs.map(j => ['job', j.id, j])
    return batch_set(namespace, batch, get_datastore_meta())
  } catch (error) {
    return failure(error.toString())
  }
}

async function add_jobs_to_cache(jobs) {
  try {
    await setup_redis()
    const commands = jobs.map(j => [
      'set',
      j.id,
      j.hash,
      'EX',
      SECONDS_IN_60_DAYS,
    ])
    return redis.pipeline(commands)
  } catch (error) {
    return failure(error.toString())
  }
}

async function delete_jobs_from_cache(jobs) {
  try {
    await setup_redis()
    const commands = jobs.map(j => ['del', j.id])
    return redis.pipeline(commands)
  } catch (error) {
    return failure(error.toString())
  }
}

function to_map(list, key) {
  const the_map = {}
  for (let i = 0; i < list.length; i++) {
    const element = list[i]
    the_map[element[key]] = element
  }
  return the_map
}

async function delete_jobs_from_cache_by_id(job_ids) {
  try {
    await setup_redis()
    const commands = job_ids.map(id => ['del', id])
    return redis.pipeline(commands)
  } catch (error) {
    return failure(error.toString())
  }
}

function to_map(list, key) {
  const the_map = {}
  for (let i = 0; i < list.length; i++) {
    const element = list[i]
    the_map[element[key]] = element
  }
  return the_map
}

function diff_for_cache(jobs, change_list) {
  // what was in the database but not in the cache
  const in_db_but_not_cache = R.difference(
    change_list.exist,
    change_list.cached
  )
  // this is the list that needs to be added to the cache
  const add_to_cache = [
    ...change_list.add,
    ...change_list.changed,
    ...in_db_but_not_cache,
  ]

  return filter_records(jobs, add_to_cache, 'id')
}

module.exports = {
  loader,
  appcast_datastore_job,
  check_job_changes,
  add_jobs_to_cache,
  delete_jobs_from_cache,
  diff_for_cache,
  delete_jobs_from_cache_by_id,
}
