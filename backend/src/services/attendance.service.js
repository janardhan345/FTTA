import prisma from '../lib/prisma.js';

export async function toggleAttendance(facultyId) {
  // Find the latest attendance record for this faculty
  const latestAttendance = await prisma.attendance.findFirst({
    where: { facultyId },
    orderBy: { checkinTime: 'desc' },
  });

  let attendance;
  let action;

  if (!latestAttendance || latestAttendance.checkoutTime) {
    // No record or already checked out → create new check-in
    attendance = await prisma.attendance.create({
      data: {
        facultyId,
        checkinTime: new Date(),
      },
    });
    action = 'CHECKIN';
  } else {
    // Checked in but not checked out yet → set checkout time
    attendance = await prisma.attendance.update({
      where: { id: latestAttendance.id },
      data: { checkoutTime: new Date() },
    });
    action = 'CHECKOUT';
  }

  return { action, attendance };
}

export async function getAttendanceByFaculty(facultyId, limit = 50, offset = 0) {
  const [records, total] = await Promise.all([
    prisma.attendance.findMany({
      where: { facultyId },
      orderBy: { checkinTime: 'desc' },
      take: limit,
      skip: offset,
    }),
    prisma.attendance.count({ where: { facultyId } }),
  ]);

  return {
    records,
    total,
    limit,
    offset,
  };
}
