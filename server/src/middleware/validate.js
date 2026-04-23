const { validationResult } = require('express-validator');
const HttpError = require('../utils/httpError');

const validate = (req, _res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }

  return next(
    new HttpError(
      400,
      errors
        .array()
        .map((error) => error.msg)
        .join(' | ')
    )
  );
};

module.exports = validate;
