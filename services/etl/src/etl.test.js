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

async function appcast_pipeline(id) {
  const options = {
    uri: 'http://localhost:8080/appcast_pipeline_test',
    method: 'GET',
    headers: {
      'User-Agent': 'Request-Promise',
    },
    json: true, // Automatically stringifies the body to JSON
  }
  const result = await rp(options)
  return result
}

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
      assertSuccess(result, {
        next_command: 'unzip',
        next_args: { source_file, target_file },
      })
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
      assertSuccess(result, {
        next_command,
        next_args,
      })
    })
  })

  describe('/health_check', () => {
    it('should return the id in a payload', async () => {
      const id = uuid.v4()
      const result = await health_check(id)
      assertSuccess(result)
    })
  })
  describe('/appcast_pipeline', () => {
    it('start the appcast pipeline', async () => {
      const r1 = await appcast_pipeline()
      assertSuccess(r1)
      //const id = payload(r1).id
      // const r2 = await try_until(500, 2 * 1000, async () => {
      //   try {
      //     // see if the jobs are in the database
      //   } catch (e) {
      //     return false
      //   }
      // })
    })
  })
})

// async function try_until(interval, timeout, condition) {
//   let result = false
//   let start_time = Date.now()
//   while (result === false) {
//     result = await condition()
//     if (result) return true
//     await sleep(interval)

//     if (Date.now() - start_time > timeout) return false
//   }
//   return false
// }
