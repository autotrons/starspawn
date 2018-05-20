"use strict";

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

const assert = require("assert");
const { assertSuccess } = require("@pheasantplucker/failables-node6");
const { translate, assemble, extend } = require("./translate");
const { data, types, tmpl } = require("./mocks");

describe("translate.js", function () {
  describe("translate()", function () {
    it("Should return a success and an id", _asyncToGenerator(function* () {
      const input = { data, types, tmpl };
      const { req, res } = make_req_res(input);
      const result = yield translate(req, res);
      assert(typeof result === "object");
      assertSuccess(result);
    }));
  });
  describe("assemble()", function () {
    it("should return an object and success", _asyncToGenerator(function* () {
      const input = {};
      const { req, res } = make_req_res(input);
      const result = yield assemble(req, res);
      assert(typeof result === "object");
      assertSuccess(result);
    }));
  });
  describe("extend()", function () {
    it("should combine two objects", () => {
      //console.log(data, types)
      const extended = extend(data, types);
      assert(typeof extended === "object");
    });
  });
});

function make_req_res(body) {
  const req = {
    body
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