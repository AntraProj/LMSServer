import { AppError } from "../utils/AppError.js";

// ─── Validate Middleware ───────────────────────────────────────────────────────
// Accepts a Zod schema that wraps { body, params, query }
// Runs before the controller — bad requests never reach business logic
// Overwrites req.body/params/query with Zod-coerced values
// (trimmed strings, lowercased emails, parsed numbers etc.)

export const validate = (schema) => (req, res, next) => {

  const result = schema.safeParse({
    body:   req.body,
    params: req.params,
    query:  req.query,
  });

  if (!result.success) {
    const message = result.error.issues
      .map((e) => e.message)
      .join(", ");
    return next(new AppError(message, 400));
  }

  // Apply coerced values back to the request
  if (result.data.body)   req.body   = result.data.body;
  if (result.data.params) req.params = result.data.params;
  if (result.data.query)  req.query  = result.data.query;

  next();
};