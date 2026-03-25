import { Router } from 'express';
import { getFacultyAvailability, reassignStudent, getStats } from '../controllers/admin.controller.js';

const router = Router();

router.get('/availability', getFacultyAvailability); 
router.patch('/assign', reassignStudent);         
router.get('/stats', getStats);            

export default router;
