import { getCurrentQRs } from '../services/qr.service.js';
import { handleQRScan } from '../services/session.service.js';

export async function getQR(req, res, next) {
  try {
    const data = await getCurrentQRs();
    res.json(data);
  } catch (err) {
    next(err);
  }
}

export async function scanQR(req, res, next) {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'token is required in request body' });
    }

    const result = await handleQRScan(req.user.id, token);

    res.json(result);
  } catch (err) {
    next(err);
  }
}
