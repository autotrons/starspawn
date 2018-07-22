const { failure, success } = require('@pheasantplucker/failables')
const fs = require('fs')
const zlib = require('zlib')

function getFileName(currentName) {
  const splitSource = currentName.split('/')
  const sourceFileName = splitSource[splitSource.length - 1]
  return sourceFileName.replace('.gz', '')
}

async function unzip(source_file) {
  const output_file = `./cache/${getFileName(source_file)}`
  const writeStream = fs.createWriteStream(output_file)

  const readStream = fs.createReadStream(source_file)
  return unzip_it(readStream, writeStream, output_file)
}

function unzip_it(rs, ws, output_file) {
  return new Promise(res => {
    rs.pipe(zlib.createUnzip())
      .pipe(ws)
      .on('finish', () => {
        res(success({ output_file }))
      })
      .on('error', err => {
        console.error(`unzip: ${err.toString()}`)
        res(failure(err.toString()))
      })
  })
}

module.exports = {
  unzip,
}
