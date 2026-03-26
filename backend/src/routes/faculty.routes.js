import { Router } from 'express';
import { requireAdmin } from '../middleware/auth.js';
import {
  getAllFaculty,
  createFaculty,
  getFacultyById,
  updateFaculty,
  deleteFaculty,
} from '../controllers/faculty.controller.js';

const router = Router();

router.get('/',     getAllFaculty);                  // GET  /api/v1/faculty
router.post('/',    requireAdmin, createFaculty);   // POST /api/v1/faculty (admin only)
router.get('/:id',  getFacultyById);                // GET  /api/v1/faculty/:id
router.patch('/:id', requireAdmin, updateFaculty);  // PATCH /api/v1/faculty/:id (admin only)
router.delete('/:id', requireAdmin, deleteFaculty); // DELETE /api/v1/faculty/:id (admin only)

export default router;
