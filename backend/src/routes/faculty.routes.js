import { Router } from 'express';
import {
  getAllFaculty,
  createFaculty,
  getFacultyById,
  updateFaculty,
  deleteFaculty,
} from '../controllers/faculty.controller.js';

const router = Router();

// All routes here are already protected by [verifyJWT, requireAdmin]
// applied at mount-level in app.js — no need to repeat middleware per route.

router.get('/',     getAllFaculty);    // GET  /api/v1/faculty
router.post('/',    createFaculty);   // POST /api/v1/faculty
router.get('/:id',  getFacultyById);  // GET  /api/v1/faculty/:id
router.patch('/:id', updateFaculty);  // PATCH /api/v1/faculty/:id
router.delete('/:id', deleteFaculty); // DELETE /api/v1/faculty/:id

export default router;
