"use strict";

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

const storage = require("@google-cloud/storage");
const download = (() => {
  var _ref = _asyncToGenerator(function* (req, res) {
    console.log("some log message");
    res.send("Downloading this shit");
  });

  return function download(_x, _x2) {
    return _ref.apply(this, arguments);
  };
})();

module.exports = {
  download
};