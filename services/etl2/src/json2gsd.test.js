const assert = require('assert')
const { assertSuccess, payload } = require('@pheasantplucker/failables')
const { json2gsd, assemble, mergeMeta } = require('./json2gsd')
const gsdTemplate = require('../../../samples/gsd.json')

const jobJson = {
  location: 'Fort Lauderdale, FL, United States',
  title: 'RN Per Diem Nurse',
  city: 'Fort Lauderdale',
  state: 'FL',
  zip: '33336',
  country: 'United States',
  job_type: 'Per Diem',
  posted_at: '2018-04-21',
  job_reference: '63_Apr47387',
  company: 'HealthTrust Workforce Solutions',
  mobile_friendly_apply: 'No',
  category: 'Per Diem',
  html_jobs: 'Yes',
  url:
    'https://click.appcast.io/track/oan6v1?cs=ae4&amp;exch=1a&amp;bid=TEz0xVerpiuhxLt0LS4mUA==',
  body:
    'HealthTrust Workforce Solutions &lt;li&gt;Minimum of one year acute care experience in a hospital setting   &lt;li&gt;Current State Nursing License   &lt;li&gt;All appropriate certifications for the position to which you are applying',
  cpa: 5.831,
  cpc: 0.24,
}

const tmpl = require('../templates/appcast.json')

function compareGsdTemplate(input) {
  const arr1 = Object.keys(gsdTemplate)
  const arr2 = Object.keys(input)

  if (arr1.length !== arr2.length) return false
  for (var i = arr1.length; i--; ) {
    if (arr1[i] !== arr2[i]) return false
  }

  return true
}

describe('json2gsd.js', function() {
  describe('json2gsd()', function() {
    it('Should return success and compare result against GSD Template keys', function() {
      const r1 = json2gsd(jobJson)
      assertSuccess(r1)
      const gsdPayload = payload(r1)
      const gsd = gsdPayload.rendered
      const checkKeysAgainstTemplate = compareGsdTemplate(gsd)
      assert(checkKeysAgainstTemplate)
    })
  })
  describe('assemble()', function() {
    it('should add template and data', function() {
      const r1 = mergeMeta(jobJson)
      assertSuccess(r1)
      const r2 = assemble(tmpl, jobJson)
      assert(typeof payload(r2) === 'object')
      assertSuccess(r2)
    })
  })
  describe('mergeMeta()', function() {
    it('should combine base request with type metadata', () => {
      const r1 = mergeMeta(jobJson)
      const r1Result = payload(r1)
      assert(typeof r1Result === 'object')
      assertSuccess(r1)
    })
  })
})
