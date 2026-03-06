// backend/utils/adminNotificationHelper.js
const { User, Notification } = require('../models');

class AdminNotificationHelper {
  constructor(io) {
    this.io = io;
  }

  // Send notification to all admins
  async notifyAllAdmins(type, title, description, link = null, data = {}) {
    try {
      // Find all admin users
      const admins = await User.findAll({ 
        where: { role: 'admin', isActive: true },
        attributes: ['id']
      });

      const adminIds = admins.map(a => a.id);
      
      if (adminIds.length === 0) return [];

      // Create notifications in database
      const notifications = await Promise.all(
        adminIds.map(adminId => 
          Notification.create({
            userId: adminId,
            type,
            title,
            description,
            link,
            data,
            read: false
          })
        )
      );

      // Emit socket events
      if (this.io) {
        adminIds.forEach(adminId => {
          this.io.to(`user-${adminId}`).emit('new-notification', {
            id: notifications.find(n => n.userId === adminId)?.id || Date.now(),
            type,
            title,
            description,
            time: new Date(),
            read: false,
            link,
            data
          });
        });
      }

      return notifications;
    } catch (error) {
      console.error('Error notifying admins:', error);
      return [];
    }
  }

  // Notify about new student registration
  async notifyNewStudent(student) {
    const title = 'New Student Registered';
    const description = `${student.user?.firstName} ${student.user?.lastName} (${student.studentNumber}) has registered.`;
    const link = '/admin/students';
    const data = { studentId: student.id };
    
    return this.notifyAllAdmins('student', title, description, link, data);
  }

  // Notify about new teacher
  async notifyNewTeacher(teacher) {
    const title = 'New Teacher Added';
    const description = `${teacher.user?.firstName} ${teacher.user?.lastName} (${teacher.employeeId}) has been added.`;
    const link = '/admin/teachers';
    const data = { teacherId: teacher.id };
    
    return this.notifyAllAdmins('teacher', title, description, link, data);
  }

  // Notify about payment received
  async notifyPaymentReceived(student, amount, paymentId) {
    const title = 'Payment Received';
    const description = `${student.user?.firstName} ${student.user?.lastName} made a payment of $${amount}.`;
    const link = '/admin/fees';
    const data = { paymentId, studentId: student.id, amount };
    
    return this.notifyAllAdmins('payment', title, description, link, data);
  }

  // Notify about new submission
  async notifyNewSubmission(student, assignment) {
    const title = 'New Assignment Submission';
    const description = `${student.user?.firstName} ${student.user?.lastName} submitted "${assignment?.title}".`;
    const link = '/admin/grades';
    const data = { studentId: student.id, assignmentId: assignment.id };
    
    return this.notifyAllAdmins('submission', title, description, link, data);
  }

  // Notify about new enrollment
  async notifyNewEnrollment(student, course) {
    const title = 'New Course Enrollment';
    const description = `${student.user?.firstName} ${student.user?.lastName} enrolled in ${course?.courseName}.`;
    const link = '/admin/students';
    const data = { studentId: student.id, courseId: course.id };
    
    return this.notifyAllAdmins('enrollment', title, description, link, data);
  }

  // Notify about system alerts
  async notifySystemAlert(message, severity = 'warning') {
    const title = 'System Alert';
    const description = message;
    const link = '/admin/dashboard';
    const data = { severity };
    
    return this.notifyAllAdmins('alert', title, description, link, data);
  }
}

module.exports = AdminNotificationHelper;