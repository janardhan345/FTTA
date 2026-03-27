import crypto from 'crypto';
import QRCode from 'qrcode';
import prisma from '../lib/prisma.js';
import { env } from '../config/env.js';

export async function generateAndSaveQR() {

  const token     = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + env.QR_EXPIRY_MINUTES * 60 * 1000);

  const activeQR = await prisma.activeQR.upsert({
    where:  { id: 1 },
    update: { token, expiresAt },
    create: { token, expiresAt },
  });

  return activeQR;
}

export async function getCurrentQRImage() {
  let activeQR = await prisma.activeQR.findUnique({ where: { id: 1 } });

  if (!activeQR) {
    activeQR = await generateAndSaveQR();
  }

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

export async function validateQRToken(scannedToken) {
  const activeQR = await prisma.activeQR.findUnique({ where: { id: 1 } });

  if (!activeQR) {
    const err = new Error('No active QR code exists yet');
    err.status = 400;
    throw err;
  }

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
