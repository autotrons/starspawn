const {
  isFailure,
  failure,
  success,
  payload
} = require("@pheasantplucker/failables")
const {
  getReadStream,
  createWriteStream
} = require("@pheasantplucker/gc-cloudstorage")
const zlib = require("zlib")
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

  const target = `${target_bucket}/${target_file}`
  const writeStreamResult = await createWriteStream(target)
  if (isFailure(writeStreamResult)) return writeStreamResult
  const writeStream = payload(writeStreamResult)

  const source = `${source_bucket}/${source_file}`
  const createStreamResult = await getReadStream(source, {})
  if (isFailure(createStreamResult)) return createStreamResult
  const readStream = payload(createStreamResult)

  return new Promise((res, rej) => {
    readStream
      .pipe(gzip)
      .pipe(writeStream)
      .on("finish", () => res(success(target)))
      .on("error", err => rej(failure(err.toString())))
  })
}

module.exports = {
  unzip
}
