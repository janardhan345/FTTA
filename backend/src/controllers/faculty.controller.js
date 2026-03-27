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

export async function createFaculty(req, res, next) {
  try {
    const { name, email, dept } = req.body;

    if (!name || !email || !dept) {
      return res.status(400).json({ error: 'name, email, and dept are required' });
    }

    const faculty = await prisma.faculty.create({
      data: {
        id:   crypto.randomUUID(),
        name,
        email,
        dept,
      },
    });

    res.status(201).json(faculty);
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'A faculty with this email already exists' });
    }
    next(err);
  }
}

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

export async function updateFaculty(req, res, next) {
  try {
    const { name, dept } = req.body;

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
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Faculty not found' });
    }
    next(err);
  }
}

export async function deleteFaculty(req, res, next) {
  try {
    await prisma.faculty.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Faculty not found' });
    }
    next(err);
  }
}
