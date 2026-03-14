import { Router } from 'express';
import {
  getMySessions,
  getAllSessions,
  getActiveSessions,
} from '../controllers/session.controller.js';
import { requireAdmin, requireFaculty } from '../middleware/auth.js';

const router = Router();

// All routes here require verifyJWT (applied at mount-level in app.js).

// GET /api/v1/sessions/my  — faculty's own sessions
// IMPORTANT: this route must be defined BEFORE /:id routes
// because Express matches routes in order — "my" would be treated as an id otherwise
router.get('/my',     requireFaculty, getMySessions);

// GET /api/v1/sessions/active — admin: sessions with no endTime
router.get('/active', requireAdmin, getActiveSessions);

// GET /api/v1/sessions — admin: all sessions with optional filters
router.get('/',       requireAdmin, getAllSessions);

export default router;
