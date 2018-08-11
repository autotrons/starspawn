const { assertSuccess, payload } = require('@pheasantplucker/failables')
const equal = require('assert').deepEqual
const assert = require('assert')
const { doesFileExist } = require('./fs-failable')

const {
  parse,
  cleanHtmlBody,
  cleanJobBody,
  appcast_datastore_job,
} = require('./parse')
const parsedJsonOutput = require('../samples/pre_parse.json')
const fileName = 'test_feed.xml'
const testFileRelative = `./samples/${fileName}`
const dirtyHtml = `With locations across 47 states, we are certain to have a rehab job for you.</p></p><p style="MARGIN-BOTTOM\: 0px; MARGIN-TOP\: 0px"><span style="BACKGROUND\: white"><p></p></span><o></o></p>`
const cleanHtml = `With locations across 47 states, we are certain to have a rehab job for you.<p></p><p></p><p><p></p></p>`

describe('parse.js', function() {
  describe(`parse()`, () => {
    it('should convert the XML from the file into JSON', async () => {
      const result = await parse(testFileRelative)
      assertSuccess(result)
      const p = payload(result)
      assert(typeof p.jobFiles[0] === 'string', true)
    })

    it(`should return google structured data`, async () => {
      const result = await parse(testFileRelative)
      assertSuccess(result)
    })

    it(`should write a job file`, async () => {
      const result = await parse(testFileRelative)
      assertSuccess(result)
      const files = payload(result).jobFiles
      const fileWritten = await doesFileExist(files[0])
      assertSuccess(fileWritten, true)
    })

    it(`should write a city file`, async () => {
      const result = await parse(testFileRelative)
      assertSuccess(result)
      const files = payload(result).cityFiles
      const keys = Object.keys(files)
      keys.forEach(async k => {
        const fileWritten = await doesFileExist(files[k])
        assertSuccess(fileWritten, true)
      })
    })
  })

  describe(`cleanJobBody()`, () => {
    it(`should return the job bodies without non-AMP HTML`, () => {
      const dirtyJob = {
        body:
          '<li>Current State Nursing License <li>All appropriate certifications for the position to which you are applying<o></o>',
      }
      const cleanFirstJob = `<li>Current State Nursing License </li><li>All appropriate certifications for the position to which you are applying</li>`

      const r1 = cleanJobBody(dirtyJob)
      assertSuccess(r1)
      const cleanJobs = payload(r1)

      equal(cleanJobs.body, cleanFirstJob)
    })
  })

  describe(`cleanHtmlBody()`, () => {
    it(`should remove most HTML tags from text`, () => {
      const result = cleanHtmlBody(dirtyHtml)
      assertSuccess(result)
      const returnedHtml = payload(result)
      equal(returnedHtml, cleanHtml)
    })
  })
  describe(`appcast_datastore_job()`, () => {
    it(`create a job with datastore schema`, async () => {
      const transformed_job = appcast_datastore_job(parsedJsonOutput)
      const data = transformed_job
      equal(typeof data.body, 'string')
      equal(data.body.length > 100, true)
      equal(typeof data.gsd, 'string')
      equal(data.gsd.length > 100, true)
    })
  })
})
