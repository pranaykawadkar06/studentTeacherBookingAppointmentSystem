export class ApiError extends Error {
  constructor(statusCode, message, { code, errors } = {}) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = code;
    this.errors = errors;
  }
}
