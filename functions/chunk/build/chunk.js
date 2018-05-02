"use strict";

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

const uuid = require("uuid");
var storage = require("@google-cloud/storage")();
var myBucket = storage.bucket("datafeeds");

const chunk = (() => {
  var _ref = _asyncToGenerator(function* (event) {
    const id = uuid.v4();
    console.log(`${id} starting`);
    const file = event.data;
    const context = event.context;
    const fileHandle = myBucket.file(file.name);

    console.log(`Event ${context.eventId}`);
    console.log(`Event Type: ${context.eventType}`);
    console.log(`Bucket: ${file.bucket}`);
    console.log(`File: ${file.name}`);
    console.log(`Metageneration: ${file.metageneration}`);
    console.log(`Created: ${file.timeCreated}`);
    console.log(`Updated: ${file.updated}`);
    console.log(`ResourceState: ${file.resourceState}`);
    return { id, status: "complete" };
  });

  return function chunk(_x) {
    return _ref.apply(this, arguments);
  };
})();

module.exports = {
  chunk
};