const { success } = require('@pheasantplucker/failables')
const fs = require('fs')
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

module.exports = {
  doesFileExist,
  deleteFile,
  fileStat,
}
