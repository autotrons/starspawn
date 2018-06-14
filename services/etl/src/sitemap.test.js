const { assertSuccess, payload, meta } = require('@pheasantplucker/failables')
const { exists } = require('@pheasantplucker/gc-cloudstorage')
const { createQueryObj } = require('@pheasantplucker/gc-datastore')
const {
  sitemap,
  formatUrl,
  paginate,
  getJobs,
  extractCursor,
  moreDataLeft,
} = require('./sitemap')
const equal = require('assert')
const uuid = require('uuid')

describe('sitemap.js', function() {
  this.timeout(540 * 1000)

  describe(`sitemap()`, () => {
    const id = uuid.v4()
    const count = 50
    const iteration = 0
    const sitemapPaths = []
    let resultPaths

    it(`should build the sitemap`, async () => {
      const data = { id, count, iteration, sitemapPaths }
      const result = await sitemap(id, data)
      assertSuccess(result)
      resultPaths = payload(result).sitemapPaths
    })

    it(`should have written the sitemap file`, async () => {
      const r1 = await exists(resultPaths[0])
      assertSuccess(r1, true)
    })
  })

  describe(`paginate()`, () => {
    const id = uuid.v4()
    const count = 50
    const iteration = 0
    let paths = []
    let p1
    it(`should do stuff`, async () => {
      const result = await paginate(id, count, iteration, [])
      assertSuccess(result)
      p1 = payload(result)
      equal(p1.more_work, true)
      equal(p1.count, count)
      equal(p1.id, id)
      equal(p1.sitemapPaths.length, p1.iteration)
      const {
        id: id2,
        count: count2,
        iteration: iteration2,
        sitemapPaths: sitemapPaths2,
      } = payload(result)
      const r2 = await paginate(id2, count2, iteration2, sitemapPaths2)
      assertSuccess(r2)
      paths = payload(r2).sitemapPaths
    })

    it(`should have written that file bruh`, async () => {
      const r1 = await exists(paths[0])
      assertSuccess(r1, true)
      const r2 = await exists(paths[1])
      assertSuccess(r2, true)
    })
  })

  describe(`formatUrl()`, () => {
    it(`should thing the do slash trailing`, () => {
      const url = 'http://plzslashtrail.me/ok'
      const result = formatUrl(url)
      equal(result, `${url}/`)
    })

    it(`should not append another slash`, () => {
      const url = 'http://plzslashtrail.me/ok/'
      const result = formatUrl(url)
      equal(result, url)
    })
  })

  describe.skip(`UTILITY:: count datastore rows`, () => {
    it(`should count rows`, async () => {
      let counter = 0
      let cursor

      while (true) {
        const r1 = await createQueryObj('job')
        assertSuccess(r1)
        let query = payload(r1).limit(10000)
        if (cursor) {
          query = query.start(cursor)
        }
        const result = await getJobs(query)
        const data = payload(result)
        const metaData = meta(result)
        counter += data.length
        cursor = extractCursor(metaData)
        const more_work = moreDataLeft(metaData)
        console.log(`counter:`, counter)
        if (!more_work) break
      }
    })
  })
})
