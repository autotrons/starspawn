"use strict";

let echo = (() => {
  var _ref = _asyncToGenerator(function* (req, res) {
    const id = uuid.v4();
    console.log(`${id} starting`);
    let counter = 0;
    return res_ok(res, { id });
  });

  return function echo(_x, _x2) {
    return _ref.apply(this, arguments);
  };
})();

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

const uuid = require("uuid");
const { failure, success } = require("@pheasantplucker/failables-node6");

function res_ok(res, payload) {
  console.info(payload);
  res.status(200).send(success(payload));
  return success(payload);
}

function res_err(res, payload) {
  console.error(payload);
  res.status(500).send(failure(payload));
  return failure(payload);
}

module.exports = {
  echo
};