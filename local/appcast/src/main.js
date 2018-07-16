const fs = require('fs')
const flow = require('xml-flow')
//const inFile = fs.createReadStream('feed_100.xml')
const sanitizeHtml = require('sanitize-html')
const uuid = require('uuid')
//const { createReadStream } = require('@pheasantplucker/gc-cloudstorage')
const http_get = require('simple-get')
const zlib = require('zlib')

const log = console.log
const id = uuid.v4()
console.log(id)

async function main() {
  const input_url = process.argv[2]
  log(input_url)

  http_get(input_url, function(err, res) {
    if (err) throw err
    log(`download status code ${res.statusCode}`) // 200
    let counter = 0
    flow(res.pipe(zlib.createUnzip())).on('tag:job', (job, encoding, cb) => {
      const merged_job = Object.assign({}, job, {
        body: sanitizeHtml(job.body),
      })

      const file_number = Math.floor(counter / 1000)
      counter += 1
      fs.appendFile(
        `${file_number}.json`,
        JSON.stringify(merged_job) + '\n',
        err => {
          if (err) throw err
        }
      )
    })
  })
}

// ADD joblog.app url algorithm
// ADD check of the appcast apply url is the same maybe hash it
// ADD skills tags ???
// ADD Title cleanup algorithm
// CREATE big query wrapper library
// LOADER diffs from bigquery and loads the difference and deletes

main()
