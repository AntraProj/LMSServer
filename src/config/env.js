import dotenv from "dotenv";

dotenv.config();

const requiredEnvVars = [
    "NODE_ENV",
    "PORT",
    "DATABASE_URL",
    "JWT_SECRET_KEY",
    "CORS_ORIGINS",
];

const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);

if (missingVars.length > 0) {
    console.error(`Missing required environment variables: ${missingVars.join(", ")}`);
    console.error("Fix the above in your .env file and restart.");
    process.exit(1);
}


const nodeEnv = process.env.NODE_ENV

export const isDev = nodeEnv === "development";
export const isTest = nodeEnv === "test";
export const isProd = nodeEnv === "production";

export const env = {
    nodeEnv,
    port: process.env.PORT,

    databaseUrl: process.env.DATABASE_URL,

    jwtSecretKey: process.env.JWT_SECRET_KEY,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN,

    adminEmail: process.env.ADMIN_EMAIL,
    adminPassword: process.env.ADMIN_PASSWORD,
    adminPasswordHash: process.env.ADMIN_PASSWORD_HASH,
    adminFullName: process.env.ADMIN_FULL_NAME,

    corsOrigin: process.env.CORS_ORIGINS,

    logLevel: process.env.LOG_LEVEL,
    logDir: process.env.LOG_DIR,

};