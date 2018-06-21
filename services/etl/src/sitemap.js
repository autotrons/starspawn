const {
  failure,
  success,
  payload,
  isFailure,
  meta,
} = require('@pheasantplucker/failables')
const { map, values } = require('ramda')
const { createQueryObj, runQuery } = require('@pheasantplucker/gc-datastore')
const { save } = require('@pheasantplucker/gc-cloudstorage')

const SERVICE_NAME = `SITEMAP`
const SITEMAP_URL_COUNT = 100 // pass this in when calling sitemap()?
const SITEMAP_BUCKET = 'starspawn_jobs/sitemaps'
const BASE_URL = `https://joblog.app`

async function sitemap(id, data) {
  try {
    const {
      id,
      count = SITEMAP_URL_COUNT,
      iteration,
      cursor,
      sitemapPaths,
      destination = SITEMAP_BUCKET,
    } = data
    return paginate(id, count, iteration, sitemapPaths, destination, cursor)
  } catch (e) {
    return failure(e.toString())
  }
}

async function paginate(
  id,
  count,
  iteration = 0,
  sitemapPaths = [],
  destination,
  cursor
) {
  const r1 = await createQueryObj('job')
  if (isFailure(r1)) {
    console.error(`${id} ${SERVICE_NAME} createQueryObj ${payload(r1)}`)
    return failure(payload(r1), id)
  }
  let query = payload(r1)
  query = query.limit(count)

  if (cursor) {
    query = query.start(cursor)
  }
  const r2 = await getJobs(query)
  if (isFailure(r2)) {
    console.error(`${id} ${SERVICE_NAME} getJobs ${payload(r2)}`)
    return failure(payload(r2), id)
  }
  const metaData = meta(r2)
  const nextCursor = extractCursor(metaData)
  const shouldContinue = moreDataLeft(metaData)
  const jobs = payload(r2)
  const sitemap = buildSitemap(jobs)
  const fileName = `sitemap_${iteration}.xml`
  const sitemapPath = `${destination}/${fileName}`

  //const options = { predefinedAcl: 'publicRead' }
  const options = {}
  const r3 = await save(sitemapPath, sitemap, options)
  if (isFailure(r3)) {
    console.error(`${id} ${SERVICE_NAME} save ${payload(r3)}`)
    return failure(payload(r3), id)
  }
  sitemapPaths.push(fileName)
  const next = {
    id,
    iteration: iteration + 1,
    cursor: nextCursor,
    more_work: shouldContinue,
    sitemapPaths,
    count,
  }
  return success(next, id)
}

function extractCursor(data) {
  const { queryEndDetails } = data
  const { endCursor } = queryEndDetails
  return endCursor
}

function moreDataLeft(data) {
  const { queryEndDetails } = data
  const { moreResults } = queryEndDetails
  if (moreResults === 'MORE_RESULTS_AFTER_LIMIT') return true
  return false
}

async function getJobs(query) {
  const runResult = await runQuery(query)
  if (isFailure(runResult)) return runResult
  const jobData = payload(runResult)
  const metaData = meta(runResult)
  const formattedData = map(extractFields, jobData)
  const jobObjs = values(formattedData)
  return success(jobObjs, metaData)
}

function buildUrl(job) {
  return `${BASE_URL}/${job}`
}

function extractFields(data) {
  const { posted_at, id } = data
  return {
    lastMod: posted_at,
    loc: buildUrl(id),
    changefreq: 'daily',
    priority: 0.5, // 0.5 is the default value.
  }
}

function buildSitemap(jobs) {
  const urlBlocks = map(buildUrlBlock, jobs)
  return `<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      ${urlBlocks.join('\n')}
    </urlset>`
}

function buildUrlBlock(job) {
  const { loc, lastMod, changefreq, priority } = job
  return `<url>
            <loc>${formatUrl(loc)}</loc>
            <lastmod>${new Date(lastMod).toISOString()}</lastmod>
            <changefreq>${changefreq}</changefreq>
            <priority>${priority}</priority>
          </url>`
}

const formatUrl = url => {
  const endsWithSlash = url.endsWith('/')
  if (!endsWithSlash) return `${url}/`
  return url
}

module.exports = {
  sitemap,
  buildSitemap,
  formatUrl,
  getJobs,
  paginate,
  SITEMAP_BUCKET,
  extractCursor,
  moreDataLeft,
}
