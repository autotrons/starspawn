const equal = require('assert').deepEqual
const { assertSuccess, payload } = require('@pheasantplucker/failables')
const { exists, deleteFile } = require('@pheasantplucker/gc-cloudstorage')
const {
  sitemapindex,
  SITEMAP_BUCKET,
  buildSitemapIndex,
  formatUrl,
} = require('./sitemapindex')
const uuid = require('uuid')

describe(`sitemapindex.js`, () => {
  describe(`sitemapindex()`, () => {
    const id = uuid.v4()
    const bucket = `${SITEMAP_BUCKET}_test`
    const expectedPath = `${bucket}/sitemapindex.xml`
    const paths = [`bleep/blop/bloop.xml`]
    let path
    it(`should create sitemapindex file`, async () => {
      const result = await sitemapindex(id, {
        sitemapPaths: paths,
        target_bucket: `${SITEMAP_BUCKET}_test`,
      })
      assertSuccess(result, expectedPath)
      path = payload(result)
    })

    it(`should have written the sitemap index file`, async () => {
      const result = await exists(expectedPath)
      assertSuccess(result, true)
    })

    it(`should clean up junk file`, async () => {
      const result = await deleteFile(path)
      assertSuccess(result)
    })

    it(`should have deleted test file`, async () => {
      const result = await exists(expectedPath)
      assertSuccess(result, false)
    })

    it.skip(`should tell Google!`, async () => {
      assertSuccess(2)
    })
  })

  describe(`buildSitemapIndex()`, () => {
    const sitemaps = [
      'starspawn_jobs/sitemaps/test_sitemap_0.xml',
      'starspawn_jobs/sitemaps/test_sitemap_1.xml',
    ]
    let indexFilePath

    it(`should build the sitemap index file`, async () => {
      const result = await buildSitemapIndex(sitemaps, SITEMAP_BUCKET)
      assertSuccess(result, `${SITEMAP_BUCKET}/sitemapindex.xml`)
      indexFilePath = payload(result)
    })

    it(`should have uploaded the index file`, async () => {
      const result = await exists(indexFilePath)
      assertSuccess(result, true)
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
