const { assertSuccess, payload } = require('@pheasantplucker/failables')
const { exists, deleteFile } = require('@pheasantplucker/gc-cloudstorage')
const {
  sitemap,
  formatUrl,
  getJobs,
  paginateJobs,
  buildSitemapIndex,
  SITEMAP_BUCKET,
} = require('./sitemap')
const equal = require('assert')
const { example1 } = require('../../../samples/sitemap')
const MEGABYTE = Math.pow(2, 20)
const uuid = require('uuid')

describe('sitemap.js', function() {
  this.timeout(540 * 1000)

  describe(`sitemap()`, () => {
    const id = uuid.v4()
    const url = 'http://imawebsite.com/plz'
    const lastModified = '2018-05-01'
    const changeFrequency = 'daily'
    const priority = 0.5
    const expected = example1

    it.skip(`should build the sitemap`, async () => {
      const result = await sitemap(id)
      assertSuccess(result)
    })
  })

  describe(`buildSitemapIndex()`, () => {
    const sitemaps = ['starspawn_jobs/sitemaps/test_sitemap_0.xml',
    'starspawn_jobs/sitemaps/test_sitemap_1.xml']
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
      const count = 5
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
