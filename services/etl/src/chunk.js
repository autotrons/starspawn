const uuid = require("uuid")
const {
  failure,
  success,
  isFailure,
  payload
} = require("@pheasantplucker/failables")
const miss = require("mississippi")
const storage = require("@google-cloud/storage")()
const { publish } = require("./pubsub")

const COMPLETE = "complete"

async function chunk(id, data) {
  console.info(
    `${id} chunk starting on ${filename} at ${start_byte_offset} to ${end_byte_offset}`
  )
  const {
    filename,
    start_text,
    end_text,
    start_byte_offset,
    end_byte_offset,
    parse_topic,
    continue_topic
  } = data

  const { bucketpart, filepart } = split_filename(filename)
  const myBucket = storage.bucket(bucketpart)
  const readFileHandle = myBucket.file(filepart)
  const rStream = readFileHandle.createReadStream({
    start: start_byte_offset,
    end: end_byte_offset
  })

  async function pipeline() {
    try {
      const r1 = await find_blocks(
        rStream,
        start_text,
        end_text,
        start_byte_offset
      )
      if (isFailure(r1)) {
        console.error(`${id} find_blocks ${payload(r1)}`)
        return
      }
      const blocks = payload(r1).blocks
      const cursor = payload(r1).cursor
      const sub_id = uuid.v4()
      const r2 = await write_blocks(
        id,
        `datafeeds/chunks/${id}/${sub_id}.xml`,
        blocks,
        parse_topic
      )
      if (isFailure(r2)) {
        console.error(`${id} write_blocks ${payload(r2)}`)
        return
      }
      const r3 = continue_work(
        id,
        filename,
        cursor,
        end_byte_offset,
        start_text,
        end_text,
        parse_topic,
        continue_topic
      )
      if (r3 === false) {
        console.info(`${id} continue_work complete`)
        return
      }

      const for_logging = r3.data.toString()
      console.info(`${id} needs more work ${for_logging}`)
      const r4 = await publish(continue_topic, r3)
      if (isFailure(r4)) {
        console.error(`${id} publish ${payload(r4)}`)
      }
    } catch (err) {
      console.error(`${id} pipeline ${err.toString()}`)
    }
  }
  pipeline()
  return success()
}

function find_blocks(rs, start_text, end_text, cursor = 0) {
  return new Promise((res, rej) => {
    const starttime = Date.now()
    let blocks = []
    let buffer = ""
    let start_idx = -1
    let end_idx = -1
    function dochunk(chunk, more) {
      // look for next tags
      buffer += chunk.toString()
      while (buffer.length > 0) {
        start_idx = buffer.indexOf(start_text)
        end_idx = buffer.indexOf(end_text)
        // one of the tags is missing so we need more data
        if (end_idx < 0 || start_idx < 0) break
        // move to the end of the text
        end_idx += end_text.length
        // the tags are both in the buffer and in the right order
        if (start_idx < end_idx) {
          const b = buffer.slice(start_idx, end_idx)
          blocks.push(b)
        }
        // chop the buffer to the next end_idx so we can look for the next pair
        cursor += end_idx
        buffer = chop(buffer, end_idx)
        // should we bail out now
        if (blocks.length >= 1000 || Date.now() - starttime > 500 * 1000) {
          more(COMPLETE)
        }
      }
      more()
    }

    async function done(err) {
      if (err && err !== COMPLETE) {
        console.error("123")
        console.error(err.toString())
        res(failure(err.toString()))
        return
      }

      res(success({ blocks, cursor }))
    }

    miss.each(rs, dochunk, done)
  })
}

async function write_blocks(id, filename, blocks, topic) {
  try {
    console.info(`${id} writing ${filename}`)
    const file = getFileHandle(filename)
    const preblob = `<?xml version="1.0" encoding="UTF-8"?>\n<root>\n`
    const postblob = `\n</root>`
    const blob = blocks.join("\n")
    const r1 = await file.save(preblob + blob + postblob)
    //if (isFailure(r1)) return r1
    //console.info(`${id} wrote ${blocks.length} blocks at ${filename}`)
    const message = {
      data: Buffer.from(JSON.stringify({ id, filename })),
      attributes: { id, filename }
    }
    return publish(topic, message)
  } catch (e) {
    console.error(e.toString())
    return failure(e.toString())
  }
}

function continue_work(
  id,
  filename,
  cursor,
  end_byte_offset,
  start_text,
  end_text,
  parse_topic,
  continue_topic
) {
  if (cursor >= end_byte_offset) return false
  const args = {
    id,
    filename,
    start_byte_offset: cursor,
    end_byte_offset: end_byte_offset,
    start_text,
    end_text,
    parse_topic,
    continue_topic
  }

  const data = Buffer.from(JSON.stringify(args))
  const message = {
    data
  }
  return message
}

function chop(str, idx) {
  return str.slice(idx)
}

function split_filename(n) {
  const [bucketpart, ...filepartarray] = n.split("/")
  const filepart = filepartarray.join("/")
  return { bucketpart, filepart }
}

function getFileHandle(filepath) {
  const { bucketpart, filepart } = split_filename(filepath)
  const bucket = storage.bucket(bucketpart)
  const file = bucket.file(filepart)
  return file
}

module.exports = {
  chunk,
  find_blocks,
  write_blocks,
  continue_work
}
