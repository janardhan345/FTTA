import { Router } from 'express';
import {
  getStudents,
  createStudent,
  getStudentById,
  updateStudent,
  deleteStudent,
} from '../controllers/student.controller.js';
import { requireAdmin } from '../middleware/auth.js';

const router = Router();

// All routes here require verifyJWT (applied at mount-level in app.js).
// Some actions are further restricted to admin-only via requireAdmin.

router.get('/',       getStudents);                   // GET  /api/v1/students
router.post('/',      requireAdmin, createStudent);   // POST /api/v1/students
router.get('/:id',    getStudentById);                // GET  /api/v1/students/:id
router.patch('/:id',  updateStudent);                 // PATCH /api/v1/students/:id
router.delete('/:id', requireAdmin, deleteStudent);   // DELETE /api/v1/students/:id

export default router;
