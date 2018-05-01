# starspawn
Ingest all the things

# Builds
* Downloads https://console.cloud.google.com/gcr/builds?project=starspawn-201921&query=tags%20%3D%20%22download%22

# Job Feed
* from Appcast https://appcast.io/
* the feed https://exchangefeeds.s3.amazonaws.com/9d2dcb702d7d6b801f34227c04c8bb23/feed.xml.gz

# Links to tech documentation
GCP Nodejs
https://cloud.google.com/nodejs/docs/reference/libraries

# For SEO
google tag it up
https://developers.google.com/search/docs/data-types/job-posting

# Ideas:

* Incorporate Accessibility cleanly
* Offer the job feed as a service (better than downloading a giant XML file)

# Schemas
```
{
  "location": "Fort Lauderdale, FL, United States",
  "title": "RN Per Diem Nurse",
  "city": "Fort Lauderdale",
  "state": "FL",
  "zip": "33336",
  "country": "United States",
  "job_type": "",
  "posted_at": "2018-04-21",
  "job_reference": "63_Apr47387",
  "company": "HealthTrust Workforce Solutions",
  "mobile_friendly_apply": "No",
  "category": "Per Diem",
  "html_jobs": "Yes",
  "url": "https://click.appcast.io/track/oan6v1?cs=ae4&amp;exch=1a&amp;bid=TEz0xVerpiuhxLt0LS4mUA==",
  "body": "HealthTrust Workforce Solutions offers Registered Nurses (RNs) job opportunities in leading healthcare facilities across the country. The specialties we staff include ICU, Critical Care, Med/Surg, Telemetry, ER, PACU, Labor &amp; Delivery, and more!&lt;p&gt; With regional and satellite recruitment offices nationwide, we work around the clock to provide the best support for our Per Diem Nurses. We offer flexible scheduling, meaning you get first preference on where and when to work, first call / last cancelled and one of the most competitive compensation packages in the market.&lt;p&gt; If you are a registered nurse (RN) and are interested in learning more about our careers, please fill out the form below and one of our skilled recruiters will contact you shortly.&lt;p&gt; &lt;strong&gt;Please note that certain requirements must be met in order to be eligible to work per diem with HealthTrust Workforce Solutions.&lt;/strong&gt; &lt;li&gt;Graduate from an accredited nursing school   &lt;li&gt;Minimum of one year acute care experience in a hospital setting   &lt;li&gt;Current State Nursing License   &lt;li&gt;All appropriate certifications for the position to which you are applying",
  "cpa": 5.831,
  "cpc": 0.24
}
```

# Handy commands
`gcloud beta functions deploy template --trigger-http --source ./build`
