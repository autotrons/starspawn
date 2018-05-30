const uuid = require('uuid')
const equal = require('assert').deepEqual
const log = console.log

const SUCCESS = 0
const FAILURE = 1
const EMPTY = 2
const PROTOCOL_V1 = 'tv1'

const protocol_version = f => f[0]
const kind = f => f[1]
const id = f => f[2]
const created = f => f[3]
const completed = f => f[4]
const timeout = f => f[5]
const source = f => f[6] // the creator
const trace = f => f[7]
const test = f => f[8]
const path = f => f[9] // a list of function
const callback = f => f[10] // who to tell when you are `d`one
const payload = f => f[11] // get turned into strings and sliced to 256 bytes for logging
const meta = f => f[12] // for metadata

const set_completed = t => {
  const et = Date.now()
  let temp = [...t]
  temp[4] = et
  return temp
}
const set_kind = (t, k) => {
  let temp = [...t]
  temp[1] = k
  return temp
}
const set_path = (t, p) => {
  let temp = [...t]
  temp[9] = p
  return temp
}

const set_created = (t, d) => {
  let temp = [...t]
  temp[3] = d
  return temp
}

function ok(
  id = uuid.v4(),
  source = 'none',
  callback = 'none',
  path = [],
  p = null,
  m = {},
  timeout = 60 * 60 * 1000,
  trace = false,
  test = false
) {
  const trace_as_number = trace ? 1 : 0
  const test_as_number = test ? 1 : 0
  const version = PROTOCOL_V1
  const created = Date.now()
  const kind = p === null || p === undefined ? EMPTY : SUCCESS
  const completed = 0
  return [
    version,
    kind,
    id,
    created,
    completed,
    timeout,
    source,
    trace_as_number,
    test_as_number,
    path,
    callback,
    p,
    m,
  ]
}

function complete_ok(prev, p, m) {
  const completed_tasket = set_completed(prev)
  const temp1 = set_path(prev, path(prev).slice(1))
  const next = set_created(temp1, Date.now())
  return [completed_tasket, next]
}

function complete_fail(prev, p, m) {
  const completed_tasket = set_completed(prev)
  const next1 = set_path(prev, path(prev).slice(1))
  const next2 = set_created(next1, Date.now())
  const next3 = set_kind(next2, FAILURE)
  return [completed_tasket, next3]
}

function fail(
  id = uuid.v4(),
  source = 'none',
  callback = 'none',
  path = [],
  p = {},
  m = {},
  timeout = 60 * 60 * 1000,
  trace = false,
  test = false
) {
  const trace_as_number = trace ? 1 : 0
  const test_as_number = test ? 1 : 0
  const version = PROTOCOL_V1
  const created = Date.now()
  const kind = 1
  const completed = 0
  return [
    version,
    kind,
    id,
    created,
    completed,
    timeout,
    source,
    trace_as_number,
    test_as_number,
    path,
    callback,
    p,
    m,
  ]
}

const is_tasket = f => {
  if (protocol_version(f) === PROTOCOL_V1) {
    if (is_success(f) || is_failure(f) || is_empty(f)) {
      return true
    }
  }
  return false
}

const assert = (f, p) => {
  equal(is_tasket(f), true)
}

const is_success = f =>
  Array.isArray(f) && (kind(f) === SUCCESS || kind(f) === EMPTY)
const is_failure = f => Array.isArray(f) && kind(f) === FAILURE
const is_empty = f => Array.isArray(f) && kind(f) === EMPTY

const any_failed = l => l.filter(is_failure).length > 0
const first_failure = l => l.filter(is_failure)[0]

const assert_ok = (f, p) => {
  equal(is_success(f), true)
  if (p) equal(payload(f), p)
}

const assert_fail = (f, p) => {
  equal(is_failure(f), true)
  if (p) equal(payload(f), p)
}

const assert_empty = f => equal(is_empty(f), true)

const kindString = f => {
  switch (kind(f)) {
    case SUCCESS:
      return 'success'
    case FAILURE:
      return 'failure'
    case EMPTY:
      return 'empty'
    default:
      return 'unknown'
  }
}

function next(t) {
  const d = payload(t)
  const m = meta(t)
  const id = m.id
  const target = m.path[0]
  return { id, target, next }
}

function sleep(ms) {
  return new Promise(res => {
    setTimeout(() => {
      res()
    }, ms)
  })
}

async function try_until(interval, timeout, condition) {
  let result = false
  let start_time = Date.now()
  while (result === false) {
    result = await condition()
    if (result) return true
    await sleep(interval)

    if (Date.now() - start_time > timeout) return false
  }
  return false
}

module.exports = {
  ok,
  assert,
  kind,
  id,
  completed,
  created,
  path,
  payload,
  meta,
  fail,
  is_success,
  is_failure,
  is_empty,
  assert_ok,
  assert_fail,
  assert_empty,
  any_failed,
  first_failure,
  complete_ok,
  complete_fail,
  try_until,
  sleep
}
