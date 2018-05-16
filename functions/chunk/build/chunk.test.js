"use strict";

let exists = (() => {
  var _ref11 = _asyncToGenerator(function* (bucket, filename) {
    const result = yield storage.bucket(bucket).file(filename).exists();
    return success(result[0]);
  });

  return function exists(_x, _x2) {
    return _ref11.apply(this, arguments);
  };
})();

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

const equal = require("assert").deepEqual;
const uuid = require(`uuid`);
const {
  assertSuccess,
  success,
  payload
} = require("@pheasantplucker/failables-node6");
const { chunk, find_blocks, write_blocks, continue_work } = require("./chunk");
const {
  pull,
  ack,
  createSubscription,
  createTopic,
  deleteSubscription,
  deleteTopic
} = require("./pubsub");
const fs = require("fs");
const storage = require("@google-cloud/storage")();
const MEGABYTE = Math.pow(2, 20);

const TOPIC = `test-${uuid.v4()}`;
const SUBSCRIPTION = `test-${uuid.v4()}`;

describe("chunk.js", function () {
  this.timeout(540 * 1000);
  before("should set shit up", _asyncToGenerator(function* () {
    const r1 = yield createTopic(TOPIC);
    assertSuccess(r1);
    const r2 = yield createSubscription(TOPIC, SUBSCRIPTION);
    assertSuccess(r2);
  }));
  describe("write_block", () => {
    it("write blocks to a file", _asyncToGenerator(function* () {
      const blocks = ["<job><id>1</id></job>", "<job><id>2</id></job>"];
      const id = "test_" + uuid.v4();
      const filename = `datafeeds/chunks/${id}/1.xml`;
      const r1 = yield write_blocks(id, filename, blocks, TOPIC);
      assertSuccess(r1);
      const r2 = yield exists("datafeeds", `chunks/${id}/1.xml`);
      assertSuccess(r2, true);
      const r3 = yield pull(SUBSCRIPTION, 1, false);
      assertSuccess(r3);
      const msg1 = payload(r3)[0].receivedMessages[0];
      equal(msg1.message.attributes.filename, filename);
      const ackId = msg1.ackId;
      const r4 = yield ack(SUBSCRIPTION, [ackId]);
      assertSuccess(r4);
    }));
  });
  describe("find_blocks", _asyncToGenerator(function* () {
    it("chop the file into blocks of tag pairs", _asyncToGenerator(function* () {
      const id = uuid.v4();
      const start_text = "<job>";
      const end_text = "</job>";
      const readstream = fs.createReadStream(__dirname + "/feed_100.xml", {
        start: 0,
        end: 6000
      });
      const result = yield find_blocks(readstream, start_text, end_text);
      assertSuccess(result);
      equal(payload(result).blocks.length > 0, true);
    }));
  }));
  describe("continue_work", _asyncToGenerator(function* () {
    it("if we do not need to do more work return false", _asyncToGenerator(function* () {
      const id = uuid.v4();
      const filename = "datafeeds/full_feed/feed_100.xml";
      const cursor = Math.pow(2, 10);
      const end_byte_offset = Math.pow(2, 10);
      const start_text = "<job>";
      const end_text = "</job>";
      const result = continue_work(id, filename, cursor, end_byte_offset, start_text, end_text);
      equal(result, false);
    }));
    it("if we need more work return the payload to the next call", _asyncToGenerator(function* () {
      const id = uuid.v4();
      const filename = "datafeeds/full_feed/feed_100.xml";
      const cursor = Math.pow(2, 5);
      const end_byte_offset = Math.pow(2, 10);
      const start_text = "<job>";
      const end_text = "</job>";
      const parse_topic = "chunk_created";
      const continue_topic = "chunk_work";
      const expected = {
        id,
        filename,
        start_byte_offset: cursor,
        end_byte_offset,
        start_text,
        end_text,
        parse_topic,
        continue_topic
      };
      const result = continue_work(id, filename, cursor, end_byte_offset, start_text, end_text, parse_topic, continue_topic);
      equal(JSON.parse(result.data), expected);
    }));
  }));
  describe("chunk", _asyncToGenerator(function* () {
    it("chunk a big xml file into blocks and write the file", _asyncToGenerator(function* () {
      const input = {
        filename: "datafeeds/full_feed/feed_500k.xml",
        start_byte_offset: 0,
        end_byte_offset: 1 * Math.pow(2, 20),
        start_text: "<job>",
        end_text: "</job>",
        parse_topic: "chunk_created",
        continue_topic: "chunk_work"
      };
      const { req, res } = make_req_res(input);
      const result = yield chunk(req, res);
      assertSuccess(result);
    }));
  }));
  after("clean up the topic and subscription", _asyncToGenerator(function* () {
    const r1 = yield deleteTopic(TOPIC);
    assertSuccess(r1);
    const r2 = yield deleteSubscription(TOPIC, SUBSCRIPTION);
    assertSuccess(r2);
  }));
});

function make_req_res(data) {
  const req = {
    body: {
      message: { data }
    }
  };
  const res = {
    status: function () {
      return {
        send: () => {}
      };
    },
    send: () => {}
  };
  return {
    req,
    res
  };
}