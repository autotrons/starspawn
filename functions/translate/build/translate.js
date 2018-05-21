"use strict";

let translate = (() => {
  var _ref = _asyncToGenerator(function* (req, res) {
    const id = uuid.v4();
    const body = getBodyData(req);
    if (isFailure(body)) return body;
    const { data, types, tmpl } = payload(body);
    const merged = yield blend(data, types);
    if (isFailure(merged)) return merged;
    const mergedResult = payload(merged);
    const translator = yield assemble(tmpl, mergedResult);
    if (isFailure(translator)) return translator;
    const result = payload(translator);
    return success(result);
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

function blend(obj, src) {
  try {
    Object.keys(src).forEach(key => {
      obj[key] = src[key];
    });
    return success(obj);
  } catch (e) {
    return failure(e.toString(), {
      error: "Couldn't merge objects",
      obj,
      src
    });
  }
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

module.exports = {
  translate,
  assemble,
  blend
};