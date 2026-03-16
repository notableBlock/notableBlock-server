const { validationResult } = require("express-validator");
const createError = require("http-errors");

// express-validator 검증 결과를 확인하고 첫 번째 에러를 400으로 반환하는 공통 핸들러
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(createError(400, errors.array()[0].msg));
  }
  next();
};

module.exports = validate;
