"use strict";

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

const equal = require("assert").deepEqual;
const util = require("util");
const rp = require("request-promise-native");
const uuid = require(`uuid`);
const { download } = require("./index");
const exec = util.promisify(require("child_process").exec);
var storage = require("@google-cloud/storage")();

var myBucket = storage.bucket("starspawn_xmlfeeds");

describe("download.js", () => {
  before(() => {});
  it("should download a file", _asyncToGenerator(function* () {
    const name = uuid.v4();
    const req = {
      body: {
        url: "https://storage.googleapis.com/starspawn_tests/feed.xml.gz"
      }
    };
    const res = {
      send: function () {}
    };
    download(req, res);
    const result = yield rp("https://google.com");
  }));
  after(() => {});
});