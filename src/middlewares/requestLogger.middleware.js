import morgan from "morgan";
import { morganStream } from "../config/logger.js";
import { isDev } from "../config/env.js";

// ─── Morgan Request Logger ────────────────────────────────────────────────────
// Logs every incoming HTTP request automatically.
// All output is piped into Winston via morganStream.
//
// Dev format:  POST /api/v1/tickets 201 45ms - 512b
// Prod format: ::1 - - [15/Jan/2024:10:23:45 +0000] "POST /api/v1/tickets HTTP/1.1" 201 512
//
// "combined" is the Apache standard format — widely supported by log analysis tools

export const requestLogger = morgan(isDev ? "dev" : "combined", {
    stream: morganStream,

    // Skip logging health check endpoints — they're called every few seconds
    // by load balancers and create noise in your logs
    skip: (req) => req.originalUrl === "/health" || req.originalUrl === "/ping",
});