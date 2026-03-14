import { verifyToken } from '../config/jwt.js';

// verifyJWT middleware — runs first on every protected route.
//
// What it does:
//   1. Reads the Authorization header: "Bearer eyJ..."
//   2. Extracts the token (the part after "Bearer ")
//   3. Verifies the signature and expiry using your JWT_SECRET
//   4. Attaches the decoded payload to req.user
//   5. Calls next() to continue to the route handler
//
// Convention: "Bearer" is the standard HTTP auth scheme for tokens.
// The client must send: Authorization: Bearer <token>
export function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;

  // No Authorization header at all
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  // Extract everything after "Bearer "
  // "Bearer eyJhbG..." → "eyJhbG..."
  const token = authHeader.slice(7);

  try {
    // jwt.verify throws if the token is invalid, expired, or tampered with.
    // If it succeeds, it returns the decoded payload.
    req.user = verifyToken(token);
    // req.user is now: { id, email, name, role, dept, iat, exp }
    next(); // proceed to the route handler
  } catch (err) {
    // Token is bad — don't reveal WHY to the client (security)
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// requireAdmin — ALWAYS use this AFTER verifyJWT.
// verifyJWT must run first so that req.user is populated.
//
// Usage in routes:
//   router.get('/faculty', verifyJWT, requireAdmin, controller)
//   or mount-level: app.use('/api/v1/faculty', verifyJWT, requireAdmin, router)
export function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') {
    // 403 Forbidden: you're authenticated but not authorized for this action
    // 401 Unauthorized would be wrong here — the token is valid, just wrong role
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

// requireFaculty — ALWAYS use this AFTER verifyJWT.
export function requireFaculty(req, res, next) {
  if (req.user?.role !== 'faculty') {
    return res.status(403).json({ error: 'Faculty access required' });
  }
  next();
}
