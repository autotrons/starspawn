const uuid = require('uuid')
const {
  failure,
  success,
  isFailure,
  payload,
} = require('@pheasantplucker/failables')
const miss = require('mississippi')
const { stats /* getBucket */ } = require('@pheasantplucker/gc-cloudstorage')
const { createReadStream } = require('fs-extra')
const { writeEntity } = require('@pheasantplucker/gc-datastore')

const COMPLETE = 'complete'
const NAME = 'chunk'

async function getReadStream(filename, start_byte_offset, end_byte_offset) {
  const strm = await createReadStream(filename, {
    start: start_byte_offset,
    end: end_byte_offset,
  })
  return strm
  //
  // const { bucketpart, filepart } = split_filename(filename)
  // const myBucket = getBucket(bucketpart)
  // const readFileHandle = myBucket.file(filepart)
  // const rStream = readFileHandle.createReadStream({
  //   start: start_byte_offset,
  //   end: end_byte_offset,
  // })
  // return rStream
}

async function chunk(id, data) {
  try {
    let {
      filename,
      start_text,
      end_text,
      start_byte_offset,
      end_byte_offset,
    } = data

    if (
      end_byte_offset === undefined ||
      end_byte_offset === null ||
      end_byte_offset === 0
    ) {
      const stat_result = await stats(filename)
      end_byte_offset = payload(stat_result).size
    }
    console.info(
      `${id} ${NAME} starting on ${filename} at ${start_byte_offset} to ${end_byte_offset}`
    )

    const rStream = await getReadStream(
      filename,
      start_byte_offset,
      end_byte_offset
    )

    const r1 = await find_blocks(
      rStream,
      start_text,
      end_text,
      start_byte_offset
    )
    if (isFailure(r1)) {
      console.error(`${id} ${NAME} find_blocks ${payload(r1)}`)
      return r1
    }
    rStream.destroy()
    const blocks = payload(r1).blocks
    const cursor = payload(r1).cursor
    const streamed_to = payload(r1).streamed_to
    const sub_id = uuid.v4()
    const target_file = `datafeeds/chunks/${id}/${sub_id}.xml`
    const r2 = await write_blocks(id, target_file, blocks, sub_id)
    if (isFailure(r2)) {
      console.error(`${id} ${NAME} write_blocks ${payload(r2)}`)
      return r2
    }
    return continue_work(
      id,
      filename,
      cursor,
      end_byte_offset,
      start_text,
      end_text,
      streamed_to,
      target_file
    )
  } catch (err) {
    console.error(`${id} ${NAME} ${err.toString()}`)
    return failure(err.toString())
  }
}

function find_blocks(rs, start_text, end_text, cursor = 0) {
  return new Promise((res, rej) => {
    const starttime = Date.now()
    let blocks = []
    let buffer = ''
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
        const block_limit = blocks.length >= 250
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

let jobCount = 0
async function write_blocks(id, filename, blocks, subid) {
  try {
    if (blocks.length <= 0) {
      console.info(`${id} had 0 blocks`)
      return success(blocks.length)
    }
    console.info(`${id} try to write ${blocks.length} blocks to ${filename}`)
    jobCount += blocks.length
    console.info(`jobCount:::::::::::::`, jobCount)
    // const file = getFileHandle(filename)
    const preblob = `<?xml version="1.0" encoding="UTF-8"?>\n<root>\n`
    const postblob = `\n</root>`
    const blob = blocks.join('\n')
    let ent = { data: preblob + blob + postblob }
    ent.key = { name: subid }
    const r1 = await writeEntity(ent, './testdata/')
    if (isFailure(r1)) {
      console.error(`${id} ${NAME} write_blocks await file.save ${payload(r1)}`)
      return r1
    }
    return success(blocks.length)
  } catch (e) {
    console.error(`${id} ${NAME} ${e.toString()}`)
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
  streamed_to,
  target_file
) {
  const args = {
    id,
    filename,
    start_byte_offset: cursor,
    end_byte_offset: end_byte_offset,
    start_text,
    end_text,
    target_file,
  }
  if (streamed_to >= end_byte_offset) {
    console.info(`${id} ${NAME} end of section reached`)
    return success({ more_work: false, args })
  }

  return success({ more_work: true, args })
}

function chop(str, idx) {
  return str.slice(idx)
}

// function split_filename(n) {
//   const [bucketpart, ...filepartarray] = n.split('/')
//   const filepart = filepartarray.join('/')
//   return { bucketpart, filepart }
// }
//
// function getFileHandle(filepath) {
//   const { bucketpart, filepart } = split_filename(filepath)
//   const bucket = getBucket(bucketpart)
//   const file = bucket.file(filepart)
//   return file
// }

module.exports = {
  chunk,
  find_blocks,
  write_blocks,
  continue_work,
}
