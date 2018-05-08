"use strict";

let unzip = (() => {
  var _ref = _asyncToGenerator(function* (req, res) {
    const id = uuid.v4();
    try {
      // res.status(200)
      // res.send(
      //   success({
      //     id
      //   })
      // )
      return success({
        id,
        function_name
      });
    } catch (e) {
      res.status(500);
      res.send(failure({
        id
      }));

      return failure(e.toString());
    }
  });

  return function unzip(_x, _x2) {
    return _ref.apply(this, arguments);
  };
})();

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

const uuid = require("uuid");
const zlib = require("zlib");
const storage = require("@google-cloud/storage")();
const { success, failure } = require("@pheasantplucker/failables-node6");

const gzip = zlib.createUnzip();
const function_name = "unzip";

function do_file_things(req) {
  const {
    source_bucket,
    source_filename,
    target_bucket,
    target_filename
  } = req.body.attributes;
  const s_bucket = storage.bucket(source_bucket);
  const readStream = s_bucket.file(source_filename).createReadStream({});
  const t_bucket = storage.bucket(target_bucket);
  const writeStream = t_bucket.file(target_filename).createWriteStream({});
  return new Promise((res, rej) => {
    readStream.pipe(gzip).pipe(writeStream).on("end", () => {
      console.info(`${id} ${functionName} complete`);
      resolve({
        id,
        status: "complete"
      });
    }).on("error", err => {
      console.error(`${id} ${err.toString()}`);
      reject({
        id,
        status: "error",
        error: err.toString()
      });
    });
  });
}

module.exports = {
  unzip
};