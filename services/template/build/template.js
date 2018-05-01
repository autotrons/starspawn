"use strict";

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

const uuid = require("uuid");
const template = (() => {
  var _ref = _asyncToGenerator(function* (req, res) {
    const id = uuid.v4();
    console.log(`uuid ${id}`);
    res.send(`v1 ${id}`);
  });

  return function template(_x, _x2) {
    return _ref.apply(this, arguments);
  };
})();

module.exports = {
  template
};