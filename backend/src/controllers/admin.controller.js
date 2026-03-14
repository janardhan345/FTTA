import prisma from '../lib/prisma.js';

// GET /api/v1/admin/availability
// The main admin dashboard data: show every faculty member with their current status.
// status = "busy"      → they have a session where endTime IS NULL (in a session right now)
// status = "available" → no active session
//
// This is the query the admin dashboard will poll every few seconds to stay current.
export async function getFacultyAvailability(req, res, next) {
  try {
    const faculty = await prisma.faculty.findMany({
      include: {
        // Fetch active sessions (endTime = null) for each faculty
        sessions: {
          where:  { endTime: null },
          select: { id: true, startTime: true },
        },
        _count: { select: { students: true } },
      },
      orderBy: { name: 'asc' },
    });

    const availability = faculty.map(f => ({
      id:              f.id,
      name:            f.name,
      email:           f.email,
      dept:            f.dept,
      studentCount:    f._count.students,
      // If there's at least one active session, they are busy
      status:          f.sessions.length > 0 ? 'busy' : 'available',
      // The id of their current session (null if not in session)
      // Useful if admin wants to look up session details
      activeSessionId: f.sessions[0]?.id ?? null,
      // When the session started (so admin knows how long they've been in)
      sessionStartAt:  f.sessions[0]?.startTime ?? null,
    }));

    res.json(availability);
  } catch (err) {
    next(err);
  }
}

// PATCH /api/v1/admin/assign
// Reassign a student from one faculty to another.
// Body: { studentId, newFacultyId }
//
// Common scenario: admin wants to move a student to an available faculty.
export async function reassignStudent(req, res, next) {
  try {
    const { studentId, newFacultyId } = req.body;

    if (!studentId || !newFacultyId) {
      return res.status(400).json({ error: 'studentId and newFacultyId are required' });
    }

    // Confirm the new faculty exists before assigning
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

// GET /api/v1/admin/stats
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

    // Calculate average session duration from all COMPLETED sessions
    // (endTime is not null = session has ended)
    const completedSessions = await prisma.session.findMany({
      where:  { endTime: { not: null } },
      select: { startTime: true, endTime: true },
    });

    // Duration in minutes for each completed session, then average
    const avgSessionDurationMinutes = completedSessions.length > 0
      ? Math.round(
          completedSessions.reduce((sum, s) => {
            // Prisma returns Date objects; subtract to get milliseconds
            return sum + (s.endTime - s.startTime) / 60_000;
          }, 0) / completedSessions.length
        )
      : 0;

    res.json({
      totalFaculty,
      totalStudents,
      totalSessions,
      activeSessions,
      avgSessionDurationMinutes,
    });
  } catch (err) {
    next(err);
  }
}
