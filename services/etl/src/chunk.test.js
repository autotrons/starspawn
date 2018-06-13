const equal = require('assert').deepEqual
const uuid = require(`uuid`)
const { assertSuccess, payload } = require('@pheasantplucker/failables')
const { chunk, find_blocks, write_blocks, continue_work } = require('./chunk')
const fs = require('fs')
const { exists } = require('@pheasantplucker/gc-cloudstorage')

const TOPIC = `test-${uuid.v4()}`

describe('chunk.js', function() {
  this.timeout(540 * 1000)
  describe('write_block', () => {
    it('write blocks to a file', async () => {
      const blocks = ['<job><id>1</id></job>', '<job><id>2</id></job>']
      const id = 'test_' + uuid.v4()
      const filename = `datafeeds/chunks/${id}/1.xml`
      const r1 = await write_blocks(id, filename, blocks, TOPIC)
      assertSuccess(r1, 2)
      const r2 = await exists('datafeeds', `chunks/${id}/1.xml`)
      assertSuccess(r2, true)
    })
    it('does nothing if no blocks', async () => {
      const blocks = []
      const id = 'test_' + uuid.v4()
      const filename = `datafeeds/chunks/${id}/1.xml`
      const r1 = await write_blocks(id, filename, blocks, TOPIC)
      assertSuccess(r1, 0)
    })
  })
  describe('find_blocks', async () => {
    it('chop the file into blocks of tag pairs', async () => {
      const start_text = '<job>'
      const end_text = '</job>'
      const readstream = fs.createReadStream(__dirname + '/feed_100.xml', {
        start: 0,
        end: 6000,
      })
      const result = await find_blocks(readstream, start_text, end_text)
      console.log(`payload(result):`, payload(result))
      assertSuccess(result)
      equal(payload(result).blocks.length > 0, true)
    })
  })
  describe('continue_work', async () => {
    it('if we do not need to do more work return false', async () => {
      const id = uuid.v4()
      const filename = 'datafeeds/full_feed/feed_100.xml'
      const cursor = Math.pow(2, 10) - 256
      const end_byte_offset = Math.pow(2, 10)
      const start_text = '<job>'
      const end_text = '</job>'
      const streamed_to = end_byte_offset
      const target_file = 'foo/bar'
      const result = continue_work(
        id,
        filename,
        cursor,
        end_byte_offset,
        start_text,
        end_text,
        streamed_to,
        target_file
      )
      assertSuccess(result)
      const p = payload(result)
      equal(p.more_work, false)
      equal(p.args.target_file, target_file)
    })
    it('if we need more work return the payload to the next call', async () => {
      const id = uuid.v4()
      const filename = 'datafeeds/full_feed/feed_100.xml'
      const cursor = Math.pow(2, 5)
      const end_byte_offset = Math.pow(2, 10)
      const start_text = '<job>'
      const end_text = '</job>'
      const streamed_to = end_byte_offset - 256
      const target_file = 'foo/bar'
      const expected = {
        id,
        filename,
        start_byte_offset: cursor,
        end_byte_offset,
        start_text,
        end_text,
        target_file,
      }
      const result = continue_work(
        id,
        filename,
        cursor,
        end_byte_offset,
        start_text,
        end_text,
        streamed_to,
        target_file
      )
      assertSuccess(result)
      const p = payload(result)
      equal(p.more_work, true)
      equal(p.args, expected)
    })
  })
  describe('chunk', async () => {
    it.only('chunk a big xml file into blocks and write the file', async () => {
      const id = uuid.v4()
      let data = {
        id,
        filename: '../../samples/unziped.xml',
        // filename: 'starspawn_tests/feed_500k.xml',
        start_byte_offset: 0,
        end_byte_offset: 4121395391,
        start_text: '<job>',
        end_text: '</job>',
      }
      while (true) {
        const result = await chunk(id, data)
        assertSuccess(result)
        const p = payload(result)
        data = p.args
        const more_work = p.more_work
        if (!more_work) break
      }
    })
    it('no end_byte_offset should read the whole file', async () => {
      const id = uuid.v4()
      const data = {
        id,
        filename: 'starspawn_tests/feed_500k.xml',
        start_byte_offset: 0,
        end_byte_offset: 0,
        start_text: '<job>',
        end_text: '</job>',
      }
      const result = await chunk(id, data)
      assertSuccess(result)
      const p = payload(result).args
      equal(p.id, data.id)
      equal(p.start_byte_offset > 1e6, true)
    })
  })
})
