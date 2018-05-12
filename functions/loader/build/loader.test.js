"use strict";

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

const { assertSuccess } = require("@pheasantplucker/failables-node6");
const { loader } = require("./loader");
const MEGABYTE = Math.pow(2, 20);

describe("loader.js", function () {
  this.timeout(540 * 1000);
  it("should load a list of jobs into Datastore", _asyncToGenerator(function* () {
    const input = {
      start: 1 * MEGABYTE,
      end: 2 * MEGABYTE,
      start_text: "<job>",
      end_text: "</job>"
    };
    const { req, res } = make_req_res(input);
    const result = yield loader(req, res);
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