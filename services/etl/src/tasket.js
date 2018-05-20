const {
  failure,
  success,
  payload,
  meta
} = require("@pheasantplucker/failables")

function tasket_ok(task_data, new_meta, source_task) {
  const old_meta = meta(source_task)
  const m = Object.assign({}, old_meta, new_meta)
  m.dt = Date.now() - m.st
  return success(task_data, m)
}

function tasket_err(task_data, new_meta, source_task = { meta: {} }) {
  const m = Object.assign({}, new_meta, meta(source_task))
  m.dt = Date.now() - m.st
  return failure(task_data, m)
}

function make_meta(id, start_time, worker_name) {
  return {
    id,
    st: start_time,
    dt: Date.now() - start_time,
    wn: worker_name
  }
}

module.exports = {
  tasket_ok,
  tasket_err
}
