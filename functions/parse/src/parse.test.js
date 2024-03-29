const {
  assertSuccess,
  payload,
  isFailure,
} = require('@pheasantplucker/failables-node6')
const { parse, parseXmlToJson } = require('./parse')
const equal = require('assert').deepEqual
const path = require('path')
const fs = require('fs')

const {
  createBucket,
  bucketExists,
  //   noUpperCase,
  uploadFile,
  //   getBucket,
  //   newFile,
  exists,
  save,
  getFile,
  //   deleteFile,
  // createWriteStream,
  //   deleteBucket
} = require('@pheasantplucker/gc-cloudstorage')

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

const _testsetup = async () => {
  const r1 = await bucketExists(bucket)
  if (isFailure(r1)) return r1
  const thisBucketExists = payload(r1)
  if (!thisBucketExists) await createBucket(bucket)

  const r2 = await exists(testFileCloud)
  if (isFailure(r2)) return r2
  const testFileExists = payload(r2)
  if (!testFileExists) {
    const upload = await uploadFile(bucket, testFile)
  }
}

describe('parse.js', function() {
  this.timeout(540 * 1000)

  before(() => {
    _testsetup()
  })

  it('should pull a batch of tags between two points in the file', async () => {
    const input = { fileName: testFileCloud }
    const { req, res } = make_req_res(input)
    const result = await parse(req, res)
    assertSuccess(result)
  })

  describe(`parseXmlToJson()`, () => {
    it(`should take XML and return a JSON obj`, () => {
      const result = parseXmlToJson(xml)
      assertSuccess(result)
      const newJson = payload(result)
      equal(newJson, json)
    })
  })
})

function make_req_res(attributes) {
  const req = {
    body: {
      attributes,
    },
  }
  const res = {
    status: function() {
      return {
        send: () => {},
      }
    },
    send: () => {},
  }
  return {
    req,
    res,
  }
}
