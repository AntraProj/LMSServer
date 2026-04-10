import { env, isDev } from "./env.js";
import { logger } from "./logger.js";
import { AppError } from "../utils/AppError.js";

const allowedOrigins = (env.corsOrigin)
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

export const corsOptions = {
    origin: (requestOrigin, callback) => {
        if (!requestOrigin) return callback(null, true);

        if (isDev) return callback(null, true);

        if (allowedOrigins.includes(requestOrigin)) {
            return callback(null, true);
        }

        logger.warn(`CORS: Blocked request from origin "${requestOrigin}"`);
        callback(new AppError(`CORS: Origin "${requestOrigin}" is not allowed`, 403));
    },

    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],

    allowedHeaders: [
        "Content-Type",
        "Authorization",
        "X-Requested-With",
        "Accept",
    ],

    credentials: true,
    maxAge: 3600,
    preflightContinue: false,
    optionsSuccessStatus: 204,
};