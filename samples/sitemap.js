const example1 = `
  <?xml version="1.0" encoding="UTF-8"?>
  <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <url>
       <loc>http://imawebsite.com/plz/</loc>
       <lastmod>2018-05-01</lastmod>
       <changefreq>daily</changefreq>
       <priority>0.5</priority>
    </url>
  </urlset>`

const sitemapIndex =
  `<?xml version="1.0" encoding="UTF-8"?>
  <sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
     <sitemap>
        <loc>http://www.example.com/sitemap1.xml.gz</loc>
        <lastmod>2004-10-01T18:23:17+00:00</lastmod>
     </sitemap>
     <sitemap>
        <loc>http://www.example.com/sitemap2.xml.gz</loc>
        <lastmod>2005-01-01</lastmod>
     </sitemap>
  </sitemapindex>`

module.exports = {
  example1,
  sitemapIndex
}
