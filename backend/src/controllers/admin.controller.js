import prisma from '../lib/prisma.js';
import {
  getFacultyStatusById,
  resolveFacultyStatus,
} from '../services/facultyAvailability.service.js';
import { pushAssignmentNotification } from '../lib/assignmentNotifications.js';

export async function getFacultyAvailability(req, res, next) {
  try {
    const faculty = await prisma.faculty.findMany({
      where: { deletedAt: null },
      include: {
        attendances: {
          orderBy: { checkinTime: 'desc' },
          take: 1,
          select: { checkinTime: true, checkoutTime: true },
        },
        students: {
          where: { deletedAt: null },
          select: { id: true },
        },
        sessions: {
          where:  { endTime: null },
          select: { id: true, startTime: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    const availability = faculty.map(f => {
      const isCheckedIn = f.attendances.length > 0 && !f.attendances[0].checkoutTime;
      const hasActiveSession = f.sessions.length > 0;
      const status = resolveFacultyStatus({ isCheckedIn, hasActiveSession });

      return {
        id:              f.id,
        name:            f.name,
        email:           f.email,
        dept:            f.dept,
        studentCount:    f.students.length,
        status,
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

    const existingStudent = await prisma.student.findFirst({
      where: { id: studentId, deletedAt: null },
      select: { id: true, facultyId: true, name: true },
    });

    if (!existingStudent) {
      return res.status(404).json({ error: 'Student not found' });
    }

    if (existingStudent.facultyId === newFacultyId) {
      return res.status(400).json({ error: 'Student is already assigned to this faculty' });
    }

    // Confirming whether the new faculty exists before assigning
    const faculty = await prisma.faculty.findFirst({ where: { id: newFacultyId, deletedAt: null } });
    if (!faculty) {
      return res.status(404).json({ error: 'Target faculty not found' });
    }

    const targetFacultyStatus = await getFacultyStatusById(newFacultyId);
    if (targetFacultyStatus !== 'available') {
      return res.status(400).json({
        error: `Target faculty is currently ${targetFacultyStatus}. Only available faculty can be assigned.`,
      });
    }

    const student = await prisma.student.update({
      where: { id: studentId },
      data:  { facultyId: newFacultyId },
      include: { faculty: { select: { name: true } } },
    });

    pushAssignmentNotification({
      facultyId: newFacultyId,
      studentId: student.id,
      studentName: student.name || existingStudent.name,
      type: 'REASSIGNED',
      assignedBy: req.user?.id,
    });

    res.json(student);
  } catch (err) {
    next(err);
  }
}

// Dashboard summary numbers shown at the top of the admin page.
// Uses Promise.all to run all queries in parallel — much faster than sequential awaits.
export async function getStats(req, res, next) {
  try {
    const [totalFaculty, totalStudents, totalSessions, activeSessions] = await Promise.all([
      prisma.faculty.count({ where: { deletedAt: null } }),
      prisma.student.count({ where: { deletedAt: null } }),
      prisma.session.count({ where: { faculty: { deletedAt: null } } }),
      prisma.session.count({ where: { endTime: null, faculty: { deletedAt: null } } }),
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

export async function getDeletedRecords(req, res, next) {
  try {
    const [deletedStudents, deletedFaculty] = await Promise.all([
      prisma.student.findMany({
        where: { deletedAt: { not: null } },
        select: {
          id: true,
          name: true,
          dept: true,
          deletedAt: true,
          facultyId: true,
          faculty: {
            select: { id: true, name: true, deletedAt: true },
          },
        },
        orderBy: { deletedAt: 'desc' },
      }),
      prisma.faculty.findMany({
        where: { deletedAt: { not: null } },
        select: {
          id: true,
          name: true,
          email: true,
          dept: true,
          deletedAt: true,
        },
        orderBy: { deletedAt: 'desc' },
      }),
    ]);

    res.json({ deletedStudents, deletedFaculty });
  } catch (err) {
    next(err);
  }
}

export async function restoreDeletedStudent(req, res, next) {
  try {
    const student = await prisma.student.findFirst({
      where: { id: req.params.id, deletedAt: { not: null } },
      select: { id: true, facultyId: true, name: true },
    });

    if (!student) {
      return res.status(404).json({ error: 'Deleted student not found' });
    }

    const faculty = await prisma.faculty.findFirst({
      where: { id: student.facultyId, deletedAt: null },
      select: { id: true },
    });

    if (!faculty) {
      return res.status(400).json({
        error: 'Cannot restore student because the assigned faculty is deleted. Restore faculty first.',
      });
    }

    const restored = await prisma.student.update({
      where: { id: req.params.id },
      data: { deletedAt: null },
      include: { faculty: { select: { id: true, name: true } } },
    });

    res.json(restored);
  } catch (err) {
    next(err);
  }
}

export async function restoreDeletedFaculty(req, res, next) {
  try {
    const faculty = await prisma.faculty.findFirst({
      where: { id: req.params.id, deletedAt: { not: null } },
      select: { id: true },
    });

    if (!faculty) {
      return res.status(404).json({ error: 'Deleted faculty not found' });
    }

    const restored = await prisma.faculty.update({
      where: { id: req.params.id },
      data: { deletedAt: null },
    });

    res.json(restored);
  } catch (err) {
    next(err);
  }
}
