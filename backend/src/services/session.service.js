import prisma from '../lib/prisma.js';
import { validateQRType } from './qr.service.js';
import { toggleAttendance } from './attendance.service.js';

export async function handleQRScan(facultyId, scannedToken) {
  // Determine if this is an attendance or session QR
  const qrType = await validateQRType(scannedToken);

  if (qrType === 'ATTENDANCE') {
    return await handleAttendanceScan(facultyId);
  } else if (qrType === 'SESSION') {
    return await handleSessionScan(facultyId, scannedToken);
  }
}

export async function handleAttendanceScan(facultyId) {
  return await toggleAttendance(facultyId);
}

export async function handleSessionScan(facultyId, qrToken) {
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
        startTime: new Date(),
        qrToken,
      },
    });
    action = 'START';
  } else {
    session = await prisma.session.update({
      where: { id: activeSession.id },
      data: { endTime: new Date() },
    });
    action = 'END';
  }

  return { action, session };
}
