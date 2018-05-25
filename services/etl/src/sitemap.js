const uuid = require("uuid")
const { failure, success } = require("@pheasantplucker/failables-node6")
const { map } = require("ramda")

async function sitemap(id, data) {
  try {
    const xmlString = buildSitemap(data)
    return success(xmlString)
  } catch (e) {
    return failure(e.toString())
  }
}

function buildSitemap(job) {
  const { url, lastModified, changeFrequency, priority } = job
  const urlBlock = `
      <url>
        <loc>${formatUrl(url)}</loc>
        <lastmod>${lastModified}</lastmod>
        <changefreq>${changeFrequency}</changefreq>
        <priority>${priority}</priority>
      </url>`
  const defaultShit = `
    <?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      ${urlBlock}
    </urlset>`
  return defaultShit
}

const formatUrl = url => {
  const endsWithSlash = url.endsWith()
  if (!endsWithSlash) return `${url}/`
  return url
}

module.exports = {
  sitemap,
  buildSitemap,
  formatUrl
}
