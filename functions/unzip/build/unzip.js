"use strict";

let unzip = (() => {
  var _ref = _asyncToGenerator(function* (req, res) {
    const id = uuid.v4();
    try {
      const result = yield do_file_things(id, req);
      return res_ok(res, { id, function_name });
    } catch (e) {
      return res_err(res, { id, function_name, error: e.toString() });
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

function res_ok(res, payload) {
  res.status(200).send(success(payload));
  return success(payload);
}

function res_err(res, payload) {
  res.status(500).send(failure(payload));
  return failure(payload);
}

function do_file_things(id, req) {
  const {
    source_bucket,
    source_filename,
    target_bucket,
    target_filename
  } = req.body.attributes;
  console.info(`${id} ${function_name} ${source_bucket}/${source_filename} -> ${target_bucket}/${target_filename}`);
  const s_bucket = storage.bucket(source_bucket);
  const s_file = s_bucket.file(source_filename);
  const t_bucket = storage.bucket(target_bucket);
  const t_file = t_bucket.file(target_filename);
  return new Promise((res, rej) => {
    s_file.createReadStream().pipe(gzip).pipe(t_file.createWriteStream()).on("finish", () => {
      res();
    }).on("error", err => {
      rej(err.toString());
    });
  });
}

module.exports = {
  unzip
};