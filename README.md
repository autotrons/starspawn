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
```bash
gcloud beta functions deploy template --trigger-http --source ./build
rename 's/chunk/unzip/' **/*(D.)
sed -i '' 's/chunk/unzip/g' **/*(D.)
```

# Cloud Functions Emulator

Google offers a Cloud Functions emulator to test your cloud functions locally before pushing them up to GCE
_https://cloud.google.com/functions/docs/emulator_

To install cloud functions emulator:
`npm install -g @google-cloud/functions-emulator`

to start cloud functions emulator:
`functions-emulator start`

to deploy a function:
navigate to your target directory:
`cd /Volumes/DiskName/code/starspawn/functions/render`

then run:

 `functions-emulator deploy render --trigger-http --local-path=/Volumes/DiskName/code/starspawn/functions/render`

It will return a table with an endpoint like:
`http://localhost:8010/starspawn/us-central1/render`

Once your function is running you can execute:
`functions-emulator logs read`
OR
`functions-emulator status`, collect the `.log` filename and `tail -f` (i.e. `~/.nvm/versions/node/v7.7.1/lib/node_modules/@google-cloud/functions-emulator/logs/cloud-functions-emulator.log`
# Cloud Function Links
Issue Tracker
https://issuetracker.google.com/issues?q=componentid:187195%20status:open

# Structured Data
[DOCS] https://developers.google.com/search/docs/data-types/job-posting

Google uses structured data on your page to generate an appealing box populated with the data you're looking for
(Think articles, recipes, etc...) They do this via a set of standardized JSON-LD schemas (available at http://schema.org/)
A sample of a JobPosting schema follows, and renders successfuly in Google's Structured Data Testing Tool:
https://search.google.com/structured-data/testing-tool

If we omit values in some of the fields below (i.e. salary, street address) we _will_ get warnings in the formatting, 
but not errors. Unclear if warnings affect SEO/scoring.

```
<script type="application/ld+json"> {
  "@context" : "http://schema.org/",
  "@type" : "JobPosting",
  "title" : "Fitter and Turner",
  "description" : "<p>Widget assembly role for pressing wheel assemblies.</p>
    <p><strong>Educational Requirements:</strong> Completed level 2 ISTA
    Machinist Apprenticeship.</p>
    <p><strong>Required Experience:</strong> At
    least 3 years in a machinist role.</p>",
  "identifier": {
    "@type": "PropertyValue",
    "name": "MagsRUs Wheel Company",
    "value": "1234567"
  },
  "datePosted" : "2017-01-18",
  "validThrough" : "2017-03-18T00:00",
  "employmentType" : "CONTRACTOR",
  "hiringOrganization" : {
    "@type" : "Organization",
    "name" : "MagsRUs Wheel Company",
    "sameAs" : "http://www.magsruswheelcompany.com",
    "logo" : "http://www.example.com/images/logo.png"
  },
  "jobLocation" : {
    "@type" : "Place",
    "address" : {
      "@type" : "PostalAddress",
      "streetAddress" : "555 Clancy St",
      "addressLocality" : "Detroit",
      "addressRegion" : "MI",
      "postalCode" : "48201",
      "addressCountry": "US"
    }
  },
  "baseSalary": {
    "@type": "MonetaryAmount",
    "currency": "USD",
    "value": {
      "@type": "QuantitativeValue",
      "value": 40.00,
      "unitText": "HOUR"
    }
  }
}
</script>```