"use strict";

let chunk = (() => {
  var _ref = _asyncToGenerator(function* (req, res) {
    const id = uuid.v4();
    console.log(`${id} starting`);
    const {
      filename,
      start_text,
      end_text,
      start_byte_offset,
      end_byte_offset
    } = req.body.attributes;
    const { bucketpart, filepart } = split_filename(filename);
    const myBucket = storage.bucket(bucketpart);
    const readFileHandle = myBucket.file(filepart);
    const rStream = readFileHandle.createReadStream({
      start: start_byte_offset,
      end: end_byte_offset
    });

    pipeline(rStream, start_text, end_text, start_byte_offset);
    return res_ok(res, { id });
  });

  return function chunk(_x, _x2) {
    return _ref.apply(this, arguments);
  };
})();

let write_blocks = (() => {
  var _ref2 = _asyncToGenerator(function* (id, filename, blocks) {
    try {
      const preblob = `<?xml version="1.0" encoding="UTF-8"?>\n<root>\n`;
      const postblob = `\n</root>`;
      const file = getFileHandle(filename);
      const blob = blocks.join("\n");
      const result = yield file.save(preblob + blob + postblob);
      return success(result);
    } catch (e) {
      console.log(e.toString());
      return failure(e.toString());
    }
  });

  return function write_blocks(_x3, _x4, _x5) {
    return _ref2.apply(this, arguments);
  };
})();

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

const uuid = require("uuid");
const { failure, success } = require("@pheasantplucker/failables-node6");
const miss = require("mississippi");
const storage = require("@google-cloud/storage")();

function split_at(text, index) {
  return [text.substring(0, index), text.substring(index)];
}

function pipeline(rs, start_text, end_text, cursor = 0) {
  return new Promise((res, rej) => {
    let pair_idxs = [];
    let blocks = [];
    let found = 0;
    let buffer = "";
    let start_idx = -1;
    let end_idx = -1;
    function dochunk(chunk, more) {
      // look for next tags
      buffer += chunk.toString();
      while (buffer.length > 0) {
        start_idx = buffer.indexOf(start_text);
        end_idx = buffer.indexOf(end_text);
        // one of the tags is missing so we need more data
        if (end_idx < 0 || start_idx < 0) break;
        // move to the end of the text
        end_idx += end_text.length;
        // the tags are both in the buffer and in the right order
        if (start_idx < end_idx) {
          pair_idxs.push([cursor + start_idx, cursor + end_idx]);
          const b = buffer.slice(start_idx, end_idx);
          blocks.push(b);
        }
        // chop the buffer to the next end_idx so we can look for
        // the next pair
        cursor += end_idx;
        buffer = chop(buffer, end_idx);
      }
      more();
    }

    function done(err) {
      if (err) {
        console.error(err.toString());
        res(failure(err.toString()));
      } else {
        // this is really only returning for testing reasons
        //console.log(blocks)
        res(success(pair_idxs));
      }
    }
    miss.each(rs, dochunk, done);
  });
}

function chop(str, idx) {
  return str.slice(idx);
}

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

function split_filename(n) {
  const [bucketpart, ...filepartarray] = n.split("/");
  const filepart = filepartarray.join("/");
  return { bucketpart, filepart };
}

function getFileHandle(filepath) {
  const { bucketpart, filepart } = split_filename(filepath);
  const bucket = storage.bucket(bucketpart);
  const file = bucket.file(filepart);
  return file;
}

module.exports = {
  split_at,
  chunk,
  pipeline,
  write_blocks
};