"use strict";

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

const equal = require("assert").deepEqual;
const util = require("util");
const uuid = require(`uuid`);
const { chunk } = require("./chunk");
const exec = util.promisify(require("child_process").exec);

//var myBucket = storage.bucket("starspawn_xmlfeeds")

describe("chunk.js", () => {
  before(() => {});
  it("should chunk a file", _asyncToGenerator(function* () {
    const event = {
      data: {
        bucket: "datafeeds",
        name: "full_feed/test_feed.xml.gz",
        metageneration: 1,
        timeCreated: Date.now()
      },
      context: {
        eventType: "et"
      }
    };
    const result = yield chunk(event);
    equal(result.status, "complete");
  }));
  after(() => {});
});