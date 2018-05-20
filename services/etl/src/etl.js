const express = require("express")
const app = express()
const uuid = require("uuid")
const bodyParser = require("body-parser")
const { failure, success } = require("@pheasantplucker/failables")

// ==========================================================
//
//                         CONFIG
//
// ==========================================================
const log = console.log
const PORT = process.env.PORT || 8080
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
    .send("hello etl")
    .end()
})

app.post("/download", async (req, res) => {
  let id
  try {
    log(req.body)
    const data = parse_req_data(req)
    log(data)
    let { source_url } = data
    id = data.id
    if (!id) id = uuid.v4()
    const payload = { foo: "bar" }
    return res_ok(res, id, "download", ["test", "trace", "alpha"], payload)
  } catch (e) {
    return res_err(res, id, "download", ["test", "trace", "alpha"], payload)
  }
})

// ==========================================================
//
//                         HELPERS
//
// ==========================================================

function parse_req_data(r) {
  try {
    return JSON.parse(r.body.message.data)
  } catch (e) {
    return r.body.message.data
  }
}

function res_ok(res, id, source, tags, payload) {
  const d = envelope(id, source, tags, payload)
  res.status(200).send(success(d))
  return success(d)
}

function res_err(res, id, source, tags, payload) {
  const d = envelope(id, source, tags, payload)
  console.error(d)
  res.status(500).send(failure(d))
  return failure(d)
}

function envelope(id, source, tags, payload) {
  return {
    id,
    end_time: Date.now(),
    source,
    tags,
    payload
  }
}

// ==========================================================
//
//                         STARTUP
//
// ==========================================================
function start() {
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
  stop
}
