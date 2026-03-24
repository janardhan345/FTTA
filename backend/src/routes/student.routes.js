import { Router } from 'express';
import {
  getStudents,
  createStudent,
  getStudentById,
  updateStudent,
  deleteStudent,
} from '../controllers/student.controller.js';

const router = Router();

// All routes here require verifyJWT (applied at mount-level in app.js).
// Some actions are further restricted to admin-only via requireAdmin.

router.get('/',       getStudents);           // GET  /api/v1/students
router.post('/',      createStudent);         // POST /api/v1/students (faculty: own only, admin: any)
router.get('/:id',    getStudentById);        // GET  /api/v1/students/:id
router.patch('/:id',  updateStudent);         // PATCH /api/v1/students/:id
router.delete('/:id', deleteStudent);         // DELETE /api/v1/students/:id (faculty: own only, admin: any)

export default router;
