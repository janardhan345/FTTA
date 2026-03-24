import prisma from '../lib/prisma.js';

// GET /api/v1/students
// Faculty: only returns students assigned to them (scoped by req.user.id)
// Admin: returns all students across all faculty
//
// This pattern — one endpoint, different behavior by role — is called
// "scoped query". It's cleaner than two separate endpoints.
export async function getStudents(req, res, next) {
  try {
    const where = req.user.role === 'admin'
      ? {}                                  // admin: no filter → all students
      : { facultyId: req.user.id };         // faculty: only their own students

    const students = await prisma.student.findMany({
      where,
      // Include the faculty name so the admin doesn't need a second request
      include: { faculty: { select: { name: true, dept: true } } },
      orderBy: { name: 'asc' },
    });

    res.json(students);
  } catch (err) {
    next(err);
  }
}

// POST /api/v1/students
// Faculty: can only create students assigned to themselves
// Admin: can create students for any faculty
export async function createStudent(req, res, next) {
  try {
    const { name, gender, facultyId, dept, cutOff, community, quota, status } = req.body;

    // Validate required fields
    const missing = ['name', 'gender', 'facultyId', 'dept', 'cutOff', 'community', 'quota', 'status']
      .filter(field => req.body[field] === undefined || req.body[field] === '');
    if (missing.length > 0) {
      return res.status(400).json({ error: `Missing required fields: ${missing.join(', ')}` });
    }

    // Authorization: faculty can only create for themselves
    if (req.user.role === 'faculty' && facultyId !== req.user.id) {
      return res.status(403).json({ error: 'Faculty can only create students for themselves' });
    }

    // Make sure the target faculty actually exists before creating the student
    const faculty = await prisma.faculty.findUnique({ where: { id: facultyId } });
    if (!faculty) {
      return res.status(404).json({ error: `Faculty with id "${facultyId}" not found` });
    }

    const student = await prisma.student.create({
      data: {
        name,
        gender,
        facultyId,
        dept,
        cutOff:    parseFloat(cutOff),    // ensure it's stored as a number
        community,
        quota,
        status,
      },
    });

    res.status(201).json(student);
  } catch (err) {
    next(err);
  }
}

// GET /api/v1/students/:id
// Faculty can only view their own students. Admin can view any.
export async function getStudentById(req, res, next) {
  try {
    const student = await prisma.student.findUnique({
      where:   { id: req.params.id },
      include: { faculty: { select: { name: true, email: true } } },
    });

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Authorization check: a faculty trying to access a student they don't own
    if (req.user.role === 'faculty' && student.facultyId !== req.user.id) {
      return res.status(403).json({ error: 'You do not have access to this student' });
    }

    res.json(student);
  } catch (err) {
    next(err);
  }
}

// PATCH /api/v1/students/:id
// Faculty: can only update 'status' on their own students (e.g. counselling progress)
// Admin: can update any field, including reassigning to a different faculty
export async function updateStudent(req, res, next) {
  try {
    const student = await prisma.student.findUnique({ where: { id: req.params.id } });

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    if (req.user.role === 'faculty' && student.facultyId !== req.user.id) {
      return res.status(403).json({ error: 'You do not have access to this student' });
    }

    // What can be updated depends on the caller's role
    let data;
    if (req.user.role === 'admin') {
      // Admin can update everything
      const { name, gender, dept, cutOff, community, quota, status, facultyId } = req.body;
      data = { name, gender, dept, community, quota, status, facultyId };
      if (cutOff !== undefined) data.cutOff = parseFloat(cutOff);
    } else {
      // Faculty can only update status (counselling state of their student)
      const { status } = req.body;
      if (!status) {
        return res.status(400).json({ error: 'Faculty can only update status' });
      }
      data = { status };
    }

    // Remove undefined values so we don't accidentally null out fields
    const cleanData = Object.fromEntries(
      Object.entries(data).filter(([, v]) => v !== undefined)
    );

    const updated = await prisma.student.update({
      where: { id: req.params.id },
      data:  cleanData,
    });

    res.json(updated);
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Student not found' });
    }
    next(err);
  }
}

// DELETE /api/v1/students/:id
// Faculty: can only delete students assigned to them
// Admin: can delete any student
export async function deleteStudent(req, res, next) {
  try {
    const student = await prisma.student.findUnique({ where: { id: req.params.id } });

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Authorization: faculty can only delete their own students
    if (req.user.role === 'faculty' && student.facultyId !== req.user.id) {
      return res.status(403).json({ error: 'You can only delete your own students' });
    }

    await prisma.student.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Student not found' });
    }
    next(err);
  }
}
