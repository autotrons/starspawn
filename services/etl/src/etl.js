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
const get = require("simple-get")
const { createWriteStream } = require("@pheasantplucker/gc-cloudstorage")

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

  try {
    if (fun === "download") {
      reply = await download(id, data)
    }

    if (isFailure(reply)) {
      return res_err(res, id, fun, payload(reply))
    }
    return res_ok(res, id, fun, payload(reply))
  } catch (e) {
    return res_err(res, id, fun, e.toString())
  }
})

async function download(id, data) {
  try {
    let { source_url, target_file } = data
    return stream_to_storage(source_url, target_file)
  } catch (e) {
    return failure(e.toString())
  }
}

async function stream_to_storage(source_url, target_file) {
  const r1 = await createWriteStream(target_file)
  if (isFailure(r1)) return r1
  const write_stream = payload(r1)
  return new Promise(resolve => {
    get(source_url, function(err, getResponse) {
      if (err) {
        resolve(failure(err.toString()))
        return
      }

      console.log()
      getResponse
        .pipe(write_stream)
        .on("error", function(err) {
          resolve(failure(err.toString()))
        })
        .on("finish", function() {
          resolve(success())
        })
    })
  })
}

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
