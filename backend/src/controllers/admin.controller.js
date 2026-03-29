import prisma from '../lib/prisma.js';

export async function getFacultyAvailability(req, res, next) {
  try {
    const faculty = await prisma.faculty.findMany({
      include: {
        attendances: {
          orderBy: { checkinTime: 'desc' },
          take: 1,
          select: { checkinTime: true, checkoutTime: true },
        },
        sessions: {
          where:  { endTime: null },
          select: { id: true, startTime: true },
        },
        _count: { select: { students: true } },
      },
      orderBy: { name: 'asc' },
    });

    const availability = faculty.map(f => {
      const isCheckedIn = f.attendances.length > 0 && !f.attendances[0].checkoutTime;
      const hasActiveSession = f.sessions.length > 0;

      return {
        id:              f.id,
        name:            f.name,
        email:           f.email,
        dept:            f.dept,
        studentCount:    f._count.students,
        status:          isCheckedIn && !hasActiveSession ? 'available' : 'busy',
        activeSessionId: f.sessions[0]?.id ?? null,
        sessionStartAt:  f.sessions[0]?.startTime ?? null,
      };
    });

    res.json(availability);
  } catch (err) {
    next(err);
  }
}

export async function reassignStudent(req, res, next) {
  try {
    const { studentId, newFacultyId } = req.body;

    if (!studentId || !newFacultyId) {
      return res.status(400).json({ error: 'studentId and newFacultyId are required' });
    }

    // Confirming whether the new faculty exists before assigning
    const faculty = await prisma.faculty.findUnique({ where: { id: newFacultyId } });
    if (!faculty) {
      return res.status(404).json({ error: 'Target faculty not found' });
    }

    const student = await prisma.student.update({
      where: { id: studentId },
      data:  { facultyId: newFacultyId },
      include: { faculty: { select: { name: true } } },
    });

    res.json(student);
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Student not found' });
    }
    next(err);
  }
}

// Dashboard summary numbers shown at the top of the admin page.
// Uses Promise.all to run all queries in parallel — much faster than sequential awaits.
export async function getStats(req, res, next) {
  try {
    const [totalFaculty, totalStudents, totalSessions, activeSessions] = await Promise.all([
      prisma.faculty.count(),
      prisma.student.count(),
      prisma.session.count(),
      prisma.session.count({ where: { endTime: null } }),
    ]);

    res.json({
      totalFaculty,
      totalStudents,
      totalSessions,
      activeSessions,
    });
  } catch (err) {
    next(err);
  }
}
