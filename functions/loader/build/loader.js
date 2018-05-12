'use strict';

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

const uuid = require('uuid');
const {
  success,
  failure,
  isFailure,
  payload
} = require('@pheasantplucker/failables-node6');
const {
  createDatastoreClient,
  // makeDatastoreKey,
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
} = require('@pheasantplucker/gc-datastore');

const loader = (() => {
  var _ref = _asyncToGenerator(function* (req, res) {
    const id = uuid.v4();

    const jobsResult = getAttributes(req);
    if (isFailure(jobsResult)) return jobsResult;
    const jobs = payload(jobsResult);

    const datastore = createDatastoreClient();
    // all jobs need extra field IS_TEST = true/false

    const jobEntitiesResult = yield jobsToEntities(jobs);
    if (isFailure(jobEntitiesResult)) return jobEntitiesResult;

    const jobEntities = payload(jobEntitiesResult);

    const writeResult = yield writeEntity(jobEntities);
    if (isFailure(writeResult)) return writeResult;
    const writePayload = payload(writeResult);

    return res_ok(res, { jobEntities, writePayload });
  });

  return function loader(_x, _x2) {
    return _ref.apply(this, arguments);
  };
})();

const getAttributes = req => {
  try {
    if (req.body.attributes) {
      return success(req.body.attributes);
    } else {
      return failure(req, { error: 'couldnt access req.body.attributes' });
    }
  } catch (e) {
    return failure(e.toString(), {
      error: 'couldnt access req.body.attributes',
      req: req
    });
  }
};

function res_ok(res, payload) {
  res.status(200).send(success(payload));
  return success(payload);
}

const jobsToEntities = jobs => {
  const kind = 'jobs'; //hmm, testing data?
  try {
    const entities = jobs.map(job => {
      const thisEntity = makeEntityByName(kind, job.job_reference, job);
      return payload(thisEntity);
    });
    return success(entities);
  } catch (e) {
    return failure(e.toString(), {
      jobs: jobs
    });
  }
};

// function res_err(res, payload) {
//   console.error(payload)
//   res.status(500).send(failure(payload))
//   return failure(payload)
// }

module.exports = {
  loader,
  getAttributes,
  jobsToEntities
};