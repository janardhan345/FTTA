import prisma from '../lib/prisma.js';

export async function getStudents(req, res, next) {
  try {
    const where = req.user.role === 'admin'
      ? {}                                  
      : { facultyId: req.user.id };         

    const students = await prisma.student.findMany({
      where,
      include: { faculty: { select: { name: true, dept: true } } },
      orderBy: { name: 'asc' },
    });

    res.json(students);
  } catch (err) {
    next(err);
  }
}

export async function createStudent(req, res, next) {
  try {
    const { name, gender, facultyId, dept, cutOff, community, quota, status } = req.body;

    const missing = ['name', 'gender', 'facultyId', 'dept', 'cutOff', 'community', 'quota', 'status']
      .filter(field => req.body[field] === undefined || req.body[field] === '');
    if (missing.length > 0) {
      return res.status(400).json({ error: `Missing required fields: ${missing.join(', ')}` });
    }

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

export async function getStudentById(req, res, next) {
  try {
    const student = await prisma.student.findUnique({
      where:   { id: req.params.id },
      include: { faculty: { select: { name: true, email: true } } },
    });

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    if (req.user.role === 'faculty' && student.facultyId !== req.user.id) {
      return res.status(403).json({ error: 'You do not have access to this student' });
    }

    res.json(student);
  } catch (err) {
    next(err);
  }
}

export async function updateStudent(req, res, next) {
  try {
    const student = await prisma.student.findUnique({ where: { id: req.params.id } });

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    if (req.user.role === 'faculty' && student.facultyId !== req.user.id) {
      return res.status(403).json({ error: 'You do not have access to this student' });
    }

    let data;
    if (req.user.role === 'admin') {
      // Admin can update everything
      const { name, gender, dept, cutOff, community, quota, status, facultyId } = req.body;
      data = { name, gender, dept, community, quota, status, facultyId };
      if (cutOff !== undefined) {
        const parsedCutOff = parseFloat(cutOff);
        if (Number.isNaN(parsedCutOff)) {
          return res.status(400).json({ error: 'cutOff must be a valid number' });
        }
        data.cutOff = parsedCutOff;
      }
    } else {
      // Faculty can update details for their own students (but not reassign faculty)
      const { name, gender, dept, cutOff, community, quota, status } = req.body;
      data = { name, gender, dept, community, quota, status };
      if (cutOff !== undefined) {
        const parsedCutOff = parseFloat(cutOff);
        if (Number.isNaN(parsedCutOff)) {
          return res.status(400).json({ error: 'cutOff must be a valid number' });
        }
        data.cutOff = parsedCutOff;
      }
    }

    const cleanData = Object.fromEntries(
      Object.entries(data).filter(([, v]) => v !== undefined)
    );

    if (Object.keys(cleanData).length === 0) {
      return res.status(400).json({ error: 'Provide at least one field to update' });
    }

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
