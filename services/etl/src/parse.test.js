const {
  assertSuccess,
  payload,
  isFailure,
} = require('@pheasantplucker/failables')
const equal = require('assert').deepEqual
const path = require('path')
const uuid = require('uuid')
const assert = require('assert')
const {
  createBucket,
  bucketExists,
  uploadFile,
  exists,
} = require('@pheasantplucker/gc-cloudstorage')

const {
  parse,
  parseXmlToJson,
  cleanHtmlBody,
  cleanAllJobBodies,
} = require('./parse')

const bucket = 'starspawn_tests'
const fileName = 'chunk_output_100.xml'
const testFileCloud = `${bucket}/${fileName}`
const testFileRelative = `../../../samples/${fileName}`
const testFile = path.join(__dirname, testFileRelative)
const xml = `<?xml version="1.0" encoding="UTF-8"?>
<job>
  <location>Fort Lauderdale, FL, United States</location>
</job>`

const json = {
  job: {
    location: 'Fort Lauderdale, FL, United States',
  },
}

const dirtyHtml = `With locations across 47 states, we are certain to have a rehab job for you.</p></p><p style="MARGIN-BOTTOM\: 0px; MARGIN-TOP\: 0px"><span style="BACKGROUND\: white"><p></p></span><o></o></p>`

const cleanHtml = `With locations across 47 states, we are certain to have a rehab job for you.<p></p><p></p><p><p></p></p>`

const _testsetup = async () => {
  const r1 = await bucketExists(bucket)
  if (isFailure(r1)) return r1
  const thisBucketExists = payload(r1)
  if (!thisBucketExists) await createBucket(bucket)

  const r2 = await exists(testFileCloud)
  if (isFailure(r2)) return r2
  const testFileExists = payload(r2)
  if (!testFileExists) {
    await uploadFile(bucket, testFile)
  }
}

const thisId = uuid.v4()

describe.only('parse.js', function() {
  this.timeout(540 * 1000)

  before(() => {
    _testsetup()
  })

  describe(`parse()`, () => {
    it('should convert the XML from the file into JSON', async () => {
      const data = { filePath: testFileCloud }
      const result = await parse(thisId, data)
      assertSuccess(result)
      const parseRet = payload(result)
      assert(parseRet.jsonJobs)
      assert(parseRet.jsonJobs.root.job[0].city)
    })

    it(`should return google structured data`, async () => {
      const data = { filePath: testFileCloud }
      const result = await parse(thisId, data)
      assertSuccess(result)
      const parseRet = payload(result)
      assert(parseRet.jsonJobs.root.job[0].gsd)
    })

    it(`should write a file`, async () => {})
  })

  describe(`parseXmlToJson()`, () => {
    it(`should take XML and return a JSON obj`, () => {
      const result = parseXmlToJson(xml)
      assertSuccess(result)
      const newJson = payload(result)
      equal(newJson, json)
    })
  })

  describe(`cleanAllJobBodies()`, () => {
    it(`should return the job bodies without non-AMP HTML`, async () => {
      const dirtyJobs = {
        root: {
          job: [
            {
              body:
                '<li>Current State Nursing License <li>All appropriate certifications for the position to which you are applying<o></o>',
            },
            {
              body:
                '<p> <strong>Please note that certain requirements must be met in order to be eligible to work per diem with HealthTrust Workforce Solutions.</strong> <li>Graduate from an accredited nursing school<o></o>',
            },
          ],
        },
      }

      const cleanFirstJob = `<li>Current State Nursing License </li><li>All appropriate certifications for the position to which you are applying</li>`

      const r1 = await cleanAllJobBodies(dirtyJobs)
      assertSuccess(r1)
      const cleanJobs = payload(r1)

      equal(cleanJobs.root.job[0].body, cleanFirstJob)
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
})
