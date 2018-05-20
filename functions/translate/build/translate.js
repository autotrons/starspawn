"use strict";

let translate = (() => {
  var _ref = _asyncToGenerator(function* (req, res) {
    const id = uuid.v4();
    console.log(`${id} starting...`);
    const bodyData = getBodyData(req);
    if (isFailure(bodyData)) return bodyData;
    const dataResult = payload(bodyData);
    const extended = extend(dataResult.data, dataResult.types);
    if (isFailure(extended)) return extended;
    const extendedResult = payload(extended);
    console.log(extendedResult);
    const assembly = yield assemble(dataResult.tmpl, extendedResult);
    if (isFailure(assembly)) return assembly;
    const result = payload(assembly);
    console.log(JSON.parse(result));
    return res_ok(res, { result });
  });

  return function translate(_x, _x2) {
    return _ref.apply(this, arguments);
  };
})();

let assemble = (() => {
  var _ref2 = _asyncToGenerator(function* (tmpl, data) {
    try {
      const result = new ObjectTemplate(tmpl).transform(data);
      return success(result);
    } catch (e) {
      return failure(e.toString(), {
        error: "Couldn't translate template/data",
        tmpl,
        data
      });
    }
  });

  return function assemble(_x3, _x4) {
    return _ref2.apply(this, arguments);
  };
})();

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

const uuid = require("uuid");
const ObjectTemplate = require("json2json").ObjectTemplate;
const {
  failure,
  payload,
  success,
  isFailure
} = require("@pheasantplucker/failables-node6");

function extend(obj, src) {
  try {
    let result = Object.keys(src).forEach(function (key) {
      obj[key] = src[key];
      return obj;
    });
    return success(result);
  } catch (e) {
    return failure(e.toString(), {
      error: "Could not merge objects",
      obj,
      src
    });
  }
}

const getBodyData = req => {
  try {
    if (req.body.data) {
      return success(req.body);
    } else {
      return failure(req, { error: "couldnt access req.data" });
    }
  } catch (e) {
    return failure(e.toString(), {
      error: "couldnt access req.data",
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
  translate,
  assemble,
  extend
};