export class AppError extends Error {
  constructor(status, code, detail, errors) {
    super(detail);
    this.status = status;
    this.code = code;
    this.errors = errors;
  }
}

export const unauthorized = (detail = "Authentication required") => new AppError(401, "unauthorized", detail);
export const forbidden = (detail = "You do not have permission") => new AppError(403, "forbidden", detail);
export const notFound = (detail = "Resource not found") => new AppError(404, "not-found", detail);
export const conflict = (detail) => new AppError(409, "conflict", detail);
export const unprocessable = (detail, errors) => new AppError(422, "validation-error", detail, errors);
