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

const { sitemap } = require('./sitemap')
const { sitemapindex } = require('./sitemapindex')
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
  health_check,
  sitemap,
  sitemapindex,
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
    console.info(`${id} ${command}`)
    if (command === 'echo') {
      return respond(res, id, command, success('echo'))
    }
    if (command === 'sitemap_cron') {
      const destination = 'starspawn_jobs/sitemaps'
      const job_size = 300 // bytes for safeness
      const max_file_size = 1e7
      const count = Math.floor(max_file_size / job_size) // 10 MB max
      const iteration = 0
      const sitemapPaths = []

      const data = { count, iteration, sitemapPaths, destination }
      const result = await http_post(id, 'sitemap', data)
      return respond(res, id, command, result)
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
    console.info(`${id} ${command}`)
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
  if (prev_command === 'sitemap') {
    return sitemap_sitemap_sitemapindex(id, p)
  }
  if (prev_command === 'sitemapindex') {
    const c1 = make_next_command('end', {})
    return success([c1])
  }
  return failure(`${id} command ${prev_command} no next command found`)
}

function sitemap_sitemap_sitemapindex(id, p) {
  if (p.more_work) {
    delete p.more_work
    delete p.id
    const c1 = make_next_command('sitemap', p)
    return success([c1])
  }
  const c1 = make_next_command('sitemapindex', {
    sitemapPaths: p.sitemapPaths,
    notifyGoogle: true,
  })
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
      uri: `https://sitemap-dot-starspawn-201921.appspot.com/${command}`,
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
    const f = failure(JSON.stringify(payload(failable), null, '\t'), m)
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
  get_next_command,
  extract_arguments,
  post_command_handler,
}
