import prisma from '../lib/prisma.js';

export async function getAllFaculty(req, res, next) {
  try {
    const faculty = await prisma.faculty.findMany({
      include: {
        // _count gives us aggregate counts without fetching all rows
        _count: { select: { students: true, sessions: true } },
        // Fetch only active sessions (endTime = null) — just the id field
        sessions: {
          where:  { endTime: null },
          select: { id: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    // Shape the response to a clean, flat object (no Prisma internals exposed)
    const result = faculty.map(f => ({
      id:            f.id,
      name:          f.name,
      email:         f.email,
      dept:          f.dept,
      studentCount:  f._count.students,
      sessionCount:  f._count.sessions,
      isInSession:   f.sessions.length > 0,   // true if there's an active session
      createdAt:     f.createdAt,
    }));

    res.json(result);
  } catch (err) {
    next(err);
  }
}

// POST /api/v1/faculty
// Pre-register a faculty before they log in.
// When they do log in via Google OAuth, passport.js will upsert their record,
// updating the placeholder id to their real Google sub ID.
export async function createFaculty(req, res, next) {
  try {
    const { name, email, dept } = req.body;

    if (!name || !email || !dept) {
      return res.status(400).json({ error: 'name, email, and dept are required' });
    }

    const faculty = await prisma.faculty.create({
      data: {
        // Use a placeholder id. passport.js will replace this with their Google sub
        // on first login via upsert({ where: { email }, update: { id: googleId } })
        id:   crypto.randomUUID(),
        name,
        email,
        dept,
      },
    });

    res.status(201).json(faculty);
  } catch (err) {
    // P2002 = Prisma unique constraint violation
    // This means a faculty with this email already exists
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'A faculty with this email already exists' });
    }
    next(err);
  }
}

// GET /api/v1/faculty/:id
export async function getFacultyById(req, res, next) {
  try {
    const faculty = await prisma.faculty.findUnique({
      where:   { id: req.params.id },
      include: {
        students: { orderBy: { name: 'asc' } },
        _count:   { select: { sessions: true } },
      },
    });

    if (!faculty) {
      return res.status(404).json({ error: 'Faculty not found' });
    }

    res.json(faculty);
  } catch (err) {
    next(err);
  }
}

// PATCH /api/v1/faculty/:id
// Only name and dept can be updated. Email and id come from Google — they are immutable.
export async function updateFaculty(req, res, next) {
  try {
    const { name, dept } = req.body;

    // Build the update object only with fields that were actually sent
    // (don't accidentally wipe a field by setting it to undefined)
    const data = {};
    if (name) data.name = name;
    if (dept) data.dept = dept;

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ error: 'Provide at least one field to update: name, dept' });
    }

    const faculty = await prisma.faculty.update({
      where: { id: req.params.id },
      data,
    });

    res.json(faculty);
  } catch (err) {
    // P2025 = record to update not found
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Faculty not found' });
    }
    next(err);
  }
}

// DELETE /api/v1/faculty/:id
// Cascade is defined in the Prisma schema (onDelete: Cascade on Student and Session).
// Deleting a faculty automatically deletes all their students and sessions in the DB.
export async function deleteFaculty(req, res, next) {
  try {
    await prisma.faculty.delete({ where: { id: req.params.id } });
    // 204 No Content — successful deletion, nothing to return
    res.status(204).send();
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Faculty not found' });
    }
    next(err);
  }
}
