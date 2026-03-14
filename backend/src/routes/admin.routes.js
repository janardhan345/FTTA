import { Router } from 'express';
import {
  getFacultyAvailability,
  reassignStudent,
  getStats,
} from '../controllers/admin.controller.js';

const router = Router();

// All routes here are already protected by [verifyJWT, requireAdmin]
// applied at mount-level in app.js.

router.get('/availability', getFacultyAvailability); // GET   /api/v1/admin/availability
router.patch('/assign',     reassignStudent);         // PATCH /api/v1/admin/assign
router.get('/stats',        getStats);               // GET   /api/v1/admin/stats

export default router;
