const {
  start,
  stop,
  post_command_handler,
  extract_arguments,
  get_next_command,
} = require('./server')
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

async function sitemap_cron(id) {
  const options = {
    uri: 'http://localhost:8080/sitemap_cron',
    method: 'GET',
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
  describe('get_next_command()', () => {
    it('sitemap to sitemap', () => {
      const id = uuid.v4()
      const prev_command = 'sitemap'
      const count = 50
      const iteration = 1
      const sitemapPaths = [
        `foo_bucket/test_sitemap_0.xml`,
        `foo_bucket/test_sitemap_1.xml`,
      ]
      const cursor = 'asdf-adsf-adsf-asdf'
      const more_work = true

      const data = {
        id,
        iteration,
        cursor,
        more_work,
        sitemapPaths,
        count,
      }

      const prev_failable = success(data)
      const result = get_next_command(id, prev_command, prev_failable)
      assertSuccess(result, [
        {
          next_command: 'sitemap',
          next_args: { iteration, cursor, sitemapPaths, count },
        },
      ])
    })
    it('sitemap to sitemapindex', () => {
      const id = uuid.v4()
      const prev_command = 'sitemap'
      const count = 50
      const iteration = 1
      const sitemapPaths = [
        `foo_bucket/test_sitemap_0.xml`,
        `foo_bucket/test_sitemap_1.xml`,
      ]
      const cursor = 'asdf-adsf-adsf-asdf'
      const more_work = false
      const notifyGoogle = true
      const data = {
        id,
        iteration,
        cursor,
        more_work,
        sitemapPaths,
        count,
      }

      const prev_failable = success(data)
      const result = get_next_command(id, prev_command, prev_failable)
      assertSuccess(result, [
        {
          next_command: 'sitemapindex',
          next_args: { sitemapPaths, notifyGoogle },
        },
      ])
    })
    it('sitemapindex to end', () => {
      const id = uuid.v4()
      const prev_command = 'sitemapindex'
      const sitemapPaths = [
        `foo_bucket/test_sitemap_0.xml`,
        `foo_bucket/test_sitemap_1.xml`,
      ]

      const data = {
        id,
        sitemapPaths,
      }

      const prev_failable = success(data)
      const result = get_next_command(id, prev_command, prev_failable)
      assertSuccess(result, [
        {
          next_command: 'end',
          next_args: {},
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
