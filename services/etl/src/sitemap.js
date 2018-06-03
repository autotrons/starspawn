const uuid = require("uuid")
const {
  failure,
  success,
  payload,
  isFailure,
  meta
} = require("@pheasantplucker/failables")
const { map, values } = require("ramda")
const { createQueryObj, runQuery } = require("@pheasantplucker/gc-datastore")
const { save, createBucket } = require("@pheasantplucker/gc-cloudstorage")

/*  OUTSTANDING QUESTIONS
    - If we submit the sitemap xml directly to google, do we need to have the physical file? (cloudstorage? localfile?)
      - I think so...
    - How do we tell Google that we updated the sitemap?
      - http.Get('http://www.google.com/ping?sitemap=http://www.blowjobs.com/sitemapIndex.xml')
    - How do we manage individual jobs becoming invalid?
    - How do sitemaps work?
      - You tell google about your sitemap (or they go looking, but that will happen less frequently)
      - Tells Google about frequency of return (as suggestion only, no guarantees)
      -
    - How do we get crawlers/indexing to occur?
      - Source: https://support.google.com/webmasters/answer/6065812?hl=en
        - How do we get Google to (re)crawl a website? ->https://www.google.com/webmasters/tools/googlebot-fetch
      -  https://stackoverflow.com/questions/9466360/how-to-request-google-to-re-crawl-my-website
    - How does google handle us telling them about new sitemaps every ~3 hours?
      - Can we optimize this since we will be working with so many jobs?
    - What is the difference between `robots.txt` and the sitemap???


      RESOURCES:
      - https://blog.kissmetrics.com/get-google-to-index/


*/

/*  POTENTIAL PROCESS
  - CRON job triggers the download + sitemap updating? on an offset timeframe????
  - sitemap queries all jobs from datastore (those that are written within <loader>)
      - If you get them all, and recreate the sitemap each time, you don't have to worry about managing
      the jobs that may have overlap in the sitemap, and those that include stale links
  - iterate over them and build the sitemap and write it locally (replacing the old one)
  - tell google we have a new sitemap
*/

const SERVICE_NAME = `SITEMAP`
const SITEMAP_URL_COUNT = 100 // pass this in when calling sitemap()?
const SITEMAP_BUCKET = "starspawn_jobs/sitemaps"
const BASE_URL = `https://storage.cloud.google.com`

async function sitemap(id, data) {
  try {
    const { id, count, iteration, cursor, sitemapPaths, more_work = true } = data
    if (more_work) {
      return paginate(id, count, iteration, sitemapPaths, cursor)
    } else {
      const r2 = await buildSitemapIndex(sitemapPaths)
      if (isFailure(r2)) return failure(payload(r2), id)
      return success({more_work: false}, id)
    }

  } catch (e) {
    return failure(e.toString())
  }
}

async function buildSitemapIndex(sitemaps) {
  const sitemapBlocks = map(buildSitemapBlock, sitemaps)
  const indexFile = `
    <?xml version="1.0" encoding="UTF-8"?>
    <sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      ${sitemapBlocks.join("\n")}
    </sitemapindex>
  `
  const indexFilePath = `${SITEMAP_BUCKET}/sitemapindex.xml`
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

async function paginateJobs(count) {
  const r1 = await createQueryObj("jobs")
  if (isFailure(r1)) return r1
  let query = payload(r1)
  query = query.limit(count)
  let pageCursor
  let iterationCount = 0
  let sitemapPath
  let sitemapPaths = []
  while (true) {
    if (pageCursor) {
      query = query.start(pageCursor)
    }
    const r2 = await getJobs(query)
    if (isFailure(r2)) return r2
    const jobs = payload(r2)
    const metaData = meta(r2)
    pageCursor = extractCursor(metaData)
    let shouldContinue = moreDataLeft(metaData)
    if (!shouldContinue) break
    const sitemap = buildSitemap(jobs)
    sitemapPath = `${SITEMAP_BUCKET}/test_sitemap_${iterationCount}.xml`
    const r4 = await save(sitemapPath, sitemap)
    if (isFailure(r4)) return r4
    sitemapPaths.push(sitemapPath)
    iterationCount++
  }
  return success(sitemapPaths)
}

async function paginate(id, count, iteration = 0, sitemapPaths = [], cursor) {
  const r1 = await createQueryObj("jobs")
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
  const sitemapPath = `${SITEMAP_BUCKET}/test_sitemap_${iteration}.xml`

  const r3 = await save(sitemapPath, sitemap)
  if (isFailure(r3)) {
    console.error(`${id} ${SERVICE_NAME} save ${payload(r3)}`)
    // considering returning `next` body here too. That allows for retries.
    // Possibly have error on the meta or something.
    return failure(payload(r3), id)
  }
  sitemapPaths.push(sitemapPath)
  const next = {
    id,
    iteration: iteration + 1,
    cursor: nextCursor,
    more_work: shouldContinue,
    sitemapPaths,
    count
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
  if (moreResults === "MORE_RESULTS_AFTER_LIMIT") return true
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
  return `https://render-dot-starspawn-201921.appspot.com/${job}`
}

function extractFields(data) {
  const { posted_at, job_reference } = data
  return {
    lastMod: posted_at,
    loc: buildUrl(job_reference),
    changefreq: "daily",
    priority: 0.5 // 0.5 is the default value.
  }
}

function buildSitemap(jobs) {
  const urlBlocks = map(buildUrlBlock, jobs)
  return `
    <?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      ${urlBlocks.join("\n")}
    </urlset>`
}

function buildUrlBlock(job) {
  const { loc, lastMod, changefreq, priority } = job
  return `<url>
            <loc>${formatUrl(loc)}</loc>
            <lastmod>${lastMod}</lastmod>
            <changefreq>${changefreq}</changefreq>
            <priority>${priority}</priority>
          </url>`
}

const formatUrl = url => {
  const endsWithSlash = url.endsWith("/")
  if (!endsWithSlash) return `${url}/`
  return url
}

module.exports = {
  sitemap,
  buildSitemap,
  formatUrl,
  getJobs,
  paginateJobs,
  buildSitemapIndex,
  paginate,
  SITEMAP_BUCKET
}
