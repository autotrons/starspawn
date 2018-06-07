const express = require('express')
const app = express()
const uuid = require('uuid')
const bodyParser = require('body-parser')
const {
  isFailure,
  isSuccess,
  failure,
  success,
  payload,
} = require('@pheasantplucker/failables')
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

process.on('unhandledRejection', (reason, p) => {
  log(`Unhandled Rejection ${reason.stack}`)
})

process.on('uncaughtException', err => {
  log(err, 'UNHANDLED_EXCEPTION')
})

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

    if (command === 'appcast_loader_cron') {
      const source_url =
        'https://storage.googleapis.com/starspawn_tests/feed.xml.gz'
      const target_file = `datafeeds/full_feed/${id}.xml.gz`
      const result = await http_post(id, 'download', {
        source_url,
        target_file,
      })
      return respond(res, id, command, result)
    }

    if (command === 'sitemap_cron') {
      // TODO put sitemap kick off code here
    }
    return respond(res, id, command, failure('no path'))
  } catch (e) {
    return respond(res, id, command, e.toString())
  }
})

app.post('/:command', async function(req, res) {
  try {
    const r1 = extract_arguments(req)
    if (isFailure(r1)) {
      respond(res, undefined, req.params.command, r1)
      return
    }
    const { id, command, data } = payload(r1)
    const result = await post_command_handler(id, command, data)
    respond(res, id, command, result)
  } catch (e) {
    respond(res, undefined, req.params.command, failure(e.toString()))
  }
})

function extract_arguments(req) {
  try {
    const command = req.params.command
    const data = parse_req_data(req)
    let id = data.id
    if (!id) id = uuid.v4()
    return success({ id, command, data })
  } catch (e) {
    return failure(e.toString())
  }
}

async function post_command_handler(id, command, args) {
  try {
    console.info(`${id} ${command} ${JSON.stringify(args)}`)
    const result = await FUNCTION_MAP[command](id, args)
    if (isFailure(result)) return result
    const r2 = get_next_command(id, command, result)
    if (isFailure(r2)) return r2
    const next_commands = payload(r2)
    for (let i = 0; i < next_commands.length; i++) {
      const { next_command, next_args } = next_commands[i]
      if (next_command !== 'end') http_post(id, next_command, next_args)
    }
    return result
  } catch (e) {
    return failure(e.toString())
  }
}

function get_next_command(id, prev_command, prev_results) {
  const p = payload(prev_results)
  if (prev_command === 'health_check') {
    const c1 = make_next_command('end', {})
    return success([c1])
  }
  if (prev_command === 'download') {
    return download_unzip(id, p)
  }
  if (prev_command === 'unzip') {
    return unzip_chunk(id, p)
  }
  if (prev_command === 'chunk') {
    return chunk_chunk_parse(id, p)
  }
  if (prev_command === 'parse') {
    return parse_loader(id, p)
  }
  if (prev_command === 'loader') {
    const c1 = make_next_command('end', {})
    return success([c1])
  }
  return failure(`${id} command ${prev_command} no next command found`)
}

function download_unzip(id, p) {
  const next_args = {
    source_file: p.target_file,
    target_file: `datafeeds/unziped/${id}.xml`,
  }
  const c1 = make_next_command('unzip', next_args)
  return success([c1])
}

function unzip_chunk(id, p) {
  const next_args = {
    filename: p.target_file,
    start_text: '<job>',
    end_text: '</job>',
    start_byte_offset: 0,
    end_byte_offset: 0,
  }
  const c1 = make_next_command('chunk', next_args)
  return success([c1])
}

function chunk_chunk_parse(id, p) {
  if (p.more_work) {
    const c1 = make_next_command('chunk', p.args)
    const c2 = make_next_command('parse', { filePath: p.args.target_file })
    return success([c1, c2])
  }
  const c1 = make_next_command('parse', { filePath: p.args.target_file })
  return success([c1])
}

function parse_loader(id, p) {
  const next_args = {
    filename: p.target_file,
  }
  const c1 = make_next_command('loader', next_args)
  return success([c1])
}

// ==========================================================
//
//                         HELPERS
//
// ==========================================================

async function http_post(id, command, args) {
  const data = Object.assign({}, args, { id })
  try {
    const options = {
      uri: `http://localhost:8080/${command}`,
      method: 'POST',
      headers: {
        'User-Agent': 'Request-Promise',
      },
      body: { message: { data } },
      json: true, // Automatically stringifies the body to JSON
    }
    const result = await rp(options)
    return result
  } catch (e) {
    console.error(`${id} ${command} http_post ${e.toString()}`)
    // TODO what do we do with failures in the ETL pipeline
    // should this try again? maybe?
  }
}

function make_next_command(next_command, next_args) {
  return { next_command, next_args }
}

function parse_req_data(r) {
  try {
    // const decoded = new Buffer(r.body.message.data, "base64").toString("ascii")
    // return JSON.parse(decoded)
    return r.body.message.data
  } catch (e) {
    return r.body.message.data
  }
}

function respond(res, id, command, failable) {
  res.set('Content-Type', 'application/json')
  const m = { id, command }
  if (isFailure(failable)) {
    const f = failure(payload(failable), m)
    res.status(500).send(f)
  } else if (isSuccess(failable)) {
    const f = success(payload(failable), m)
    res.status(200).send(f)
  } else {
    res.status(500).send(failure('did not return a failable', m))
  }
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
  post_command_handler,
  extract_arguments,
  get_next_command,
}
