const { success, failure } = require('@pheasantplucker/failables')
const fs = require('fs-extra')
const readline = require('readline')
const { constants: fsConstants } = fs

async function doesFileExist(path) {
  return new Promise(resolve => {
    fs.access(path, fsConstants.F_OK, (err, stat) => {
      if (err) resolve(success(false))
      resolve(success(true))
    })
  })
}

async function fileStat(path) {
  return new Promise(resolve => {
    fs.stat(path, (err, stats) => {
      if (err) resolve(success(false))
      resolve(success(stats))
    })
  })
}

async function deleteFile(path) {
  return new Promise(resolve => {
    fs.unlink(path, err => {
      if (err) resolve(success(false))
      resolve(success(true))
    })
  })
}


async function readFile(path, encoding) {
  return new Promise(resolve => {
    fs.readFile(path, encoding, (err, data) => {
      if (err) resolve(success(false))
      resolve(success(data))
    })
  })
}

async function mkdir(path) {
  return new Promise(resolve => {
    fs.mkdir(path, (err) => {
      if (err) resolve(success(err))
      resolve(success(true))
    })
  })
}

async function read_file_to_array(path) {
  return new Promise(resolve => {
    try {
      const read_line_stream = readline.createInterface({
        input: fs.createReadStream(path),
        crlfDelay: Infinity,
      })

      let lines = []

      read_line_stream.on('line', line => {
        lines.push(line)
      })

      read_line_stream.on('close', () => {
        resolve(success(lines))
      })
    } catch (e) {
      resolve(failure(e))
    }
  })
}

module.exports = {
  doesFileExist,
  deleteFile,
  fileStat,
  readFile,
  read_file_to_array,
  mkdir,
}
