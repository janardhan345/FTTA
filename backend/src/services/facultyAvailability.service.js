import prisma from '../lib/prisma.js';

export function resolveFacultyStatus({ isCheckedIn, hasActiveSession }) {
  if (hasActiveSession) return 'busy';
  return isCheckedIn ? 'available' : 'not_available';
}

export async function getFacultyStatusById(facultyId) {
  const faculty = await prisma.faculty.findUnique({
    where: { id: facultyId },
    include: {
      attendances: {
        orderBy: { checkinTime: 'desc' },
        take: 1,
        select: { checkoutTime: true },
      },
      sessions: {
        where: { endTime: null },
        select: { id: true },
      },
    },
  });

  if (!faculty) {
    return null;
  }

  const isCheckedIn = faculty.attendances.length > 0 && !faculty.attendances[0].checkoutTime;
  const hasActiveSession = faculty.sessions.length > 0;

  return resolveFacultyStatus({ isCheckedIn, hasActiveSession });
}