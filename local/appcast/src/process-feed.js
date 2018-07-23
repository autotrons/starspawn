const { success, isFailure, payload } = require('@pheasantplucker/failables')
const { download } = require('./download')
const { unzip } = require('./unzip')
const { parse } = require('./parse')

// ADD check of the appcast apply url is the same maybe hash it
// ADD skills tags ???
// ADD Title cleanup algorithm
// CREATE big query wrapper library
// LOADER diffs from bigquery and loads the difference and deletes

// node src/start.js https://exchangefeeds.s3.amazonaws.com/9d2dcb702d7d6b801f34227c04c8bb23/feed.xml.gz
async function processFeed(source_url) {
  const steps = []
  const downloadResult = await download(source_url)
  if (isFailure(downloadResult)) return downloadResult
  const downloaded = payload(downloadResult).output_file
  steps.push(downloaded)
  const unzipResult = await unzip(downloaded)
  if (isFailure(unzipResult)) return unzipResult
  const unzipped = payload(unzipResult).output_file
  steps.push(unzipped)

  const parseResult = await parse(unzipped)
  const parsed = payload(parseResult).output_file
  steps.push(parsed)
  return success(steps)
}

module.exports = {
  processFeed,
}
