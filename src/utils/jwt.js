import jwt from "jsonwebtoken";

export function generateAuthToken({ email, fullName }) {
  return jwt.sign(
    {
      email: email,
      fullName: fullName,
    },
    process.env.SECRET_KEY,
  );
}
