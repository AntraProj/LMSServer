import app from './app.js';
import { env } from './config/env.js';
import { logger } from "./config/logger.js";
import { disconnectPrisma } from "./lib/prisma.js";

const server = app.listen(env.port, () => {
  logger.info(`Server running on ${env.port} [${env.nodeEnv}]`);
});

// ─── Graceful Shutdown ────────────────────────────────────────────────────────
// Closes existing connections cleanly before the process exits.
// Without this, in-flight requests get cut off abruptly.

const shutdown = async (signal) => {
  logger.info(`${signal} received — shutting down gracefully`);

  server.close(async () => {
    logger.info("HTTP server closed");

    await disconnectPrisma();

    logger.info("Process exiting");
    process.exit(0);
  });

  // Force exit after 10 seconds if graceful shutdown hangs
  setTimeout(() => {
    logger.error("Forced shutdown after timeout");
    process.exit(1);
  }, 10_000);
};

process.on("SIGTERM", () => shutdown("SIGTERM")); // Sent by hosting platforms (Railway, Render etc) to stop the app
process.on("SIGINT", () => shutdown("SIGINT"));   // Ctrl+C in terminal

// ─── Process-Level Error Handlers ────────────────────────────────────────────
// Catches errors that escape Express entirely —
// e.g. errors in background jobs, setTimeouts, or event emitters

// Unhandled promise rejection — e.g. forgot to await, or a promise outside Express rejects
process.on("unhandledRejection", (reason) => {
  logger.error("Unhandled Promise Rejection — shutting down", {
    message: reason?.message || String(reason),
    stack: reason?.stack,
  });

  // Give the server a chance to finish in-flight requests, then exit
  server.close(() => process.exit(1));
});

// Uncaught synchronous exception — app is now in an unknown state, must restart
process.on("uncaughtException", (err) => {
  logger.error("Uncaught Exception — shutting down", {
    message: err.message,
    stack: err.stack,
  });

  process.exit(1);
});