import { unprocessable } from "../utils/errors.js";

/** validate({ body, query, params }) — each is a Zod schema. Parsed values replace the originals. */
export const validate = (schemas) => (req, _res, next) => {
  const errors = [];
  for (const part of ["params", "query", "body"]) {
    if (!schemas[part]) continue;
    const result = schemas[part].safeParse(req[part] ?? {});
    if (!result.success) {
      for (const issue of result.error.issues) {
        errors.push({ field: [part, ...issue.path].join("."), message: issue.message });
      }
    } else if (part === "query") {
      // Express 5: req.query is a getter, so stash parsed values separately.
      req.validatedQuery = result.data;
    } else {
      req[part] = result.data;
    }
  }
  if (errors.length) return next(unprocessable("Request validation failed", errors));
  next();
};
