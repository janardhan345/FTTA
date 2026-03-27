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

router.get('/',     getAllFaculty);                 
router.post('/',    requireAdmin, createFaculty);  
router.get('/:id',  getFacultyById);                
router.patch('/:id', requireAdmin, updateFaculty);  
router.delete('/:id', requireAdmin, deleteFaculty); 

export default router;
