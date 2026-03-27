import { Router } from 'express';
import { getQR, scanQR } from '../controllers/qr.controller.js';
import { requireFaculty } from '../middleware/auth.js';

const router = Router();

router.get('/current', getQR);

router.post('/scan', requireFaculty, scanQR);

export default router;
