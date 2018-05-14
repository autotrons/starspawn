'use strict';

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

const {
  assertSuccess,
  assertFailure,
  payload
} = require('@pheasantplucker/failables-node6');
const {
  createDatastoreClient,
  // makeDatastoreKey,
  // makeEntityByName,
  // writeEntity,
  // deleteEntity,
  readEntities,
  // formatResponse,
  // createQueryObj,
  // runQuery,
  // runQueryKeysOnly,
  // deleteByKey,
  // getRawEntitiesByKeys,
  // formatKeyResponse,
  getDatastoreKeySymbol
} = require('@pheasantplucker/gc-datastore');

const { loader, getAttributes, jobsToEntities } = require('./loader');
const equal = require('assert').deepEqual;

const fakeJobArray = require('../../../samples/fakejobsarray.json');
const datastore = createDatastoreClient();
const dsKey = getDatastoreKeySymbol();

describe('loader.js', function () {
  this.timeout(540 * 1000);
  it('should load a list of jobs into Datastore', _asyncToGenerator(function* () {
    const { req, res } = make_req_res(fakeJobArray);
    const result = yield loader(req, res);
    assertSuccess(result);
    const writtenJobs = payload(result);
    const job1Key = writtenJobs.jobEntities[0].key;
    const job1UniqueId = job1Key.name;
    const readCheckResult = yield readEntities([job1Key]);
    console.log(`readCheckResult:`, readCheckResult);
    assertSuccess(readCheckResult);

    const readData = payload(readCheckResult);
    equal(readData[job1UniqueId].title, fakeJobArray[0].title);
  }));

  it(`should fail if not given body.attributes`, _asyncToGenerator(function* () {
    const badReq = {};
    const result = yield loader(badReq, {});
    assertFailure(result);
  }));
});

describe(`jobstoEntities()`, () => {
  it(`should take an array of jobs and return an array of entities`, () => {
    const result = jobsToEntities(fakeJobArray);
    assertSuccess(result);
  });
});

describe(`getAttributes`, () => {
  it(`should return the payload of the request`, () => {
    const dataPayload = { data: 123 };
    const request = make_req_res(dataPayload);
    const { req } = request;
    const result = getAttributes(req);
    const reqPayload = payload(result);
    equal(reqPayload, dataPayload);
  });
});

const make_req_res = attributes => {
  const req = {
    body: {
      attributes
    }
  };
  const res = {
    status: () => {
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
};