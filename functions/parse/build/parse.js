'use strict';

let parse = (() => {
  var _ref = _asyncToGenerator(function* (req, res) {
    const id = uuid.v4();
    console.log(`${id} starting`);
    const r1 = getAttributes(req);
    if (isFailure(r1)) return r1;
    const attrs = payload(r1);
    const filePath = attrs.fileName;

    const r2 = yield getFile(filePath);
    if (isFailure(r2)) return r2;
    const xmlFile = payload(r2);

    const r3 = yield parseXmlToJson(xmlFile);
    if (isFailure(r3)) return r3;
    const jsonJobs = payload(r3);

    var options = {
      method: 'POST',
      uri: 'https://us-central1-starspawn-201921.cloudfunctions.net/loader',
      body: { attributes: jsonJobs.root.job },
      json: true // Automatically stringifies the body to JSON
    };

    const postToLoader = yield rp(options);

    // console.log(`postToLoader:`, postToLoader)

    return res_ok(res, { id });
  });

  return function parse(_x, _x2) {
    return _ref.apply(this, arguments);
  };
})();

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

const uuid = require('uuid');
const {
  failure,
  success,
  isFailure,
  payload
} = require('@pheasantplucker/failables-node6');
const storage = require('@google-cloud/storage')();
const xml2js = require('xml2js');
const rp = require('request-promise');
const parser = new xml2js.Parser({ explicitArray: false, trim: true });
const {
  createBucket,
  bucketExists,
  //   noUpperCase,
  uploadFile,
  //   getBucket,
  //   newFile,
  exists,
  save,
  getFile
  //   deleteFile,
  // createWriteStream,
  //   deleteBucket
} = require('@pheasantplucker/gc-cloudstorage');

function parseXmlToJson(xml) {
  try {
    let json = {};
    const parsedToJson = parser.parseString(xml, function (err, result) {
      json = result;
    });
    return success(json);
  } catch (e) {
    return failure(e.toString());
  }
}
//
// async function sourceAtoJSON(d, authorization, replyEmail) {
//   const r1 = await parseXmlToJson(d)
//   const results = r1.jobs.job.map(a =>
//     typeAToJSON(a, authorization, replyEmail)
//   )
//   return results
// }

function res_ok(res, payload) {
  // console.info(payload)
  res.status(200).send(success(payload));
  return success(payload);
}

function res_err(res, payload) {
  console.error(payload);
  res.status(500).send(failure(payload));
  return failure(payload);
}

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

module.exports = {
  parse,
  parseXmlToJson
};