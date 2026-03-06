// backend/controllers/notificationController.js
const { Notification, User } = require('../models');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const { Op } = require('sequelize');

// Get user notifications
exports.getNotifications = catchAsync(async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { limit = 20, offset = 0, unreadOnly = false } = req.query;

    const whereClause = { userId };
    if (unreadOnly === 'true') {
      whereClause.read = false;
    }

    const notifications = await Notification.findAll({
      where: whereClause,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    const unreadCount = await Notification.count({
      where: { userId, read: false }
    });

    res.json({
      success: true,
      data: notifications,
      unreadCount,
      total: await Notification.count({ where: { userId } })
    });

  } catch (error) {
    console.error('Error in getNotifications:', error);
    return next(new AppError(error.message, 500));
  }
});

// Mark notification as read
exports.markAsRead = catchAsync(async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const notification = await Notification.findOne({
      where: { id, userId }
    });

    if (!notification) {
      return next(new AppError('Notification not found', 404));
    }

    await notification.update({ read: true });

    // Emit socket event
    const io = req.app.get('io');
    io.to(`user-${userId}`).emit('notification-read', { id });

    res.json({
      success: true,
      data: notification
    });

  } catch (error) {
    console.error('Error in markAsRead:', error);
    return next(new AppError(error.message, 500));
  }
});

// Mark all notifications as read
exports.markAllAsRead = catchAsync(async (req, res, next) => {
  try {
    const userId = req.user.id;

    await Notification.update(
      { read: true },
      { 
        where: { 
          userId, 
          read: false 
        } 
      }
    );

    // Emit socket event
    const io = req.app.get('io');
    io.to(`user-${userId}`).emit('notifications-read-all');

    res.json({
      success: true,
      message: 'All notifications marked as read'
    });

  } catch (error) {
    console.error('Error in markAllAsRead:', error);
    return next(new AppError(error.message, 500));
  }
});

// Delete notification
exports.deleteNotification = catchAsync(async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const notification = await Notification.findOne({
      where: { id, userId }
    });

    if (!notification) {
      return next(new AppError('Notification not found', 404));
    }

    await notification.destroy();

    res.json({
      success: true,
      message: 'Notification deleted successfully'
    });

  } catch (error) {
    console.error('Error in deleteNotification:', error);
    return next(new AppError(error.message, 500));
  }
});

// Create notification (internal use)
exports.createNotification = async (userId, type, title, description, link = null, data = {}) => {
  try {
    const notification = await Notification.create({
      userId,
      type,
      title,
      description,
      link,
      data,
      read: false
    });

    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    return null;
  }
};

// Create bulk notifications (for announcements)
exports.createBulkNotifications = async (userIds, type, title, description, link = null, data = {}) => {
  try {
    const notifications = userIds.map(userId => ({
      userId,
      type,
      title,
      description,
      link,
      data,
      read: false
    }));

    const created = await Notification.bulkCreate(notifications);
    return created;
  } catch (error) {
    console.error('Error creating bulk notifications:', error);
    return [];
  }
};