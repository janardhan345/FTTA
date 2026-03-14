import prisma from '../lib/prisma.js';
import { validateQRToken, generateAndSaveQR } from './qr.service.js';

// handleQRScan — the heart of the application.
// Called every time a faculty member scans the kiosk QR from their phone.
//
// The logic is simple:
//   - Does this faculty have an ACTIVE session right now? (endTime IS NULL)
//     YES → this scan ENDS the session. Set endTime = now.
//     NO  → this scan STARTS a new session. Create a Session row with startTime = now.
//
// After either action, the QR is immediately rotated (new token generated).
// This prevents the same QR from being scanned twice.
export async function handleQRScan(facultyId, scannedToken) {
  // Step 1: Validate the token. Throws 400 if invalid or expired.
  const activeQR = await validateQRToken(scannedToken);

  // Step 2: Look for this faculty's active session (endTime = null means active)
  const activeSession = await prisma.session.findFirst({
    where: {
      facultyId,
      endTime: null,
    },
  });

  let session;
  let action;

  if (!activeSession) {
    // ── No active session: START a new one ─────────────────────────────────
    // We record the qrToken and qrExpiresAt from the activeQR for audit purposes.
    // This creates a permanent record of WHICH QR scan created this session.
    session = await prisma.session.create({
      data: {
        facultyId,
        startTime:   new Date(),
        qrToken:     activeQR.token,
        qrExpiresAt: activeQR.expiresAt,
        // endTime is NOT set — null means this session is currently active
      },
    });
    action = 'START';
  } else {
    // ── Active session found: END it ────────────────────────────────────────
    session = await prisma.session.update({
      where: { id: activeSession.id },
      data:  { endTime: new Date() },
    });
    action = 'END';
  }

  // Step 3: Rotate the QR NOW — after saving the session, not before.
  // Reason: if QR rotation fails, the session is still correctly saved.
  // If we rotated before saving, a rotation failure would leave the system
  // in a half-done state with no clear path to recover.
  await generateAndSaveQR();

  return { action, session };
}
