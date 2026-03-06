// Add to submissionController.js - in submitAssignment function
// After successful submission, add:

// Notify admin about new submission
const notificationController = require('./notificationController');
const io = req.app.get('io');
const student = await Student.findByPk(studentId, {
  include: [{ model: User, as: 'user' }]
});
const assignment = await Assignment.findByPk(assignmentId);

// Find all admin users
const admins = await User.findAll({ where: { role: 'admin' } });

for (const admin of admins) {
  await notificationController.createNotification(
    admin.id,
    'submission',
    'New Assignment Submission',
    `${student?.user?.firstName} ${student?.user?.lastName} submitted "${assignment?.title}".`,
    '/admin/grades',
    { submissionId: submission.id, studentId, assignmentId }
  );
  
  io.to(`user-${admin.id}`).emit('new-notification', {
    id: Date.now(),
    type: 'submission',
    title: 'New Submission',
    description: `${student?.user?.firstName} ${student?.user?.lastName} submitted an assignment.`,
    time: new Date(),
    read: false,
    link: '/admin/grades'
  });
}