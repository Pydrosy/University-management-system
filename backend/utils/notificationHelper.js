// backend/utils/notificationHelper.js
const { Notification } = require('../models');

class NotificationHelper {
  constructor(io) {
    this.io = io;
  }

  // Send notification to a single user
  async sendToUser(userId, type, title, description, link = null, data = {}) {
    try {
      // Save to database
      const notification = await Notification.create({
        userId,
        type,
        title,
        description,
        link,
        data,
        read: false
      });

      // Emit socket event
      if (this.io) {
        this.io.to(`user-${userId}`).emit('new-notification', {
          id: notification.id,
          type,
          title,
          description,
          time: notification.createdAt,
          read: false,
          link,
          data
        });
      }

      return notification;
    } catch (error) {
      console.error('Error sending notification:', error);
      return null;
    }
  }

  // Send notification to multiple users
  async sendToMultipleUsers(userIds, type, title, description, link = null, data = {}) {
    try {
      const notifications = [];
      for (const userId of userIds) {
        const notification = await Notification.create({
          userId,
          type,
          title,
          description,
          link,
          data,
          read: false
        });
        notifications.push(notification);

        // Emit socket event for each user
        if (this.io) {
          this.io.to(`user-${userId}`).emit('new-notification', {
            id: notification.id,
            type,
            title,
            description,
            time: notification.createdAt,
            read: false,
            link,
            data
          });
        }
      }
      return notifications;
    } catch (error) {
      console.error('Error sending bulk notifications:', error);
      return [];
    }
  }

  // Send grade published notification
  async sendGradePublished(studentId, assignmentName, courseName, score, maxScore, submissionId) {
    const title = 'Grade Published';
    const description = `Your assignment "${assignmentName}" in ${courseName} has been graded. Score: ${score}/${maxScore}`;
    const link = '/student/grades';
    const data = { submissionId, score, maxScore };
    
    return this.sendToUser(studentId, 'grade', title, description, link, data);
  }

  // Send new assignment notification to all students in a course
  async sendNewAssignment(courseId, studentIds, assignmentTitle, courseName, dueDate) {
    const title = 'New Assignment Posted';
    const description = `New assignment "${assignmentTitle}" has been posted in ${courseName}`;
    const link = '/student/assignments';
    const data = { courseId, dueDate };
    
    return this.sendToMultipleUsers(studentIds, 'assignment', title, description, link, data);
  }

  // Send payment confirmation
  async sendPaymentConfirmation(studentId, amount, description, transactionId) {
    const title = 'Payment Successful';
    const desc = `Your payment of $${amount} for ${description || 'fees'} has been processed.`;
    const link = '/student/fees';
    const data = { amount, transactionId };
    
    return this.sendToUser(studentId, 'payment', title, desc, link, data);
  }

  // Send announcement
  async sendAnnouncement(userIds, announcementTitle, announcementContent, type = 'announcement') {
    const title = `New Announcement: ${announcementTitle}`;
    const description = announcementContent.substring(0, 100) + (announcementContent.length > 100 ? '...' : '');
    const link = '/announcements';
    const data = { type };
    
    return this.sendToMultipleUsers(userIds, type, title, description, link, data);
  }
}

module.exports = NotificationHelper;