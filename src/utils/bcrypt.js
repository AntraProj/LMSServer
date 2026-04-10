import bcrypt from "bcrypt";

//Generate hashed password.
export function generatePasswordHash(password) {
  return bcrypt.hash(password, 12);
}

//Compare password with hashed password.
export function validatePasswordHash(password, passwordHash) {
  return bcrypt.compare(password, passwordHash);
}
