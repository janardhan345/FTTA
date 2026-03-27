import prisma from '../lib/prisma.js';
import { validateQRToken, generateAndSaveQR } from './qr.service.js';

export async function handleQRScan(facultyId, scannedToken) {
  const activeQR = await validateQRToken(scannedToken);

  const activeSession = await prisma.session.findFirst({
    where: {
      facultyId,
      endTime: null,
    },
  });

  let session;
  let action;

  if (!activeSession) {
    session = await prisma.session.create({
      data: {
        facultyId,
        startTime:   new Date(),
        qrToken:     activeQR.token,
        qrExpiresAt: activeQR.expiresAt,
      },
    });
    action = 'START';
  } else {
    session = await prisma.session.update({
      where: { id: activeSession.id },
      data:  { endTime: new Date() },
    });
    action = 'END';
  }

  await generateAndSaveQR();

  return { action, session };
}
