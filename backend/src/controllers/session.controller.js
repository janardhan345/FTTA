import prisma from '../lib/prisma.js';

// GET /api/v1/sessions/my
// Returns the logged-in faculty's own sessions, newest first.
// Supports pagination via ?limit= and ?offset= query params.
//
// Example: GET /api/v1/sessions/my?limit=10&offset=20
//   Returns sessions 21–30 (for a "load more" / infinite scroll UI)
export async function getMySessions(req, res, next) {
  try {
    const limit  = parseInt(req.query.limit  || '20', 10);
    const offset = parseInt(req.query.offset || '0',  10);

    const [sessions, total] = await Promise.all([
      prisma.session.findMany({
        where:   { facultyId: req.user.id },
        orderBy: { startTime: 'desc' },
        take:    limit,
        skip:    offset,
      }),
      // Get total count so the frontend can show "Showing X of Y sessions"
      prisma.session.count({ where: { facultyId: req.user.id } }),
    ]);

    res.json({ sessions, total, limit, offset });
  } catch (err) {
    next(err);
  }
}

// GET /api/v1/sessions
// Admin only. Returns all sessions across all faculty.
// Supports filters: ?facultyId=  ?active=true
export async function getAllSessions(req, res, next) {
  try {
    const { facultyId, active } = req.query;

    const where = {};
    if (facultyId) where.facultyId = facultyId;
    if (active === 'true') where.endTime = null;   // active = no end time yet

    const sessions = await prisma.session.findMany({
      where,
      include: {
        // Include faculty name so admin can see who each session belongs to
        faculty: { select: { name: true, email: true, dept: true } },
      },
      orderBy: { startTime: 'desc' },
    });

    res.json(sessions);
  } catch (err) {
    next(err);
  }
}

// GET /api/v1/sessions/active
// Admin only. Shortcut for sessions where endTime IS NULL.
// This is the data that drives the real-time availability dashboard.
export async function getActiveSessions(req, res, next) {
  try {
    const sessions = await prisma.session.findMany({
      where:   { endTime: null },
      include: { faculty: { select: { name: true, email: true, dept: true } } },
      orderBy: { startTime: 'asc' },
    });

    res.json(sessions);
  } catch (err) {
    next(err);
  }
}
