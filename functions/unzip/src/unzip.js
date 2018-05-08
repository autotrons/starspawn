const uuid = require("uuid")
const zlib = require("zlib")
const storage = require("@google-cloud/storage")()
const { success, failure } = require("@pheasantplucker/failables-node6")

const gzip = zlib.createUnzip()
const function_name = "unzip"

async function unzip(req, res) {
  const id = uuid.v4()
  try {
    const result = await do_file_things(id, req)
    return res_ok(res, { id, function_name })
  } catch (e) {
    return res_err(res, { id, function_name, error: e.toString() })
  }
}

function res_ok(res, payload) {
  console.info(payload)
  res.status(200).send(success(payload))
  return success(payload)
}

function res_err(res, payload) {
  console.error(payload)
  res.status(500).send(failure(payload))
  return failure(payload)
}

function do_file_things(id, req) {
  const {
    source_bucket,
    source_filename,
    target_bucket,
    target_filename
  } = req.body.attributes
  console.info(
    `${id} ${function_name} ${source_bucket}/${source_filename} -> ${target_bucket}/${target_filename}`
  )
  const s_bucket = storage.bucket(source_bucket)
  const s_file = s_bucket.file(source_filename)
  const t_bucket = storage.bucket(target_bucket)
  const t_file = t_bucket.file(target_filename)
  return new Promise((res, rej) => {
    s_file
      .createReadStream()
      .pipe(gzip)
      .pipe(t_file.createWriteStream())
      .on("finish", () => {
        res()
      })
      .on("error", err => {
        rej(err.toString())
      })
  })
}

module.exports = {
  unzip
}
