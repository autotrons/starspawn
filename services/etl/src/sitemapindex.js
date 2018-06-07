const { map } = require('ramda')
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
  const { sitemapPaths } = data
  const bucket = whichBucket(data)
  const r1 = await buildSitemapIndex(sitemapPaths, bucket)
  if (isFailure(r1)) return failure(payload(r1), id)
  // const indexPath = payload(r1)
  // const r2 = await tellGoogle() // does not take params, just tells them where it is at a fixed place
  // console.log(`payload(r2):`, payload(r2))
  // return r2
  return r1
}

async function buildSitemapIndex(sitemaps, target_bucket) {
  const sitemapBlocks = map(buildSitemapBlock, sitemaps)
  const indexFile = `
    <?xml version="1.0" encoding="UTF-8"?>
    <sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      ${sitemapBlocks.join('\n')}
    </sitemapindex>
  `
  const indexFilePath = `${target_bucket}/sitemapindex.xml`
  const r2 = await save(indexFilePath, indexFile)
  if (isFailure(r2)) return r2
  return success(indexFilePath)
}

function buildSitemapBlock(path) {
  const url = formatUrl(`${BASE_URL}/${path}`)
  return `
    <sitemap>
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
  SITEMAP_BUCKET,
}
