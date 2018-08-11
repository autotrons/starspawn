const { success, isFailure, payload } = require('@pheasantplucker/failables')
const { download } = require('./download')
const { unzip } = require('./unzip')
const { parse } = require('./parse')
const { loader } = require('./loader')

// ADD check of the appcast apply url is the same maybe hash it
// ADD skills tags ???
// ADD Title cleanup algorithm
// CREATE big query wrapper library
// LOADER diffs from bigquery and loads the difference and deletes

// node src/start.js https://exchangefeeds.s3.amazonaws.com/9d2dcb702d7d6b801f34227c04c8bb23/feed.xml.gz
async function processFeed(source_url, is_test = false) {
  const steps = []

  console.time('download')
  const downloadResult = await download(source_url)
  console.timeEnd('download')

  if (isFailure(downloadResult)) return downloadResult
  const downloaded = payload(downloadResult).output_file
  steps.push(downloaded)

  console.time('unzip')
  const unzipResult = await unzip(downloaded)
  console.timeEnd('unzip')
  if (isFailure(unzipResult)) return unzipResult
  const unzipped = payload(unzipResult).output_file
  steps.push(unzipped)

  console.time('parse')
  const parseResult = await parse(unzipped)
  console.timeEnd('parse')
  const { jobFiles, cityFiles } = payload(parseResult)
  steps.push(jobFiles)
  steps.push(cityFiles)

  console.time('loader')
  const loaderResult = await loader(jobFiles, /*cityFiles,*/ is_test)
  console.timeEnd('loader')
  const last_payload = payload(loaderResult)
  steps.push(last_payload)
  return success(steps)
}

module.exports = {
  processFeed,
}
