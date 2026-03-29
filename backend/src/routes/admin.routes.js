import { Router } from 'express';
import {
	getDeletedRecords,
	getFacultyAvailability,
	getStats,
	reassignStudent,
	restoreDeletedFaculty,
	restoreDeletedStudent,
} from '../controllers/admin.controller.js';

const router = Router();

router.get('/availability', getFacultyAvailability); 
router.patch('/assign', reassignStudent);         
router.get('/stats', getStats);            
router.get('/deleted', getDeletedRecords);
router.patch('/deleted/students/:id/restore', restoreDeletedStudent);
router.patch('/deleted/faculty/:id/restore', restoreDeletedFaculty);

export default router;
