import jwt from 'jsonwebtoken';
import { env } from './env.js';

// signToken: takes a plain object (the payload) and returns a signed JWT string.
// Called once per login — right after Google OAuth completes.
//
// The payload is whatever you want the token to "remember" about this user.
// We store: id, email, name, role, dept.
// We do NOT store passwords (there are none — we use Google OAuth).
// We do NOT store sensitive data like phone numbers in the token
// because anyone can base64-decode the payload.
export function signToken(payload) {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN, // e.g. "7d" — token becomes invalid after 7 days
  });
}

// verifyToken: takes a JWT string and returns the decoded payload.
// Throws an error if the token is:
//   - tampered with (signature doesn't match)
//   - expired (past the expiresIn date)
//   - malformed (not a valid JWT format)
//
// Called on every protected API request via the auth middleware.
export function verifyToken(token) {
  return jwt.verify(token, env.JWT_SECRET);
  // Returns: { id, email, name, role, dept, iat, exp }
  // iat = issued at (unix timestamp)
  // exp = expires at (unix timestamp)
  // jwt.verify adds these automatically
}
