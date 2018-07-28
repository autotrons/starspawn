const {
  failure,
  success,
  isFailure,
  payload,
} = require('@pheasantplucker/failables')
const get = require('simple-get')
const fs = require('fs')
const { doesFileExist, fileStat } = require('./fs-failable')

async function download(source_url) {
  const end_of_url = source_url.substr(source_url.lastIndexOf('/') + 1)
  const end_of_file = end_of_url.substr(end_of_url.lastIndexOf('.') + 1)

  //check if we have it cached
  const r1 = await get_headers(source_url)
  if (isFailure(r1)) return r1
  const headers = payload(r1)
  const messy_date = headers['last-modified']
  const content_len = parseInt(headers['content-length'])
  const epoch_date = new Date(messy_date).getTime()
  const etag_with_quotes = headers.etag
  const etag = etag_with_quotes.replace(/"/g,"");
  const cached_file_name = epoch_date + "_" + etag + '.' + end_of_file

  const output_file = `./cache/${cached_file_name}`

  const r2 = await doesFileExist(output_file)
  if (isFailure(r2)) return r2
  const is_file_cached = payload(r2)

  if (is_file_cached) {
    const r3 = await fileStat(output_file)
    if (isFailure(r3)) return r3
    const file_details = payload(r3)
    if (file_details.size === content_len) {
      console.log(`Local file matches remote - using LOCAL`)
      return success({ output_file })
    }
  }

  const write_stream = fs.createWriteStream(output_file)

  const r4 = await download_file(source_url, write_stream)
  if (isFailure(r4)) return r4
  return success({ output_file })
}

async function download_file(source_url, write_stream) {
  return new Promise(resolve => {
    get(source_url, function(err, getResponse) {
      if (err) {
        resolve(failure(err.toString()))
        return
      }
      getResponse
        .pipe(write_stream)
        .on('error', function(err) {
          resolve(failure(err.toString()))
        })
        .on('finish', function() {
          resolve(success())
        })
    })
  })
}

async function get_headers(source_url) {
  return new Promise(resolve => {
    get.head(source_url, function(err, getResponse) {
      if (err) {
        resolve(failure(err.toString()))
        return
      }
      resolve(success(getResponse.headers))
    })
  })
}

module.exports = {
  download,
}
