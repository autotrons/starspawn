"use strict";

let render = (() => {
  var _ref = _asyncToGenerator(function* (req, res) {
    const id = uuid.v4();
    console.log(`Starting: ${id}`);
    const jobId = getAttributes(req);

    if (isFailure(jobId)) return jobId;

    return success();
  });

  return function render(_x, _x2) {
    return _ref.apply(this, arguments);
  };
})();

let getDataFromDatastore = (() => {
  var _ref2 = _asyncToGenerator(function* (keyName) {
    const datastore = createDatastoreClient("starspawn-201921");
    const entityKeyResult = makeDatastoreKey("jobs", keyName);
    if (isFailure(entityKeyResult)) return entityKeyResult;
    const entityKey = payload(entityKeyResult);
    const entity = yield readEntities([entityKey]);
    if (isFailure(entity)) return entity;
    const jobData = payload(entity);
    return success(jobData);
  });

  return function getDataFromDatastore(_x3) {
    return _ref2.apply(this, arguments);
  };
})();

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

const uuid = require("uuid");
const datastore = require("@google-cloud/datastore");
const cons = require("consolidate");
const {
  success,
  failure,
  isFailure,
  payload
} = require("@pheasantplucker/failables-node6");
const {
  createDatastoreClient,
  makeDatastoreKey,
  makeEntityByName,
  writeEntity,
  // deleteEntity,
  readEntities
  // formatResponse,
  // createQueryObj,
  // runQuery,
  // runQueryKeysOnly,
  // deleteByKey,
  // getRawEntitiesByKeys,
  // formatKeyResponse,
  // getDatastoreKeySymbol,
} = require("@pheasantplucker/gc-datastore");

const getAttributes = req => {
  try {
    if (req.body.attributes) {
      return success(req.body.attributes);
    } else {
      return failure(req, { error: "couldnt access req.body.attributes" });
    }
  } catch (e) {
    return failure(e.toString(), {
      error: "couldnt access req.body.attributes",
      req: req
    });
  }
};

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

module.exports = {
  render,
  getDataFromDatastore
};