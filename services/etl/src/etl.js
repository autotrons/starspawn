const express = require("express")
const app = express()
const uuid = require("uuid")
const bodyParser = require("body-parser")
const {
  isFailure,
  failure,
  success,
  payload,
  meta
} = require("@pheasantplucker/failables")
const { download } = require("./download")

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
  try {
    if (fun === "download") {
      reply = await download(id, data)
    }

    if (fun === "publish") {
      reply = await publish(id, data)
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

function parse_req_data(r) {
  try {
    return JSON.parse(r.body.message.data)
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
