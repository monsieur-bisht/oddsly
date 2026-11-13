import { AppError } from "../utils/errors.js";
import { env } from "../config/env.js";

export function notFoundHandler(req, _res, next) {
  next(new AppError(404, "not-found", `Route ${req.method} ${req.originalUrl} not found`));
}

// RFC 7807 problem+json responses.
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, _next) {
  let status = 500;
  let code = "internal-error";
  let detail = "Something went wrong";
  let errors;

  if (err instanceof AppError) {
    ({ status, code, errors } = err);
    detail = err.message;
  } else if (err?.type === "entity.parse.failed") {
    status = 400;
    code = "bad-request";
    detail = "Malformed JSON body";
  } else if (err?.type === "entity.too.large") {
    status = 413;
    code = "payload-too-large";
    detail = "Request body too large";
  } else if (err?.name === "ValidationError" && err.errors) {
    status = 422;
    code = "validation-error";
    detail = "Validation failed";
    errors = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
  } else if (err?.name === "CastError") {
    status = 400;
    code = "bad-request";
    detail = "Invalid identifier";
  } else if (err?.code === 11000) {
    status = 409;
    code = "conflict";
    detail = "Duplicate value";
  }

  if (status >= 500) console.error(err);

  const titles = { 400: "Bad Request", 401: "Unauthorized", 403: "Forbidden", 404: "Not Found", 409: "Conflict", 413: "Payload Too Large", 422: "Validation Error", 429: "Too Many Requests", 500: "Internal Server Error" };
  res
    .status(status)
    .type("application/problem+json")
    .json({
      type: `https://oddsly.local/errors/${code}`,
      title: titles[status] ?? "Error",
      status,
      detail: status >= 500 && env.NODE_ENV === "production" ? "Something went wrong" : detail,
      instance: req.originalUrl,
      ...(errors ? { errors } : {}),
    });
}
