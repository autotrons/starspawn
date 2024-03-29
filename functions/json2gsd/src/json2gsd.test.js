const assert = require("assert")
const { assertSuccess, payload, isFailure } = require("@pheasantplucker/failables")
const { json2gsd, assemble, mergeMeta } = require("./json2gsd")
const uuid = require('uuid')
const id = uuid.v4()

const jobJson = {
  location: "Fort Lauderdale, FL, United States",
  title: "RN Per Diem Nurse",
  city: "Fort Lauderdale",
  state: "FL",
  zip: "33336",
  country: "United States",
  job_type: "Per Diem",
  posted_at: "2018-04-21",
  job_reference: "63_Apr47387",
  company: "HealthTrust Workforce Solutions",
  mobile_friendly_apply: "No",
  category: "Per Diem",
  html_jobs: "Yes",
  url:
    "https://click.appcast.io/track/oan6v1?cs=ae4&amp;exch=1a&amp;bid=TEz0xVerpiuhxLt0LS4mUA==",
  body:
    "HealthTrust Workforce Solutions offers Registered Nurses (RNs) job opportunities in leading healthcare facilities across the country. The specialties we staff include ICU, Critical Care, Med/Surg, Telemetry, ER, PACU, Labor &amp; Delivery, and more!&lt;p&gt; With regional and satellite recruitment offices nationwide, we work around the clock to provide the best support for our Per Diem Nurses. We offer flexible scheduling, meaning you get first preference on where and when to work, first call / last cancelled and one of the most competitive compensation packages in the market.&lt;p&gt; If you are a registered nurse (RN) and are interested in learning more about our careers, please fill out the form below and one of our skilled recruiters will contact you shortly.&lt;p&gt; &lt;strong&gt;Please note that certain requirements must be met in order to be eligible to work per diem with HealthTrust Workforce Solutions.&lt;/strong&gt; &lt;li&gt;Graduate from an accredited nursing school   &lt;li&gt;Minimum of one year acute care experience in a hospital setting   &lt;li&gt;Current State Nursing License   &lt;li&gt;All appropriate certifications for the position to which you are applying",
  cpa: 5.831,
  cpc: 0.24
}

const tmpl = {
  ignoreEmpty: false,
  path: ".",
  as: {
    title: "title",
    description: "body",
    identifier: {
      ignoreEmpty: false,
      path: ".",
      as: {
        type: "identifierType",
        name: "company",
        value: null
      }
    },
    datePosted: "posted_at",
    validThrough: null,
    employmentType: "category",
    hiringOrganization: {
      ignoreEmpty: false,
      as: {
        type: "hiringOrganizationType",
        name: "company",
        sameAs: "url",
        logo: null
      }
    },
    jobLocation: {
      ignoreEmpty: false,
      as: {
        type: "postalAddressType",
        streetAddress: null,
        addressLocality: "city",
        addressRegion: "state",
        postalCode: "zip",
        addressCountry: "country"
      }
    },
    baseSalary: {
      ignoreEmpty: false,
      as: {
        type: "baseSalaryType",
        currency: null,
        value: {
          ignoreEmpty: false,
          as: {
            type: "valueType",
            value: null,
            unitText: null
          }
        }
      }
    }
  }
}

describe("json2gsd.js", function() {
  describe("json2gsd()", function() {
    it("Should return success and a result of transformed data", async function() {
      const data = { jobJson, tmpl }
      const r1 = await json2gsd(id, data)
      if (isFailure(r1)) return r1
      const r1Result = payload(r1)
      assert(typeof r1Result === "object")
      assertSuccess(r1)
    })
  })
  describe("assemble()", function() {
    it("should add template and data", async function() {
      const data = { jobJson, tmpl }
      const r1 = mergeMeta(jobJson)
      if (isFailure) return r1 
      const r1Result = payload(r1)
      const r2 = await assemble(r1, tmpl)
      assert(typeof result === "object")
      assertSuccess(r2)
    })
  })
  describe("mergeMeta()", function() {
    it("should combine base request with type metadata", () => {
      const r1 = mergeMeta(jobJson)
      const r1Result = payload(r1)
      assert(typeof r1Result === "object")
      assertSuccess(r1)
    })
  })
})