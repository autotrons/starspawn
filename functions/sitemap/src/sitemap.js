const uuid = require("uuid")
const { failure, success } = require("@pheasantplucker/failables-node6")
const { map } = require("ramda")

async function sitemap(req, res) {
  const id = uuid.v4()
  console.log(`${id} starting`)
  const data = parse_req_data(req)
  console.log(`data:`, data)

  let counter = 0
  return res_ok(res, { id })
}

function res_ok(res, payload) {
  console.info(payload)
  res.status(200).send(success(payload))
  return success(payload)
}

function res_err(res, payload) {
  console.error(payload)
  res.status(500).send(failure(payload))
  return failure(payload)
}

function parse_req_data(r) {
  try {
    return JSON.parse(r.body.message.data)
  } catch (e) {
    return r.body.message.data
  }
}

function buildSitemap(data) {
  const urlBlocks = map(
    b =>
      `<url>
        <loc>${b.url}</loc>
        <lastmod>${b.lastModified}</lastmod>
        <changefreq>${b.changeFrequency}</changefreq>
        <priority>${b.priority}</priority>
      </url>`,
    data
  )
  console.log(`urlBlocks:`, urlBlocks)
  const defaultShit = `
    <?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      ${urlBlocks.join("\n")}
    </urlset>`
  return defaultShit
}

module.exports = {
  sitemap,
  buildSitemap
}
