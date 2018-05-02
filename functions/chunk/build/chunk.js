"use strict";

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

const uuid = require("uuid");
var storage = require("@google-cloud/storage")();
var myBucket = storage.bucket("datafeeds");

const chunk = (() => {
  var _ref = _asyncToGenerator(function* (req, downloadResponse) {
    const id = uuid.v4();
    console.log(`${id} starting`);
    downloadResponse.status(200).send({ id, status: "complete" });
  });

  return function chunk(_x, _x2) {
    return _ref.apply(this, arguments);
  };
})();

module.exports = {
  chunk
};