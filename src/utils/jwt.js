import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export function generateAuthToken(payload) {
  if (!env.jwtSecretKey) {
    throw new Error("JWT Secret Key is missing in environment configuration");
  }
  if (!env.jwtExpiresIn) {
    throw new Error("JWT Expires In is missing in environment configuration");
  }

  return jwt.sign(
    payload,
    env.jwtSecretKey,
    { expiresIn: env.jwtExpiresIn, algorithm: "HS256"}
  );
}

export function verifyAuthToken(token) {
  if (!env.jwtSecretKey) {
    throw new Error("JWT Secret Key is missing in environment configuration");
  }

  return jwt.verify(token, env.jwtSecretKey);
}
