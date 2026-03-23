import { logger } from "../config/logger.js";
import { AppError } from "../utils/AppError.js";
import { isDev, isTest } from "../config/env.js";
import { constants } from "../utils/constants.js";

// ─── Prisma Error Handlers ────────────────────────────────────────────────────
// Converts Prisma-specific errors into clean AppErrors so the client
// gets a meaningful message instead of a raw Prisma stack trace.

const handlePrismaError = (err) => {
    switch (err.code) {
        // Unique constraint violation — e.g. duplicate email, duplicate project key
        case "P2002": {
            const field = err.meta?.target?.join(", ") ?? "field";
            return new AppError(`A record with this ${field} already exists.`, 409);
        }

        // Record not found — e.g. update/delete on non-existent ID
        case "P2025":
            return new AppError("The requested record was not found.", 404);

        // Foreign key constraint — e.g. referencing a projectId that doesn't exist
        case "P2003": {
            const field = err.meta?.field_name ?? "related record";
            return new AppError(`Referenced ${field} does not exist.`, 400);
        }

        // Required field missing
        case "P2011": {
            const field = err.meta?.constraint ?? "field";
            return new AppError(`${field} is required.`, 400);
        }

        // Value too long for field
        case "P2000": {
            const field = err.meta?.column_name ?? "field";
            return new AppError(`The value for ${field} is too long.`, 400);
        }

        // Default — unknown Prisma error
        default:
            return new AppError("A database error occurred.", 500);
    }
};

// ─── JWT Error Handlers ───────────────────────────────────────────────────────

const handleJWTError = () =>
    new AppError("Invalid token. Please log in again.", 401);

const handleJWTExpiredError = () =>
    new AppError("Your session has expired. Please log in again.", 401);

// ─── Dev vs Prod Response ─────────────────────────────────────────────────────
// In development: send full error details + stack trace
// In production:  only send safe, clean messages to the client

const sendDevError = (err, res) => {
    res.status(err.statusCode).json({
        success: false,
        status: err.status,
        message: err.message,
        stack: err.stack,
        error: err,
    });
};

const sendProdError = (err, res) => {
    // Operational error — known, expected, safe to tell the client about
    if (err.isOperational) {
        return res.status(err.statusCode).json({
            success: false,
            status: err.status,
            message: err.message,
        });
    }

    // Programmer error — unknown bug, don't leak details to the client
    return res.status(500).json({
        success: false,
        status: "error",
        message: "Something went wrong. Please try again later.",
    });
};

// ─── Global Error Handler ─────────────────────────────────────────────────────
// Must have 4 parameters — Express identifies error handlers by (err, req, res, next)
// Must be the LAST middleware registered in app.js

export const errorHandler = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || "error";

    // ─── Convert known error types into AppErrors ──────────────────────────────
    let error = err;

    // Prisma errors
    if (err.constructor?.name === constants.PrismaClientKnownRequestError) {
        error = handlePrismaError(err);
    }

    // Prisma validation errors (e.g. passing a string where an int is expected)
    if (err.constructor?.name === constants.PrismaClientValidationError) {
        error = new AppError("Invalid data provided.", 400);
    }

    // JWT errors (from jsonwebtoken package)
    if (err.name === constants.JsonWebTokenError) error = handleJWTError();
    if (err.name === constants.TokenExpiredError) error = handleJWTExpiredError();

    // Malformed JSON body — Express throws this when body-parser fails
    if (err.type === constants.entityParseFailed) {
        error = new AppError("Invalid JSON in request body.", 400);
    }

    // ─── Log the error ─────────────────────────────────────────────────────────

    const logPayload = {
        message: error.message,
        statusCode: error.statusCode,
        method: req.method,
        route: req.originalUrl,
        userId: req.user?.id ?? null,
        ip: req.ip,
    };

    if (error.statusCode >= 500) {
        // Server errors — log with full stack trace
        logger.error({ ...logPayload, stack: err.stack });
    } else if (error.statusCode >= 400) {
        // Client errors — warn level, no stack needed
        logger.warn(logPayload);
    }

    // ─── Send response ─────────────────────────────────────────────────────────
    if (isDev || isTest) {
        sendDevError(error, res);
    } else {
        sendProdError(error, res);
    }
};