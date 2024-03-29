const uuid = require('uuid')
const equal = require('assert').deepEqual
const { assertSuccess, payload } = require('@pheasantplucker/failables')
const { exists, deleteFile } = require('@pheasantplucker/gc-cloudstorage')

const {
  sitemapindex,
  SITEMAP_BUCKET,
  buildSitemapIndex,
  formatUrl,
} = require('./sitemapindex')
const BUCKET = `${SITEMAP_BUCKET}/test`

describe(`sitemapindex.js`, () => {
  describe(`sitemapindex()`, () => {
    const id = uuid.v4()
    const expectedPath = `${BUCKET}/sitemapindex.xml`
    const paths = [`bloop.xml`]
    let path
    it(`should create sitemapindex file`, async () => {
      const result = await sitemapindex(id, {
        sitemapPaths: paths,
        target_bucket: `${BUCKET}`,
        notifyGoogle: false,
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
  })

  describe(`buildSitemapIndex()`, () => {
    const sitemaps = [`test_sitemap_0.xml`, `test_sitemap_1.xml`]
    let indexFilePath

    it(`should build the sitemap index file`, async () => {
      const result = await buildSitemapIndex(BUCKET, sitemaps)
      assertSuccess(result, `${BUCKET}/sitemapindex.xml`)
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
