import { ApiError } from '../utils/ApiError.js';

export const validate = (schema, source = 'body') => (req, res, next) => {
  const result = schema.safeParse(req[source] ?? {});
  if (!result.success) {
    const errors = result.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message }));
    return next(new ApiError(400, errors[0].message, { errors, code: 'VALIDATION_ERROR' }));
  }
  req[source] = result.data;
  next();
};

// Use with router.param('id', idParam)
export const idParam = (req, res, next, value) =>
  /^[0-9a-fA-F]{24}$/.test(value) ? next() : next(new ApiError(400, 'Invalid id', { code: 'INVALID_ID' }));
