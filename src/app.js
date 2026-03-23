import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { AppError } from './utils/AppError.js';
import { requestLogger } from './middlewares/requestLogger.middleware.js';
import { errorHandler } from './middlewares/error.middleware.js';
import { corsOptions } from './config/cors.js';

const app = express();


// ─── Security ─────────────────────────────────────────────────────────────────
app.use(helmet());

// ─── CORS ─────────────────────────────────────────────────────────────────────
// Must be before all routes
app.use(cors(corsOptions));

// ─── HTTP Request Logging ─────────────────────────────────────────────────────
// Morgan → Winston — logs every request automatically
app.use(requestLogger);

// ─── Body Parsing ─────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.send('LMS Backend running! Use /health for status.');
});

// ─── Health Check ─────────────────────────────────────────────────────────────
// Excluded from request logs (see requestLogger.js skip option)
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// ─── Routes ───────────────────────────────────────────────────────────────────
// Register your API routes here, e.g.:

// ─── 404 Handler ──────────────────────────────────────────────────────────────
// Catches requests to routes that don't exist
app.all("{*splat}", (req, res, next) => {
  next(new AppError(`Route ${req.method} ${req.originalUrl} not found.`, 404));
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
// MUST be last — after all routes and middleware
app.use(errorHandler);

export default app;
