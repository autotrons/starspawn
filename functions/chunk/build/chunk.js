"use strict";

let chunk = (() => {
  var _ref = _asyncToGenerator(function* (req, res) {
    let pipeline = (() => {
      var _ref2 = _asyncToGenerator(function* () {
        try {
          const r1 = yield find_blocks(rStream, start_text, end_text, start_byte_offset);
          if (isFailure(r1)) {
            console.error(`${id} find_blocks ${payload(r1)}`);
            return;
          }
          const blocks = payload(r1).blocks;
          const cursor = payload(r1).cursor;
          const r2 = yield write_blocks(id, `datafeeds/chunks/${id}/${uuid.v4()}.xml`, blocks, parse_topic);
          if (isFailure(r2)) {
            console.error(`${id} write_blocks ${payload(r2)}`);
            return;
          }
          const r3 = continue_work(id, filename, cursor, end_byte_offset, start_text, end_text, parse_topic, continue_topic);
          if (r3 === false) {
            console.info(`${id} continue_work complete`);
            return;
          }
          console.log(r3);
          const r4 = yield publish(continue_topic, r3);
          if (isFailure(r4)) {
            console.error(`${id} publish ${payload(r4)}`);
          }
        } catch (err) {
          console.log(`${id} pipeline ${err.toString()}`);
        }
      });

      return function pipeline() {
        return _ref2.apply(this, arguments);
      };
    })();

    const {
      filename,
      start_text,
      end_text,
      start_byte_offset,
      end_byte_offset,
      parse_topic,
      continue_topic
    } = req.body.attributes;
    let id;
    if (req.body.attributes.id) id = req.body.attributes.id;else id = uuid.v4();
    console.log(`${id} chunk starting`);
    const { bucketpart, filepart } = split_filename(filename);
    const myBucket = storage.bucket(bucketpart);
    const readFileHandle = myBucket.file(filepart);
    const rStream = readFileHandle.createReadStream({
      start: start_byte_offset,
      end: end_byte_offset
    });

    pipeline();
    return res_ok(res, { id });
  });

  return function chunk(_x, _x2) {
    return _ref.apply(this, arguments);
  };
})();

let write_blocks = (() => {
  var _ref4 = _asyncToGenerator(function* (id, filename, blocks, topic) {
    try {
      const preblob = `<?xml version="1.0" encoding="UTF-8"?>\n<root>\n`;
      const postblob = `\n</root>`;
      const file = getFileHandle(filename);
      const blob = blocks.join("\n");
      const r1 = yield file.save(preblob + blob + postblob);
      if (isFailure(r1)) return r1;
      console.info(`${id} wrote ${filename}`);
      const message = {
        data: Buffer.from(JSON.stringify({ id, filename })),
        attributes: { id, filename }
      };
      return publish(topic, message);
    } catch (e) {
      console.log(e.toString());
      return failure(e.toString());
    }
  });

  return function write_blocks(_x4, _x5, _x6, _x7) {
    return _ref4.apply(this, arguments);
  };
})();

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

const uuid = require("uuid");
const {
  failure,
  success,
  isFailure,
  payload
} = require("@pheasantplucker/failables-node6");
const miss = require("mississippi");
const storage = require("@google-cloud/storage")();
const { publish } = require("./pubsub");

const COMPLETE = "complete";

function find_blocks(rs, start_text, end_text, cursor = 0) {
  return new Promise((res, rej) => {
    let done = (() => {
      var _ref3 = _asyncToGenerator(function* (err) {
        if (err && err !== COMPLETE) {
          console.error(err.toString());
          res(failure(err.toString()));
          return;
        }

        res(success({ blocks, cursor }));
      });

      return function done(_x3) {
        return _ref3.apply(this, arguments);
      };
    })();

    const starttime = Date.now();
    let blocks = [];
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
          const b = buffer.slice(start_idx, end_idx);
          blocks.push(b);
        }
        // chop the buffer to the next end_idx so we can look for the next pair
        cursor += end_idx;
        buffer = chop(buffer, end_idx);
        // should we bail out now
        if (blocks.length >= 1000 || Date.now() - starttime > 500 * 1000) {
          more(COMPLETE);
        }
      }
      more();
    }

    miss.each(rs, dochunk, done);
  });
}

function continue_work(id, filename, cursor, end_byte_offset, start_text, end_text, parse_topic, continue_topic) {
  if (cursor >= end_byte_offset) return false;
  const args = {
    id,
    filename,
    start_byte_offset: cursor,
    end_byte_offset: end_byte_offset,
    start_text,
    end_text,
    parse_topic,
    continue_topic
    // not sure if we will be using data or attributes
  };const message = {
    data: Buffer.from(JSON.stringify(args)),
    attributes: args
  };
  return message;
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
  find_blocks,
  write_blocks,
  continue_work
};