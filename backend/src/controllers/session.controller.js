import prisma from '../lib/prisma.js';

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
        prisma.session.count({ where: { facultyId: req.user.id } }),
    ]);

    res.json({ sessions, total, limit, offset });
  } catch (err) {
    next(err);
  }
}

export async function getAllSessions(req, res, next) {
  try {
    const { facultyId, active } = req.query;

    const where = {};
    if (facultyId) where.facultyId = facultyId;
    if (active === 'true') where.endTime = null;  

    const sessions = await prisma.session.findMany({
      where,
      include: {
        faculty: { select: { name: true, email: true, dept: true } },
      },
      orderBy: { startTime: 'desc' },
    });

    res.json(sessions);
  } catch (err) {
    next(err);
  }
}

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
