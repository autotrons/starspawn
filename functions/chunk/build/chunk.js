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

    pipeline(id, CHUNK_CREATED_TOPIC, rStream, start_text, end_text, start_byte_offset);
    return res_ok(res, { id });
  });

  return function chunk(_x, _x2) {
    return _ref.apply(this, arguments);
  };
})();

let write_blocks = (() => {
  var _ref3 = _asyncToGenerator(function* (id, filename, blocks, topic) {
    try {
      const preblob = `<?xml version="1.0" encoding="UTF-8"?>\n<root>\n`;
      const postblob = `\n</root>`;
      const file = getFileHandle(filename);
      const blob = blocks.join("\n");
      const r1 = yield file.save(preblob + blob + postblob);
      if (isFailure(r1)) return r1;
      const message = {
        data: { id, filename },
        attributes: { id, filename }
      };
      return publish(topic, message);
    } catch (e) {
      console.log(e.toString());
      return failure(e.toString());
    }
  });

  return function write_blocks(_x4, _x5, _x6, _x7) {
    return _ref3.apply(this, arguments);
  };
})();

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

const uuid = require("uuid");
const {
  failure,
  success,
  isFailure
} = require("@pheasantplucker/failables-node6");
const miss = require("mississippi");
const storage = require("@google-cloud/storage")();
const { publish } = require("./pubsub");
const CHUNK_CREATED_TOPIC = `chunk-created`;
const COMPLETE = "complete";

function split_at(text, index) {
  return [text.substring(0, index), text.substring(index)];
}

function pipeline(id, topic, rs, start_text, end_text, cursor = 0) {
  return new Promise((res, rej) => {
    let done = (() => {
      var _ref2 = _asyncToGenerator(function* (err) {
        if (err && err !== COMPLETE) {
          console.error(err.toString());
          res(failure(err.toString()));
          return;
        }
        const filename = `datafeeds/chunks/${id}/${uuid.v4()}.xml`;
        const result = yield write_blocks(id, filename, blocks, topic);
        // this is really only returning for testing reasons
        res(result);
      });

      return function done(_x3) {
        return _ref2.apply(this, arguments);
      };
    })();

    const starttime = Date.now();
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
          found += 1;
          pair_idxs.push([cursor + start_idx, cursor + end_idx]);
          const b = buffer.slice(start_idx, end_idx);
          blocks.push(b);
        }
        // chop the buffer to the next end_idx so we can look for
        // the next pair
        cursor += end_idx;
        buffer = chop(buffer, end_idx);
        const now = Date.now();
        // should we bail out now
        if (found > 1000 || now - starttime > 500 * 1000) {
          more(COMPLETE);
        }
      }
      more();
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
  chunk,
  pipeline,
  write_blocks
};