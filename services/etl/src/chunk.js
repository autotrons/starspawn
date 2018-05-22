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
  const {
    filename,
    start_text,
    end_text,
    start_byte_offset,
    end_byte_offset,
    parse_topic,
    continue_topic
  } = data

  console.info(
    `${id} chunk starting on ${filename} at ${start_byte_offset} to ${end_byte_offset}`
  )

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
      const streamed_to = payload(r1).streamed_to
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
        continue_topic,
        streamed_to
      )
      if (r3 === false) {
        console.info(`${id} complete`)
        return
      }

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
    let streamed_to = cursor
    function dochunk(chunk, more) {
      // look for next tags
      streamed_to += chunk.length
      buffer += chunk.toString()
      while (buffer.length > 0) {
        start_idx = buffer.indexOf(start_text)
        end_idx = buffer.indexOf(end_text)
        // one of the tags is missing so we need more data
        if (end_idx < 0 || start_idx < 0) {
          break
        }
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
        const times_up = Date.now() - starttime > 500 * 1000
        const block_limit = blocks.length >= 1000
        if (times_up || block_limit) {
          more(COMPLETE)
        }
      }
      more()
    }

    function done(err) {
      if (err && err !== COMPLETE) {
        console.error(err.toString())
        res(failure(err.toString()))
        return
      }

      res(success({ blocks, cursor, streamed_to }))
    }

    miss.each(rs, dochunk, done)
  })
}

async function write_blocks(id, filename, blocks, topic) {
  try {
    if (blocks.length <= 0) {
      console.info(`${id} had 0 blocks`)
      return success()
    }
    console.info(`${id} try to write ${blocks.length} blocks to ${filename}`)
    const file = getFileHandle(filename)
    const preblob = `<?xml version="1.0" encoding="UTF-8"?>\n<root>\n`
    const postblob = `\n</root>`
    const blob = blocks.join("\n")
    const r1 = await file.save(preblob + blob + postblob)
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
  continue_topic,
  streamed_to
) {
  if (streamed_to >= end_byte_offset) {
    console.info(`${id} end of section reached`)
    return false
  }
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
