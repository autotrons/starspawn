const express = require('express')
const { isFailure, payload } = require('@pheasantplucker/failables')
const { getFile } = require('@pheasantplucker/gc-cloudstorage')

const app = express()
const SITEMAP_BUCKET = 'starspawn_jobs/sitemaps'

app.get('/', (req, res) => {
  res
    .status(200)
    .send('helloworld')
    .end()
})

app.get('/:sitemapFile', async (req, res) => {
  const filePath = req.params.sitemapFile
  const r1 = await getFile(`${SITEMAP_BUCKET}/${filePath}`)
  if (isFailure(r1)) return r1
  res.status(200).send(payload(r1))
})

// Start the server
const PORT = process.env.PORT || 8080
let SERVER

const start = async () => {
  return new Promise(function(resolve, reject) {
    SERVER = app.listen(PORT, () => {
      console.log(`App listening on port ${PORT}`)
      console.log('Press Ctrl+C to quit.')
      resolve(SERVER)
    })
  })
}

const stop = async () => {
  SERVER.close()
}

module.exports = {
  start,
  stop,
  PORT,
}
