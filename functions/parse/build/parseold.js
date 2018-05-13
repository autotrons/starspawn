"use strict";

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

const uuid = require("uuid");
const zlib = require("zlib");
const storage = require("@google-cloud/storage")();
const xmlsplit = require("xmlsplit");
const es = require("event-stream");
const fs = require("fs");
const Writable = require("stream").Writable;

const gzip = zlib.createUnzip();
const myBucket = storage.bucket("datafeeds");
const spliter = new xmlsplit(10, "job");

const parse = (() => {
  var _ref = _asyncToGenerator(function* (event) {
    const id = uuid.v4();
    console.log(`${id} starting`);
    const file = event.data;
    const context = event.context;
    const readFileHandle = myBucket.file(file.name);
    const writeFileHandle = myBucket.file(file.name);
    let counter = 0;
    console.log(__dirname);
    const ws = Writable();
    ws._write = function (parse, enc, next) {
      counter += 1;
      const c = counter;
      const filename = `parses/${id}/${counter}.xml`;
      const f = myBucket.file(filename);
      f.save(parse, {
        validation: false
      }, err => {
        if (err) {
          console.error("saveError: " + err.toString());
          next();
        } else {
          console.info(`wrote ${filename}`);
          next();
        }
      });
    };
    return new Promise(function (resolve, reject) {
      readFileHandle.createReadStream().pipe(gzip).pipe(spliter).pipe(ws).on("end", function () {
        console.info(`map complete`);
        resolve({
          id,
          status: "complete"
        });
      }).on("error", function (err) {
        console.error(`${id} ${err.toString()}`);
        reject({
          id,
          status: "error",
          error: err.toString()
        });
      });
    });
  });

  return function parse(_x) {
    return _ref.apply(this, arguments);
  };
})();

module.exports = {
  parse
};
