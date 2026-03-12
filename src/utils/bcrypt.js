import bcrypt from "bcrypt";

//generating hashed password.
export function generatePasswordHash(password) {
  return bcrypt.hash(password, 12);
}

//comparing password with hashed password.
export function validatePasswordHash(password, passwordHash) {
  return bcrypt.compare(password, passwordHash);
}
