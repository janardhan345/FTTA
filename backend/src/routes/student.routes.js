import { Router } from 'express';
import {
  getStudents,
  createStudent,
  getMyAssignmentNotifications,
  getStudentById,
  updateStudent,
  deleteStudent,
} from '../controllers/student.controller.js';
import { requireAdmin } from '../middleware/auth.js';

const router = Router();



router.get('/',       getStudents);          
router.post('/',      createStudent);         
router.get('/notifications', getMyAssignmentNotifications);
router.get('/:id',    getStudentById);        
router.patch('/:id',  updateStudent);        
router.delete('/:id', requireAdmin, deleteStudent);         

export default router;
