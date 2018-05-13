"use strict";

let render = (() => {
  var _ref = _asyncToGenerator(function* (req, res) {
    const id = uuid.v4();
    const jobIdResult = getJobId(req);
    if (isFailure(jobIdResult)) return jobIdResult;
    const jobId = payload(jobIdResult);
    const jobDataResult = yield getDataFromDatastore(jobId);
    if (isFailure(jobDataResult)) return jobDataResult;
    const jobData = payload(jobDataResult)[jobId];

    try {
      const filePath = path.join(__dirname, "../template/index.ejs");
      const html = yield cons.ejs(filePath, jobData);
      return res_ok(res, html);
    } catch (e) {
      console.log(e.toString());
      return res_err(res, e.toString());
    }

    return res_err(res, e.toString());
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
const path = require("path");
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

const getJobId = req => {
  try {
    if (req.query.jobId) {
      return success(req.query.jobId);
    } else {
      return failure(req, { error: "couldnt access req.query" });
    }
  } catch (e) {
    return failure(e.toString(), {
      error: "couldnt access req.query",
      req: req
    });
  }
};

function res_ok(res, payload) {
  res.status(200).send(payload);
  return success(payload);
}

function res_err(res, payload) {
  console.error(payload);
  res.status(500).send(payload);
  return failure(payload);
}

module.exports = {
  render,
  getDataFromDatastore
};