"use strict";

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

const uuid = require("uuid");
var storage = require("@google-cloud/storage")();
var myBucket = storage.bucket("datafeeds");
const get = require("simple-get");

const download = (() => {
  var _ref = _asyncToGenerator(function* (req, res) {
    const id = uuid.v4();
    console.log(`${id} starting`);
    const file = myBucket.file(`${id}.xml.gz`);
    get("https://exchangefeeds.s3.amazonaws.com/9d2dcb702d7d6b801f34227c04c8bb23/feed.xml.gz", function (err, res) {
      if (err) {
        console.error(`${id} ${err.toString()}`);
      }
      console.log(`${id} ${res.statusCode}`);
      res.pipe(file.createWriteStream()).on("error", function (err) {
        console.error(`${id} ${err.toString()}`);
      }).on("finish", function () {
        console.log(`${id} complete`);
      }); // `res` is a stream
    });

    res.send({ id, status: "downloading" });
  });

  return function download(_x, _x2) {
    return _ref.apply(this, arguments);
  };
})();

module.exports = {
  download
};