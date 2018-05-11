const uuid = require("uuid")
const { failure, success } = require("@pheasantplucker/failables-node6")
const miss = require("mississippi")
const storage = require("@google-cloud/storage")()

async function chunk(req, res) {
  const id = uuid.v4()
  console.log(`${id} starting`)
  const { filename, start_text, end_text } = req.body.attributes
  const { bucketpart, filepart } = split_filename(filename)
  const myBucket = storage.bucket(bucketpart)
  console.log(bucketpart, filepart)
  const readFileHandle = myBucket.file(filepart)
  //console.log(data[0])
  const rStream = readFileHandle.createReadStream()
  rStream.pause()
  const waitHere = await new Promise((res, rej) => {
    let cursor = 0
    let locations = []
    let oldchunk = ""
    let newchunk = ""
    rStream.on("readable", () => {
      while (null !== (newchunk = rStream.read())) {
        newchunk = newchunk.toString()
        const temp = oldchunk + newchunk
        const new_locations = indexes(temp, start_text)
        const offset = new_locations.map(l => l + cursor)
        locations.push(...offset)
        cursor += oldchunk.length - (start_text.length - 1)
        oldchunk = newchunk.slice()
      }
    })
    rStream.on("end", () => {
      locations.sort((a, b) => a - b)
      console.log(locations)
      console.log(`loc length ${locations.length}`)
      res()
    })
  })
  // console.log(rStream.isPaused())
  //const writeFileHandle = myBucket.file(file.name)
  let counter = 0
  return res_ok(res, { id })
}

function split_at(text, index) {
  return [text.substring(0, index), text.substring(index)]
}

function find_file_offsets(rs, start_text, end_text, batchsize) {
  return new Promise((res, rej) => {
    let cursor = 0
    let buffer = ""
    let locs = []
    let is_start = true
    let curr_text = start_text
    let start_location = -1
    let stop_location = -1
    const toggle_text = () => {
      if (is_start) curr_text = end_text
      is_start = !is_start
    }
    function dochunk(chunk, next) {
      buffer += chunk
      //console.log(chunk.toString())
      const len = buffer.length
      if (len < curr_text.length) {
        next()
        return
      }
      const [head, tail] = split_at(buffer, len - curr_text.length)
      const new_locs = indexes(head, curr_text)
      const offsets = new_locs.map(l => l + cursor)
      locs.push(...new_locs)
      if (new_locs.length > 0) toggle_text()
      cursor += head.length
      buffer = tail
      next()
    }

    function done(err) {
      if (err) {
        console.error(err.toString())
        res(failure(err.toString()))
      } else {
        console.log(locs.slice(0, 5))
        res(success(locs.length))
      }
    }
    miss.each(rs, dochunk, done)
  })
}
function indexes(str, find) {
  var result = []
  var index = -1
  while (index < str.length) {
    index = str.indexOf(find, index + 1)
    if (index == -1) break
    result.push(index)
  }
  return result
}

function readSomeData() {
  const readable = getReadableStreamSomehow()
  readable.on("readable", () => {
    let chunk
    while (null !== (chunk = readable.read())) {
      console.log(`Received ${chunk.length} bytes of data.`)
    }
  })
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

function split_filename(n) {
  const [bucketpart, ...filepartarray] = n.split("/")
  const filepart = filepartarray.join("/")
  return { bucketpart, filepart }
}

module.exports = {
  split_at,
  chunk,
  find_file_offsets
}
