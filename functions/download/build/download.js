"use strict";

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

const uuid = require("uuid");
var storage = require("@google-cloud/storage")();
var myBucket = storage.bucket("datafeeds");
const get = require("simple-get");

const download = (() => {
  var _ref = _asyncToGenerator(function* (req, downloadResponse) {
    const id = uuid.v4();
    console.log(`${id} starting`);
    const file = myBucket.file(`${id}.xml.gz`);
    get("https://exchangefeeds.s3.amazonaws.com/9d2dcb702d7d6b801f34227c04c8bb23/feed.xml.gz", function (err, getResponse) {
      if (err) {
        console.error(`${id} ${err.toString()}`);
        downloadResponse.status(500).send({ id, status: err.toString() });
      }
      console.log(`${id} getResponse ${getResponse.statusCode}`);
      getResponse.pipe(file.createWriteStream()).on("error", function (err) {
        console.error(`${id} ${err.toString()}`);
        downloadResponse.status(500).send({ id, status: err.toString() });
      }).on("finish", function () {
        console.log(`${id} complete`);
        downloadResponse.status(200).send({ id, status: "complete" });
      });
    });
  });

  return function download(_x, _x2) {
    return _ref.apply(this, arguments);
  };
})();

module.exports = {
  download
};