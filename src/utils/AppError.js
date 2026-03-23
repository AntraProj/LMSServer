// ─── AppError ─────────────────────────────────────────────────────────────────
// A custom error class for all known, expected errors in your app.
//
// "Operational" errors are expected failures you handle gracefully:
//   - User not found (404)
//   - Invalid credentials (401)
//   - Forbidden access (403)
//   - Validation failures (400)
//
// "Programmer" errors are unexpected bugs:
//   - Cannot read property of undefined
//   - Database connection lost
//   - These should crash loudly so you fix them
//
// By throwing AppError for operational errors, your errorHandler can
// distinguish between the two and respond appropriately.
//
// Usage:
//   throw new AppError("Ticket not found", 404);
//   throw new AppError("You do not have access to this project", 403);
//   throw new AppError("Invalid credentials", 401);

export class AppError extends Error {
    constructor(message, statusCode) {
        super(message);

        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";

        // Flag to distinguish operational errors from programmer bugs
        this.isOperational = true;

        // Captures a clean stack trace that excludes the constructor call itself
        Error.captureStackTrace(this, this.constructor);
    }
}