import QRCode from 'qrcode';
import prisma from '../lib/prisma.js';

export async function getCurrentQRs() {
  let activeQR = await prisma.activeQR.findUnique({ where: { id: 1 } });

  if (!activeQR) {
    activeQR = await prisma.activeQR.create({
      data: {
        id: 1,
        attendanceToken: 'FTTA_ATTENDANCE',
        sessionToken: 'FTTA_SESSION',
      },
    });
  }

  const attendanceImage = await QRCode.toDataURL(activeQR.attendanceToken, {
    width: 400,
    margin: 2,
    color: { dark: '#1a1a2e', light: '#ffffff' },
  });

  const sessionImage = await QRCode.toDataURL(activeQR.sessionToken, {
    width: 400,
    margin: 2,
    color: { dark: '#1a1a2e', light: '#ffffff' },
  });

  return {
    attendanceImage,
    sessionImage,
    tokens: {
      attendance: activeQR.attendanceToken,
      session: activeQR.sessionToken,
    },
  };
}

export async function validateQRType(token) {
  const activeQR = await prisma.activeQR.findUnique({ where: { id: 1 } });

  if (!activeQR) {
    const err = new Error('QR system not initialized');
    err.status = 400;
    throw err;
  }

  if (token === activeQR.attendanceToken) {
    return 'ATTENDANCE';
  } else if (token === activeQR.sessionToken) {
    return 'SESSION';
  } else {
    const err = new Error('Invalid QR token');
    err.status = 400;
    throw err;
  }
}
