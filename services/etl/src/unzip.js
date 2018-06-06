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

  const writeStreamResult = await createWriteStream(target_file)
  if (isFailure(writeStreamResult)) return writeStreamResult
  const writeStream = payload(writeStreamResult)

  const createStreamResult = await getReadStream(source_file)
  if (isFailure(createStreamResult)) return createStreamResult
  const readStream = payload(createStreamResult)
  return unzip_it(readStream, writeStream, gzip, target_file)
}

function unzip_it(rs, ws, gzip, target_file) {
  return new Promise(res => {
    rs.pipe(gzip)
      .pipe(ws)
      .on('finish', () => res(success({ target_file })))
      .on('error', err => res(failure(err.toString())))
  })
}

module.exports = {
  unzip,
}
