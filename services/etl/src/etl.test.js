const {
  start,
  stop,
  post_command_handler,
  extract_arguments,
  get_next_command,
} = require('./etl.js')
const { assertSuccess, success } = require('@pheasantplucker/failables')
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
  describe('/health_check', () => {
    it('should return the id in a payload', async () => {
      const id = uuid.v4()
      const result = await health_check(id)
      assertSuccess(result)
    })
  })
  describe('get_next_command()', () => {
    it('should return the id in a payload', () => {
      const id = uuid.v4()
      const prev_command = 'download'
      const prev_failable = success()
      const result = get_next_command(id, prev_command, prev_failable)
      assertSuccess(result, { next_command: 'unzip', next_args: {} })
    })
  })

  // describe.skip('/appcast_pipeline', () => {
  //   it('should call all the functions in the pipeline', async () => {
  //     const called_functions = []
  //     const expected = [
  //       'download',
  //       'unzip',
  //       'chunk',
  //       'parse',
  //       'json2gsd',
  //       'loader',
  //     ]
  //     const r1 = await appcast_pipeline()
  //     assertSuccess(r1)
  //     const id = payload(r1).id
  //     const r2 = await try_until(500, 2 * 1000, async () => {
  //       try {
  //         const file_data = await readFileAsync(`src/${is}.log`)
  //         const hases = expected.map(t => file_data.includes(t))
  //         if (all_true(hases)) return true
  //         return false
  //       } catch (e) {
  //         return false
  //       }
  //     })
  //     equal(called_functions, expected)
  //   })
  // })
})
