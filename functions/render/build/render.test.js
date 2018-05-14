"use strict";

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

const { assertSuccess, payload } = require("@pheasantplucker/failables-node6");
const assert = require("assert");
const { parse } = require("himalaya");
const { render, getDataFromDatastore } = require("./render");
const {
  createDatastoreClient,
  readEntities,
  getDatastoreKeySymbol
} = require("@pheasantplucker/gc-datastore");

describe("render.js ", () => {
  describe.skip("getDataFromDatastore()", function () {
    this.timeout(540 * 1000);
    it("Should get data from GCE Datastore", _asyncToGenerator(function* () {
      const keyName = "63_Apr43245";
      const result = yield getDataFromDatastore(keyName);
      assertSuccess(result);
      const data = payload(result);
      assert(typeof data === "object");
    }));
  });

  describe("render()", () => {
    it("Should render an AMP page from a query string", _asyncToGenerator(function* () {
      const { req, res } = make_req_res();
      const result = yield render(req, res);
      assertSuccess(result);
      const renderedAmp = payload(result);
      const parsed = parse(renderedAmp);
      assert(typeof renderedAmp === "string");
      assert(parsed[0].tagName === "!doctype");
    }));
  });
});

function make_req_res() {
  const req = {
    query: {
      jobId: "63_Apr43245"
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