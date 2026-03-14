import { Router } from 'express';
import { getQR, scanQR } from '../controllers/qr.controller.js';
import { requireFaculty } from '../middleware/auth.js';

const router = Router();

// All routes here require verifyJWT (applied at mount-level in app.js).

// GET /api/v1/qr/current
// Both faculty and admin can fetch the current QR image.
// Faculty: used before scanning (confirmation screen)
// Admin:   the kiosk page polls this every 2 seconds
router.get('/current', getQR);

// POST /api/v1/qr/scan
// Only faculty can scan. Admin cannot scan. (requireFaculty enforces this)
router.post('/scan', requireFaculty, scanQR);

export default router;
