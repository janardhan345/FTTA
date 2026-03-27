import { Router } from 'express';
import {
  getMySessions,
  getAllSessions,
  getActiveSessions,
} from '../controllers/session.controller.js';
import { requireAdmin, requireFaculty } from '../middleware/auth.js';

const router = Router();

router.get('/my',     requireFaculty, getMySessions);
router.get('/active', requireAdmin, getActiveSessions);
router.get('/',       requireAdmin, getAllSessions);

export default router;
