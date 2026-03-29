const queueByFacultyId = new Map();
const MAX_QUEUE_PER_FACULTY = 50;

export function pushAssignmentNotification({
  facultyId,
  studentId,
  studentName,
  type,
  assignedBy,
}) {
  if (!facultyId) return;

  const currentQueue = queueByFacultyId.get(facultyId) || [];
  const payload = {
    id: `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
    facultyId,
    studentId,
    studentName,
    type,
    assignedBy,
    createdAt: new Date().toISOString(),
  };

  currentQueue.push(payload);

  if (currentQueue.length > MAX_QUEUE_PER_FACULTY) {
    currentQueue.splice(0, currentQueue.length - MAX_QUEUE_PER_FACULTY);
  }

  queueByFacultyId.set(facultyId, currentQueue);
}

export function consumeAssignmentNotifications(facultyId) {
  const queue = queueByFacultyId.get(facultyId) || [];
  queueByFacultyId.set(facultyId, []);
  return queue;
}