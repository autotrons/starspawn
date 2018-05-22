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
const { setProject, createTopic } = require("@pheasantplucker/gc-pubsub")
const { download } = require("./download")
const { unzip } = require("./unzip")
const { chunk } = require("./chunk")
const { publish } = require("./publish")
const { loader } = require("./loader")
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

// ==========================================================
//
//                         ROUTES
//
// ==========================================================
app.get("/", (req, res) => {
  res
    .status(200)
    .send("{}")
    .end()
})

app.post("/:function", async function(req, res) {
  // Pull out task data
  let fun, data, id, reply, source
  const start_time = Date.now()
  try {
    fun = req.params.function
    data = parse_req_data(req)
    id = data.id
    if (!id) id = uuid.v4()
  } catch (e) {
    return res_err(res, id, fun, e.toString())
  }

  // Call The function
  const fns = {
    download,
    publish,
    unzip,
    chunk,
    health_check
  }

  try {
    reply = await fns[fun](id, data)

    if (fun === "loader") {
      reply = await loader(id, data)
    }

    if (fun === "parse") {
      reply = await parse(id, data)
    }

    // deal with function failure
    if (isFailure(reply)) {
      return res_err(res, id, fun, payload(reply))
    }
    return res_ok(res, id, fun, payload(reply))
  } catch (e) {
    return res_err(res, id, fun, e.toString())
  }
})

// ==========================================================
//
//                         HELPERS
//
// ==========================================================

const TOPICS = ["unzip_v1"]

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
  const m = { id, wn: source }
  res.status(200).send(success(data, m))
  return success(data, m)
}

function res_err(res, id, source, data) {
  const m = { id, wn: source }
  console.error(data)
  res.status(500).send(failure(data, m))
  return failure(data, m)
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
