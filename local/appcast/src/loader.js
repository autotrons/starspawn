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
const { read_file_to_array } = require('./fs-failable')
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

async function loader(files, isTest = false) {
  try {
    const files_len = files.length
    let last_return
    for (var i = 0; i < files_len; i++) {
      // pull the jobs out of the data pipeline file
      const r1 = await read_file_to_array(files[i])
      if (isFailure(r1)) return r1
      const read_batch = payload(r1)
      const jobs_and_empty_batch = read_batch.map(line => JSON.parse(line))
      const job_batch = jobs_and_empty_batch.filter(Boolean)
      const r2 = await process_jobs_batch(job_batch, isTest)
      if (isFailure(r2)) return r2
      last_return = payload(r2)
    }

    return success(last_return)
  } catch (e) {
    return failure('loader fail- ' + e.toString())
  }
}

async function process_jobs_batch(jobs, isTest) {
  try {
    // setup
    await setup_redis()
    let namespace = 'prod'
    if (isTest) namespace = 'test'
    const checked_ids = jobs.map(j => j.id)
    // Figure out which jobs have changed or are new
    const changes_result = await check_job_changes(namespace, jobs)
    if (isFailure(changes_result)) return changes_result
    const changes = payload(changes_result)
    const ids_to_insert = [...changes.add, ...changes.changed]
    if (ids_to_insert.length === 0) loader_results(checked_ids, [], [], [])

    // update the main database (datastore)
    const updates = filter_records(jobs, ids_to_insert, 'id')
    const r2 = await add_jobs_to_db(namespace, updates)
    if (isFailure(r2)) return r2

    // update the cache
    // TODO
    let cache_diff_ids = []
    const cache_diff_jobs = diff_for_cache(jobs, changes)
    const r3 = await add_jobs_to_cache(cache_diff_jobs)
    if (isSuccess(r3)) {
      cache_diff_ids = cache_diff_jobs.map(j => j.id)
    }
    // return

    return loader_results(
      checked_ids,
      changes.add,
      changes.changed,
      cache_diff_ids
    )
  } catch (e) {
    return failure('process_jobs_batch fail ' + e.toString())
  }
}

function loader_results(checked_ids, added_ids, changed_ids, cached_ids) {
  log_results(checked_ids, added_ids, changed_ids, cached_ids)
  return success({
    checked: checked_ids,
    added: added_ids,
    changed: changed_ids,
    cached: cached_ids,
  })
}

function log_results(checked_ids, added_ids, changed_ids, cached_ids) {
  const checked = checked_ids.length
  const added = added_ids.length
  const changed = changed_ids.length
  const cached = cached_ids.length
  console.info(JSON.stringify({ checked, changed, added, cached }))
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
    return failure('delete_jobs_from_cache_by_id ' + error.toString())
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
  check_job_changes,
  add_jobs_to_cache,
  delete_jobs_from_cache,
  diff_for_cache,
  delete_jobs_from_cache_by_id,
}
