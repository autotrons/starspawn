const get = require('simple-get')
const xmlFlow = require('xml-flow')

let count = 0
let matchFilter = 0

function main() {
  get('https://joblog.app/sitemapindex.xml', (error, httpStream) => {
    if (error) throw error
    if (httpStream.statusCode != 200) throw new Error(`Unexpected status code while downloading sitemap index: ${httpStream.statusCode}`)

    xmlStream = xmlFlow(httpStream)
    xmlStream.on('tag:sitemap', processSitemap)
  })
}

function processSitemap(sitemap) {
  get(sitemap.loc, (error, httpStream) => {
    if (error) throw error
    if (httpStream.statusCode != 200) throw new Error(`Unexpected status code while downloading sitemap: ${httpStream.statusCode}`)

    xmlStream = xmlFlow(httpStream)
    xmlStream.on('tag:url', processJobUrl)
    xmlStream.on('end', updateOutput)
  })
}

const processJobUrl = function (jobUrl) {
  count++
  if (jobUrl.loc.indexOf('-') === -1) matchFilter++

  if (count % 10000 === 0) updateOutput()
}

function updateOutput() {
  process.stdout.clearLine()
  process.stdout.cursorTo(0)
  process.stdout.write(`${count} urls processed, ${matchFilter} match specified filter`)
}

main()