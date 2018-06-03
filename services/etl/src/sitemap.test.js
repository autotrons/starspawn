const { assertSuccess, payload } = require('@pheasantplucker/failables')
const { exists, deleteFile } = require('@pheasantplucker/gc-cloudstorage')
const {
  sitemap,
  formatUrl,
  getJobs,
  paginateJobs,
  buildSitemapIndex,
  SITEMAP_BUCKET,
  paginate,
} = require('./sitemap')
const equal = require('assert')
const { example1 } = require('../../../samples/sitemap')
const MEGABYTE = Math.pow(2, 20)
const uuid = require('uuid')

describe('sitemap.js', function() {
  this.timeout(540 * 1000)

  describe(`sitemap()`, () => {
    const id = uuid.v4()
    const count = 500
    const iteration = 0
    const sitemapPaths = []

    it.only(`should build the sitemap`, async () => {
      const data = { id, count, iteration, sitemapPaths}
      const result = await sitemap(id, data)
      console.log(`payload(result):`, payload(result))
      assertSuccess(result)
    })
  })

  describe(`buildSitemapIndex()`, () => {
    const sitemaps = [
      'starspawn_jobs/sitemaps/test_sitemap_0.xml',
      'starspawn_jobs/sitemaps/test_sitemap_1.xml',
    ]
    let indexFilePath

    it(`should build the sitemap index file`, async () => {
      const result = await buildSitemapIndex(sitemaps)
      assertSuccess(result, `${SITEMAP_BUCKET}/sitemapindex.xml`)
      indexFilePath = payload(result)
    })

    it(`should have uploaded the index file`, async () => {
      const result = await exists(indexFilePath)
      assertSuccess(result, true)
    })
  })

  describe(`paginateJobs()`, () => {
    let filePaths = []
    it(`should get the data`, async () => {
      const count = 100
      const result = await paginateJobs(count)
      assertSuccess(result)
      filePaths = payload(result)
    })

    it(`should write file to cloudstorage`, async () => {
      const f = filePaths[0]
      const result = await exists(f)
      assertSuccess(result, true)
    })

    // TODO: This should be done iteratively but for some reason isn't working??
    // it(`should clean up test files`, async () => {
    //   const f = filePaths[0]
    //   const result = await deleteFile(f)
    //   assertSuccess(result)
    // })
  })

  describe.skip(`paginate()`, () => {
    const id = uuid.v4()
    const count = 500
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
      const { id: id2, count: count2, iteration: iteration2, sitemapPaths: sitemapPaths2 } = payload(result)
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
})
