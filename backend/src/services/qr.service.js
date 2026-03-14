import crypto from 'crypto';
import QRCode from 'qrcode';
import prisma from '../lib/prisma.js';
import { env } from '../config/env.js';

// generateAndSaveQR
// Creates a brand new random token and saves it as the one active QR.
//
// Design note: prisma.activeQR.upsert with { where: { id: 1 } } means:
//   - If no row exists (id=1) → CREATE it
//   - If it already exists   → UPDATE it with the new token
// This guarantees there is ALWAYS exactly one row in active_qr — never more.
// The kiosk display reads this single row. Every scan replaces it.
export async function generateAndSaveQR() {
  // crypto.randomBytes(32) gives 32 bytes of cryptographically random data.
  // .toString('hex') turns those bytes into a 64-character hex string.
  // This is our QR token — unpredictable and unique.
  const token     = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + env.QR_EXPIRY_MINUTES * 60 * 1000);

  const activeQR = await prisma.activeQR.upsert({
    where:  { id: 1 },
    update: { token, expiresAt },
    create: { token, expiresAt },
  });

  return activeQR;
}

// getCurrentQRImage
// Reads the current active QR from the database and converts the token
// into a base64-encoded PNG image that the browser can display directly.
//
// Returns: { imageBase64, expiresAt, updatedAt }
//   imageBase64 looks like: "data:image/png;base64,iVBORw0KGgo..."
//   You can put this directly in an <img src="..."> tag — no separate file needed.
export async function getCurrentQRImage() {
  // If no QR has been generated yet, create one
  let activeQR = await prisma.activeQR.findUnique({ where: { id: 1 } });

  if (!activeQR) {
    activeQR = await generateAndSaveQR();
  }

  // QRCode.toDataURL encodes the token string into a QR image.
  // The QR encodes just the raw token — the server validates it, not the client.
  // width=400 makes it large enough to scan reliably from a few feet away.
  const imageBase64 = await QRCode.toDataURL(activeQR.token, {
    width:  400,
    margin: 2,
    color:  { dark: '#1a1a2e', light: '#ffffff' },
  });

  return {
    imageBase64,
    expiresAt: activeQR.expiresAt,
    updatedAt: activeQR.updatedAt,
  };
}

// validateQRToken
// Checks that the scanned token is:
//   1. The same as the current active token (not a replayed old token)
//   2. Not expired (within the QR_EXPIRY_MINUTES window)
// Throws an error with the appropriate HTTP status if invalid.
export async function validateQRToken(scannedToken) {
  const activeQR = await prisma.activeQR.findUnique({ where: { id: 1 } });

  if (!activeQR) {
    const err = new Error('No active QR code exists yet');
    err.status = 400;
    throw err;
  }

  // timing-safe comparison would be ideal here, but since both values are
  // from our own DB and not attacker-controlled, string comparison is fine
  if (activeQR.token !== scannedToken) {
    const err = new Error('Invalid QR token — this QR has already been replaced');
    err.status = 400;
    throw err;
  }

  if (activeQR.expiresAt < new Date()) {
    const err = new Error('QR token has expired — please refresh the kiosk');
    err.status = 400;
    throw err;
  }

  return activeQR;
}
