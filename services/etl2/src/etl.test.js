const {
  start,
  stop,
  post_command_handler,
  extract_arguments,
  get_next_command,
} = require('./etl.js')
const {
  assertSuccess,
  success,
  //  payload,
} = require('@pheasantplucker/failables')
const uuid = require('uuid')
const rp = require('request-promise')

const log = console.log

async function health_check(id) {
  const options = {
    uri: 'http://localhost:8080/health_check',
    method: 'POST',
    headers: {
      'User-Agent': 'Request-Promise',
    },
    body: { message: { data: { id } } },
    json: true, // Automatically stringifies the body to JSON
  }
  const result = await rp(options)
  return result
}

// async function appcast_pipeline(id) {
//   const options = {
//     uri: 'http://localhost:8080/appcast_pipeline_test',
//     method: 'GET',
//     headers: {
//       'User-Agent': 'Request-Promise',
//     },
//     json: true, // Automatically stringifies the body to JSON
//   }
//   const result = await rp(options)
//   return result
// }

describe('etl.js', function() {
  this.timeout(540 * 1000)
  before(async () => {
    log('starting server')
    await start()
  })

  after(() => {
    stop()
  })

  describe('post_command_handler()', () => {
    it('run a command', async () => {
      const id = uuid.v4()
      const result = await post_command_handler(id, 'health_check', {})
      assertSuccess(result)
    })
  })
  describe('extract_arguments()', () => {
    it('run a command', async () => {
      const test_id = uuid.v4()
      const test_command = 'health_check'
      const test_data = { id: test_id }
      const req = {
        params: {
          command: test_command,
        },
        body: {
          message: {
            data: test_data,
          },
        },
      }
      const r1 = extract_arguments(req)
      assertSuccess(r1, { id: test_id, command: test_command, data: test_data })
    })
  })
  describe('get_next_command()', () => {
    it('download to unzip', () => {
      const id = uuid.v4()
      const prev_command = 'download'
      const source_file = 'foobar/boobaz.xml'
      const target_file = `datafeeds/unziped/${id}.xml`
      const prev_failable = success({ target_file: source_file })
      const result = get_next_command(id, prev_command, prev_failable)
      assertSuccess(result, [
        {
          next_command: 'unzip',
          next_args: { source_file, target_file },
        },
      ])
    })
    it('unzip to chunk', () => {
      const id = uuid.v4()
      const prev_command = 'unzip'
      const source_file = `datafeeds/unziped/${id}.xml`
      const prev_failable = success({ target_file: source_file })

      const filename = source_file
      const start_text = '<job>'
      const end_text = '</job>'
      const start_byte_offset = 0
      const end_byte_offset = 0
      const next_command = 'chunk'
      const next_args = {
        filename,
        start_text,
        end_text,
        start_byte_offset,
        end_byte_offset,
      }

      const result = get_next_command(id, prev_command, prev_failable)
      assertSuccess(result, [
        {
          next_command,
          next_args,
        },
      ])
    })
    it('chunk to chunk & parse', () => {
      const id = uuid.v4()
      const prev_command = 'chunk'
      const filename = `datafeeds/unziped/${id}.xml`
      const start_text = '<job>'
      const end_text = '</job>'
      const start_byte_offset = 100 * 1000
      const end_byte_offset = 200 * 1000
      const target_file = `datafeeds/chunks/${id}/1234-5678.xml`
      const prev_args = {
        filename,
        start_text,
        end_text,
        start_byte_offset,
        end_byte_offset,
        target_file,
      }
      const prev_failable = success({ more_work: true, args: prev_args })

      const result = get_next_command(id, prev_command, prev_failable)
      assertSuccess(result, [
        {
          next_command: 'chunk',
          next_args: prev_args,
        },
        {
          next_command: 'parse',
          next_args: { filePath: target_file },
        },
      ])
    })
    it('chunk to parse because chunk is complete', () => {
      const id = uuid.v4()
      const prev_command = 'chunk'
      const filename = `datafeeds/unziped/${id}.xml`
      const start_text = '<job>'
      const end_text = '</job>'
      const start_byte_offset = 100 * 1000
      const end_byte_offset = 200 * 1000
      const target_file = `datafeeds/chunks/${id}/1234-5678.xml`
      const prev_args = {
        filename,
        start_text,
        end_text,
        start_byte_offset,
        end_byte_offset,
        target_file,
      }
      const prev_failable = success({ more_work: false, args: prev_args })

      const result = get_next_command(id, prev_command, prev_failable)
      assertSuccess(result, [
        {
          next_command: 'parse',
          next_args: { filePath: target_file },
        },
      ])
    })
  })

  describe('/health_check', () => {
    it('should return the id in a payload', async () => {
      const id = uuid.v4()
      const result = await health_check(id)
      assertSuccess(result)
    })
  })
})
