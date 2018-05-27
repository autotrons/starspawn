const express = require("express")
const app = express()
const uuid = require("uuid")
const bodyParser = require("body-parser")
const { map } = require("ramda")
const {
  anyFailed,
  firstFailure,
  isFailure,
  failure,
  success,
  payload,
  meta
} = require("@pheasantplucker/failables")
const fs = require("fs")
const { setProject, createTopic } = require("@pheasantplucker/gc-pubsub")
const rp = require("request-promise")

const { download } = require("./download")
const { unzip } = require("./unzip")
const { chunk } = require("./chunk")
const { publish } = require("./publish")
const { loader } = require("./loader")
const { json2gsd } = require("./json2gsd")
const { parse } = require("./parse")
const { health_check } = require("./health_check")

// ==========================================================
//
//                         CONFIG
//
// ==========================================================
const log = console.log
const PORT = process.env.PORT || 8080
const PROJECT_ID = "starspawn-201921"
let SERVER
app.use(bodyParser.json())

// function map
const FUNCTION_MAP = {
  chunk,
  download,
  health_check,
  publish,
  loader,
  parse,
  json2gsd,
  unzip
}

// ==========================================================
//
//                         ROUTES
//
// ==========================================================
app.get("/:command", async (req, res) => {
  const id = uuid.v4()
  let command = "none"
  try {
    command = req.params.command
    if (command === "appcast_pipeline_test") {
      const source_url =
        "https://storage.googleapis.com/starspawn_tests/feed.xml.gz"
      const target_file = `datafeeds/full_feed/${id}.xml.gz`
      const result = await appcast_download(id, source_url, target_file)
      return res_ok(res, id, command, {})
    }
    return res_err(res, id, command, "no path")
  } catch (e) {
    return res_err(res, id, command, e.toString())
  }
})

app.post("/:command", async function(req, res) {
  // Pull out task data
  let command, data, id, reply, source
  try {
    command = req.params.command
    data = parse_req_data(req)
    id = data.id

    if (!id) id = uuid.v4()
    do_trace(data, command)
  } catch (e) {
    return res_err(res, id, command, e.toString())
  }

  try {
    reply = await FUNCTION_MAP[command](id, data)

    // deal with function failure
    if (isFailure(reply)) {
      return res_err(res, id, command, payload(reply))
    }
    return res_ok(res, id, command, payload(reply))
  } catch (e) {
    return res_err(res, id, command, e.toString())
  }
})

// ==========================================================
//
//                         HELPERS
//
// ==========================================================

const TOPICS = ["unzip_v1"]

function do_trace(data, command) {
  const { id } = data
  if (data.trace) {
    const t = tasket(id, command, data.trace)
    const s = fs.createWriteStream(`../logs/${id}.log`, { flags: "a" })
    s.write(`${JSON.stringify(t)}\n`)
  }
}

async function setupPubSub() {
  setProject(PROJECT_ID)
  const promises = map(t => createTopic(t), TOPICS)
  const results = await Promise.all(promises)
  if (anyFailed(results)) return firstFailure(results)

  return success(PROJECT_ID)
}

function parse_req_data(r) {
  try {
    const decoded = new Buffer(r.body.message.data, "base64").toString("ascii")
    return JSON.parse(decoded)
  } catch (e) {
    return r.body.message.data
  }
}

function res_ok(res, id, source, data) {
  res.set("Content-Type", "application/json")
  const m = { id, wn: source }
  res.status(200).send(success(data, m))
  return success(data, m)
}

function res_err(res, id, source, data) {
  res.set("Content-Type", "application/json")
  const m = { id, wn: source }
  console.error(data)
  res.status(500).send(failure(data, m))
  return failure(data, m)
}

async function appcast_download(id, source_url, target_file) {
  const options = {
    uri: "http://localhost:8080/download",
    method: "POST",
    headers: {
      "User-Agent": "Request-Promise"
    },
    body: { message: { data: { id, source_url, target_file, trace: true } } },
    json: true // Automatically stringifies the body to JSON
  }
  const result = await rp(options)
  return result
}

async function call_next_task(tasket) {
  const { id, target, next } = next(tasket)
  const options = {
    uri: `http://localhost:8080/${target}`,
    method: "POST",
    headers: {
      "User-Agent": "Request-Promise"
    },
    body: { message: { data: next } },
    json: true // Automatically stringifies the body to JSON
  }
  const result = await rp(options)
  return result
}

// ==========================================================
//
//                         STARTUP
//
// ==========================================================

async function start() {
  return new Promise(function(resolve, reject) {
    SERVER = app.listen(PORT, () => {
      console.log(`App listening on port ${PORT}`)
      console.log("Press Ctrl+C to quit.")
      resolve(SERVER)
    })
  })
}

function stop() {
  SERVER.close()
}

module.exports = {
  start,
  stop,
  setupPubSub,
  TOPICS
}
