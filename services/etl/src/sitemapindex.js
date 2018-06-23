const { map, curry } = require('ramda')
const { save } = require('@pheasantplucker/gc-cloudstorage')
const { get } = require('@pheasantplucker/http')
const {
  failure,
  success,
  payload,
  isFailure,
} = require('@pheasantplucker/failables')

const SITEMAP_BUCKET = 'starspawn_jobs/sitemaps'
const BASE_URL = `https://joblog.app`

async function sitemapindex(id, data) {
  const { sitemapPaths, notifyGoogle } = data
  const bucket = whichBucket(data)
  const r1 = await buildSitemapIndex(bucket, sitemapPaths)
  if (isFailure(r1)) return failure(payload(r1), id)
  console.log(`notifyGoogle:`, notifyGoogle)
  if (notifyGoogle == 'cheese') {
    const r2 = await tellGoogle()
    console.info(`${id} sitemapindex failed submitting to Google: ${payload(r2)}`)
  }
  return r1
}

async function buildSitemapIndex(target_bucket, sitemaps) {
  const buildBlocks = curry(buildSitemapBlock)
  const sitemapBlocks = map(buildBlocks(target_bucket), sitemaps)
  const indexFile = `<?xml version="1.0" encoding="UTF-8"?>
    <sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      ${sitemapBlocks.join('\n')}
    </sitemapindex>
  `
  const indexFilePath = `${target_bucket}/sitemapindex.xml`
  const options = {}
  const r2 = await save(indexFilePath, indexFile, options)
  if (isFailure(r2)) return r2
  return success(indexFilePath)
}

function buildSitemapBlock(bucket, fileName) {
  const url = formatUrl(`${BASE_URL}/${fileName}`)
  return `<sitemap>
      <loc>${url}</loc>
      <lastmod>${new Date().toISOString()}</lastmod>
    </sitemap>
  `
}

async function tellGoogle() {
  const fullUrl = `${BASE_URL}/${sitemapindex.xml}`
  const encodedUrl = encodeURIComponent(fullUrl)
  return get(`http://www.google.com/ping?sitemap=${encodedUrl}`)
}

function whichBucket(data) {
  if (data.target_bucket) return data.target_bucket
  return SITEMAP_BUCKET
}

const formatUrl = url => {
  const endsWithSlash = url.endsWith('/')
  if (!endsWithSlash) return `${url}/`
  return url
}

module.exports = {
  sitemapindex,
  buildSitemapIndex,
  formatUrl,
  SITEMAP_BUCKET,
}
