import { getCurrentQRImage } from '../services/qr.service.js';
import { handleQRScan } from '../services/session.service.js';

// GET /api/v1/qr/current
// Used by:
//   1. The kiosk page (admin's dedicated browser tab) — polls every 2 seconds
//      to get the latest QR image and re-render it after each faculty scan
//   2. The faculty's scan page — not strictly needed there, but can be used
//      to show the current QR as a reference before the camera opens
export async function getQR(req, res, next) {
  try {
    const data = await getCurrentQRImage();
    res.json(data);
  } catch (err) {
    next(err);
  }
}

// POST /api/v1/qr/scan
// Called by the faculty's phone after scanning the kiosk QR.
// Body: { token: "64-char-hex-string" }
//
// Returns: { action: "START" | "END", session: { ... } }
//   "START" means the faculty just started a counselling session
//   "END"   means they just ended one
//
// After returning, the QR on the kiosk has already been rotated — the old token
// is gone. The kiosk's next poll will show the new QR.
export async function scanQR(req, res, next) {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'token is required in request body' });
    }

    // req.user.id is the faculty's Google sub ID, set by verifyJWT middleware
    const result = await handleQRScan(req.user.id, token);

    res.json(result);
  } catch (err) {
    next(err);
  }
}
