const { render } = require('./render.js')
const { getFile } = require('@pheasantplucker/gc-cloudstorage')
const { isFailure, payload } = require(`@pheasantplucker/failables`)
const extension = require('file-extension')
const express = require('express')
const path = require('path')
const favicon = require('serve-favicon')
const app = express()
const SITEMAP_BUCKET = 'starspawn_jobs/sitemaps'

const ROBOTS_TXT_STRING =
  'User-agent: * \nDisallow: \nSitemap: https://joblog.app/sitemapindex.xml'
const log = console.log
process.on('unhandledRejection', (reason, p) => {
  log(`Unhandled Rejection ${reason.stack}`)
})

process.on('uncaughtException', err => {
  log(err, 'UNHANDLED_EXCEPTION')
})

app.use(favicon(path.join(__dirname, '../favicon.ico')))

app.get('/:jobId', async (req, res) => {
  if (req.params.jobId === 'robots.txt') {
    res.status(200).send(ROBOTS_TXT_STRING)
  }
  if (req.params.jobId === 'favicon.ico') {
    res.status(200).send('')
  }
  if (extension(req.params.jobId) === 'xml') {
    const r1 = await getFile(`${SITEMAP_BUCKET}/${req.params.jobId}`)
    if (isFailure(r1)) return r1
    res.set('Content-Type', 'text/xml')
    res.status(200).send(payload(r1))
  } else {
    render(req, res)
  }
})

app.get('/', (req, res) => {
  res.status(200).send('A log for jobs')
})

// Start the server
const PORT = process.env.PORT || 8080

let server
const start = async () => {
  return new Promise(resolve => {
    server = app.listen(PORT, () => {
      console.log(`App listening on port ${PORT}`)
      console.log('Press Ctrl+C to quit.')
      resolve()
    })
  })
}

const stop = async () => {
  server.close()
}

module.exports = {
  render,
  start,
  stop,
  PORT,
}
