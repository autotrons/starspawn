const {
  isFailure,
  failure,
  success,
  payload,
} = require('@pheasantplucker/failables')
const {
  getReadStream,
  createWriteStream,
} = require('@pheasantplucker/gc-cloudstorage')
const zlib = require('zlib')
const gzip = zlib.createUnzip()

async function unzip(id, data) {
  try {
    return do_file_things(id, data)
  } catch (e) {
    return failure(e.toString())
  }
}

async function do_file_things(id, data) {
  const { source_file, target_file } = data
  console.info(`${id} unzip ${target_file}`)

  const writeStreamResult = await createWriteStream(target_file)
  if (isFailure(writeStreamResult)) return writeStreamResult
  const writeStream = payload(writeStreamResult)

  const createStreamResult = await getReadStream(source_file)
  if (isFailure(createStreamResult)) return createStreamResult
  const readStream = payload(createStreamResult)
  return unzip_it(id, readStream, writeStream, gzip, target_file)
}

function unzip_it(id, rs, ws, gzip, target_file) {
  return new Promise(res => {
    rs.pipe(gzip)
      .pipe(ws)
      .on('finish', () => {
        console.info(`${id} wrote ${target_file}`)
        res(success({ target_file }))
      })
      .on('error', err => {
        console.error(`${id} unzip ${err.toString()}`)
        res(failure(err.toString()))
      })
  })
}

module.exports = {
  unzip,
}
