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
  const { source_bucket, source_file, target_bucket, target_file } = data

  const targetPath = `${target_bucket}/${target_file}`
  const writeStreamResult = await createWriteStream(targetPath)
  if (isFailure(writeStreamResult)) return writeStreamResult
  const writeStream = payload(writeStreamResult)

  const sourcePath = `${source_bucket}/${source_file}`
  const createStreamResult = await getReadStream(sourcePath, {})
  if (isFailure(createStreamResult)) return createStreamResult
  const readStream = payload(createStreamResult)

  return new Promise((res, rej) => {
    readStream
      .pipe(gzip)
      .pipe(writeStream)
      .on('finish', () => res(success(targetPath)))
      .on('error', err => rej(failure(err.toString())))
  })
}

module.exports = {
  unzip,
}
