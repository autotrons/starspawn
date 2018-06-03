const express = require('express')
const app = express()
const uuid = require('uuid')
const bodyParser = require('body-parser')
const { map } = require('ramda')
const {
  anyFailed,
  firstFailure,
  isFailure,
  failure,
  success,
  payload,
  meta,
} = require('@pheasantplucker/failables')
const fs = require('fs')
const rp = require('request-promise')

const { download } = require('./download')
const { unzip } = require('./unzip')
const { chunk } = require('./chunk')
const { loader } = require('./loader')
const { json2gsd } = require('./json2gsd')
const { parse } = require('./parse')
const { health_check } = require('./health_check')

// ==========================================================
//
//                         CONFIG
//
// ==========================================================
const log = console.log
const PORT = process.env.PORT || 8080
const PROJECT_ID = 'starspawn-201921'
let SERVER
app.use(bodyParser.json())

// function map
const FUNCTION_MAP = {
  chunk,
  download,
  health_check,
  loader,
  parse,
  json2gsd,
  unzip,
}

// ==========================================================
//
//                         ROUTES
//
// ==========================================================
app.get('/:command', async (req, res) => {
  const id = uuid.v4()
  let command = 'none'
  try {
    command = req.params.command
    if (command === 'appcast_pipeline_test') {
      const source_url =
        'https://storage.googleapis.com/starspawn_tests/feed.xml.gz'
      const target_file = `datafeeds/full_feed/${id}.xml.gz`
      const result = await appcast_download(id, source_url, target_file)
      return res_ok(res, id, command, {})
    }
    return res_err(res, id, command, 'no path')
  } catch (e) {
    return res_err(res, id, command, e.toString())
  }
})

app.post('/:command', async function(req, res) {
  // Pull out task data
  try {
    const command = req.params.command
    const data = parse_req_data(req)
    let id = data.id
    if (!id) id = uuid.v4()
    const reply = await FUNCTION_MAP[command](id, data)
    const next_command = get_next_command(id, command, reply)
    http_post(next_command)

    return respond(res, id, command, reply)
  } catch (e) {
    return respond(res, id, command, failure(e.toString()))
  }
})

// ==========================================================
//
//                         HELPERS
//
// ==========================================================

async function http_post(next_command) {
  try {
    const options = {
      uri: 'http://localhost:8080/download',
      method: 'POST',
      headers: {
        'User-Agent': 'Request-Promise',
      },
      body: { message: { data: { id, source_url, target_file, trace: true } } },
      json: true, // Automatically stringifies the body to JSON
    }
    const result = await rp(options)
    return result
  } catch (e) {
    // TODO what do we do with failures in the ETL pipeline
    // should this try again? maybe?
  }
}

function get_next_command() {
  // This function should determine what step is to be called next
  if (command === 'download') generic_next(mapToUnZip(reply))
  // if(command === "download") download_unzip(reply)
  if (command === 'unzip') unzip_chunk(reply)
  if (command === 'chunk') {
    if (payload(reply).more_work) chunk_chunk(reply)
    else chunk_parse(reply)
  }
  // deal with function failure
}

function do_trace(data, command) {
  const { id } = data
  if (data.trace) {
    const t = tasket(id, command, data.trace)
    const s = fs.createWriteStream(`../logs/${id}.log`, { flags: 'a' })
    s.write(`${JSON.stringify(t)}\n`)
  }
}

function parse_req_data(r) {
  try {
    const decoded = new Buffer(r.body.message.data, 'base64').toString('ascii')
    return JSON.parse(decoded)
  } catch (e) {
    return r.body.message.data
  }
}

function respond(res, id, command, failable) {
  if (isFailure(failable)) {
    res.set('Content-Type', 'application/json')
    const m = { id, wn: source }
    res.status(500).send(failure(data, m))
    return failure(data, m)
  }
  res.set('Content-Type', 'application/json')
  const m = { id, wn: source }
  res.status(200).send(success(data, m))
  return success(data, m)
}

async function appcast_download(id, source_url, target_file) {
  const options = {
    uri: 'http://localhost:8080/download',
    method: 'POST',
    headers: {
      'User-Agent': 'Request-Promise',
    },
    body: { message: { data: { id, source_url, target_file, trace: true } } },
    json: true, // Automatically stringifies the body to JSON
  }
  const result = await rp(options)
  return result
}

async function download_unzip(download_result) {
  const id = meta(download_result).id
  const options = {
    uri: 'http://localhost:8080/unzip',
    method: 'POST',
    headers: {
      'User-Agent': 'Request-Promise',
    },
    body: { message: { data: { id, source_url, target_file, trace: true } } },
    json: true, // Automatically stringifies the body to JSON
  }
  const result = await rp(options)
  return result
}

async function call_next_task(tasket) {
  const { id, target, next } = next(tasket)
  const options = {
    uri: `http://localhost:8080/${target}`,
    method: 'POST',
    headers: {
      'User-Agent': 'Request-Promise',
    },
    body: { message: { data: next } },
    json: true, // Automatically stringifies the body to JSON
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
      console.log('Press Ctrl+C to quit.')
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
}
