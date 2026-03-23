import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
import path from "path";
import { env, isDev, isTest } from "./env.js";

const { combine, timestamp, printf, colorize, errors, json, splat } =
    winston.format;

// ─── Console Format ───────────────────────────────────────────────────────────
// What logs look like in your terminal during development:
// 2024-01-15 10:23:45 [info]: Server started on port 3000
// 2024-01-15 10:23:45 [error]: Something broke
//   { "userId": 1, "route": "/api/v1/tickets" }

const consoleFormat = printf(({ level, message, timestamp, stack, ...meta }) => {
    const text = stack || message;
    const metaStr =
        Object.keys(meta).length > 0
            ? `\n${JSON.stringify(meta, null, 2)}`
            : "";
    return `${timestamp} [${level}]: ${text}${metaStr}`;
});

// ─── Transports ───────────────────────────────────────────────────────────────

const transports = [];

// 1. Console — always on except during tests
if (!isTest) {
    transports.push(
        new winston.transports.Console({
            format: combine(
                colorize({ all: true }),
                timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
                errors({ stack: true }),
                splat(),
                consoleFormat
            ),
        })
    );
}

// 2. File transports — only in production
if (!isDev && !isTest) {
    const logDir = path.resolve(env.logDir);

    // combined-2024-01-15.log — info, warn, error
    transports.push(
        new DailyRotateFile({
            dirname: logDir,
            filename: "combined-%DATE%.log",
            datePattern: "YYYY-MM-DD",
            zippedArchive: true,
            maxSize: "20m",
            maxFiles: "30d",
            level: "info",
            format: combine(timestamp(), errors({ stack: true }), json()),
        })
    );

    // error-2024-01-15.log — errors only, easier to scan in production
    transports.push(
        new DailyRotateFile({
            dirname: logDir,
            filename: "error-%DATE%.log",
            datePattern: "YYYY-MM-DD",
            zippedArchive: true,
            maxSize: "20m",
            maxFiles: "30d",
            level: "error",
            format: combine(timestamp(), errors({ stack: true }), json()),
        })
    );
}

// ─── Logger Instance ──────────────────────────────────────────────────────────

export const logger = winston.createLogger({
    level: env.logLevel,
    transports,
    exitOnError: false,
});

// ─── Morgan Stream ────────────────────────────────────────────────────────────
// Redirects Morgan HTTP logs into Winston so everything goes through one system

export const morganStream = {
    write: (message) => {
        logger.http(message.trim());
    },
};