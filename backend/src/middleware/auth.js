import { verifyToken } from '../config/jwt.js';

export function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.slice(7);

  try {
    req.user = verifyToken(token);
    next(); // proceed to the route handler
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

export function requireFaculty(req, res, next) {
  if (req.user?.role !== 'faculty') {
    return res.status(403).json({ error: 'Faculty access required' });
  }
  next();
}
