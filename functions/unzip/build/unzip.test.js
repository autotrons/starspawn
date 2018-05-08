"use strict";

let exists = (() => {
  var _ref = _asyncToGenerator(function* (bucket, filename) {
    const result = yield storage.bucket(bucket).file(filename).exists();
    return success(result[0]);
  });

  return function exists(_x, _x2) {
    return _ref.apply(this, arguments);
  };
})();

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

const uuid = require(`uuid`);
const {
  assertSuccess,
  isFailure,
  success
} = require("@pheasantplucker/failables-node6");
const { unzip } = require("./unzip");
const storage = require("@google-cloud/storage")();

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

describe("unzip.js", function () {
  this.timeout(540 * 1000);
  it("should unzip a file", _asyncToGenerator(function* () {
    const req_data = {
      source_bucket: "datafeeds",
      source_filename: "full_feed/feed_100.xml.gz",
      target_bucket: "datafeeds",
      target_filename: `unziped/${uuid.v4()}.xml`
    };
    const { req, res } = make_req_res(req_data);

    // const result = await unzip(req, res)
    // if (isFailure(result)) console.log(result)
    // assertSuccess(result)
    // const r2 = await exists(req_data.target_bucket, req_data.target_filename)
    // assertSuccess(r2, true)
  }));
});