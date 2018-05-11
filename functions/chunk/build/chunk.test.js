"use strict";

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

const equal = require("assert").deepEqual;
const { assertSuccess } = require("@pheasantplucker/failables-node6");
const { chunk, find_file_offsets, split_at } = require("./chunk");
const MEGABYTE = Math.pow(2, 20);
const fs = require("fs");

describe("chunk.js", function () {
  this.timeout(540 * 1000);
  it("split_at should return two strings split at index", _asyncToGenerator(function* () {
    const text = "<job></job>";
    const result = split_at(text, 5);
    equal(result, ["<job>", "</job>"]);
  }));
  it("should pull a batch of tags between two points in the file", _asyncToGenerator(function* () {
    const start_text = "<job>";
    const end_text = "</job>";
    const readstream = fs.createReadStream(__dirname + "/test.xml");
    const batchsize = 2;
    const result = yield find_file_offsets(readstream, start_text, end_text, batchsize);
    assertSuccess(result, 1000);
  }));
  it.skip("should pull a batch of tags between two points in the file", _asyncToGenerator(function* () {
    const input = {
      filename: "datafeeds/full_feed/feed_100.xml",
      start_text: "<job>",
      end_text: "</job>"
    };
    const { req, res } = make_req_res(input);
    const result = yield chunk(req, res);
    assertSuccess(result);
  }));
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