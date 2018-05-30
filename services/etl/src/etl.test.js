const equal = require('assert').deepEqual
const { promisify } = require('util')
const fs = require('fs')
const readFileAsync = promisify(fs.readFile)
const { setupPubSub, TOPICS, start, stop } = require('./etl.js')
const { assertSuccess, payload, meta } = require('@pheasantplucker/failables')
const { exists } = require('@pheasantplucker/gc-cloudstorage')
const { topicExists } = require('@pheasantplucker/gc-pubsub')
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
    await start()
  })

  after(() => {
    stop()
  })

  describe(`setupPubSub()`, () => {
    it(`should setup topics`, async () => {
      const result = await setupPubSub()
      assertSuccess(result)
    })

    TOPICS.forEach(topic => {
      it(`should have created the topic: ${topic}`, async () => {
        const result = await topicExists(topic)
        assertSuccess(result)
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

  describe.skip('/appcast_pipeline', () => {
    it('should call all the functions in the pipeline', async () => {
      const called_functions = []
      const expected = [
        'download',
        'unzip',
        'chunk',
        'parse',
        'json2gsd',
        'loader',
      ]
      const r1 = await appcast_pipeline()
      assertSuccess(r1)
      const id = payload(r1).id
      const r2 = await try_until(500, 2 * 1000, async () => {
        try {
          const file_data = await readFileAsync(`src/${is}.log`)
          const hases = expected.map(t => file_data.includes(t))
          if (all_true(hases)) return true
          return false
        } catch (e) {
          return false
        }
      })
      equal(called_functions, expected)
    })
  })
})

function sleep(ms) {
  return new Promise(res => {
    setTimeout(() => {
      res()
    }, ms)
  })
}

function all_true(source_list) {
  const filtered = source_list.filter(t => t === true)
  if (filtered.length === source_list.length) return true
  return false
}
