const { failure, success } = require('@pheasantplucker/failables')
const get = require('simple-get')
const fs = require('fs')

async function download(source_url) {
  const end_of_url = source_url.substr(source_url.lastIndexOf('/') + 1)
  const output_file = `./cache/${end_of_url}`
  const write_stream = fs.createWriteStream(output_file)
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
          resolve(success({ output_file }))
        })
    })
  })
}

module.exports = {
  download,
}
