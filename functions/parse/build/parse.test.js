'use strict';

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

const {
  assertSuccess,
  payload,
  isFailure
} = require('@pheasantplucker/failables-node6');
const { parse, parseXmlToJson } = require('./parse');
const equal = require('assert').deepEqual;
const path = require('path');
const fs = require('fs');

const {
  createBucket,
  bucketExists,
  //   noUpperCase,
  uploadFile,
  //   getBucket,
  //   newFile,
  exists,
  save,
  getFile
  //   deleteFile,
  // createWriteStream,
  //   deleteBucket
} = require('@pheasantplucker/gc-cloudstorage');

const bucket = 'starspawn_tests';
const fileName = 'chunk_output_100.xml';
const testFileCloud = `${bucket}/${fileName}`;
const testFileRelative = `../../../samples/${fileName}`;
const testFile = path.join(__dirname, testFileRelative);
const xml = `<?xml version="1.0" encoding="UTF-8"?>
<job>
  <location>Fort Lauderdale, FL, United States</location>
</job>`;

const json = {
  job: {
    location: 'Fort Lauderdale, FL, United States'
  }
};

const _testsetup = (() => {
  var _ref = _asyncToGenerator(function* () {
    const r1 = yield bucketExists(bucket);
    if (isFailure(r1)) return r1;
    const thisBucketExists = payload(r1);
    if (!thisBucketExists) yield createBucket(bucket);

    const r2 = yield exists(testFileCloud);
    if (isFailure(r2)) return r2;
    const testFileExists = payload(r2);
    if (!testFileExists) {
      const upload = yield uploadFile(bucket, testFile);
    }
  });

  return function _testsetup() {
    return _ref.apply(this, arguments);
  };
})();

describe('parse.js', function () {
  this.timeout(540 * 1000);

  before(() => {
    _testsetup();
  });

  it('should pull a batch of tags between two points in the file', _asyncToGenerator(function* () {
    const input = { fileName: testFileCloud };
    const { req, res } = make_req_res(input);
    const result = yield parse(req, res);
    assertSuccess(result);
  }));

  describe(`parseXmlToJson()`, () => {
    it(`should take XML and return a JSON obj`, () => {
      const result = parseXmlToJson(xml);
      assertSuccess(result);
      const newJson = payload(result);
      equal(newJson, json);
    });
  });
});

function make_req_res(attributes) {
  const req = {
    body: {
      attributes
    }
  };
  const res = {
    status: function () {
      return {
        send: () => {}
      };
    },
    send: () => {}
  };
  return {
    req,
    res
  };
}