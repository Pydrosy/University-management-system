// backend/controllers/announcementController.js
const { Announcement, User } = require('../models');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const { Op } = require('sequelize');
const sequelize = require('../config/database');

// Get all announcements
exports.getAllAnnouncements = catchAsync(async (req, res, next) => {
  try {
    const { type, status, audience } = req.query;

    // Build where clause
    const whereClause = {};
    if (type) whereClause.type = type;
    
    // Handle status filtering
    const now = new Date();
    if (status === 'active') {
      whereClause.isActive = true;
      whereClause.startDate = { [Op.lte]: now };
      whereClause.endDate = { [Op.gte]: now };
    } else if (status === 'inactive') {
      whereClause.isActive = false;
    }

    const announcements = await Announcement.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'creator', // This must match the alias defined in the association
          attributes: ['id', 'firstName', 'lastName', 'email', 'role']
        }
      ],
      order: [
        ['isActive', 'DESC'],
        ['createdAt', 'DESC']
      ]
    });

    // Filter by audience if specified
    let filteredAnnouncements = announcements;
    if (audience && audience !== 'all') {
      filteredAnnouncements = announcements.filter(ann => {
        const audiences = ann.targetAudience || ['all'];
        return audiences.includes('all') || audiences.includes(audience);
      });
    }

    res.json({
      success: true,
      count: filteredAnnouncements.length,
      data: filteredAnnouncements
    });

  } catch (error) {
    console.error('Error in getAllAnnouncements:', error);
    return next(new AppError(error.message, 500));
  }
});

// Get single announcement
exports.getAnnouncement = catchAsync(async (req, res, next) => {
  try {
    const { id } = req.params;

    const announcement = await Announcement.findByPk(id, {
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'firstName', 'lastName', 'email', 'role']
        }
      ]
    });

    if (!announcement) {
      return next(new AppError('Announcement not found', 404));
    }

    res.json({
      success: true,
      data: announcement
    });

  } catch (error) {
    console.error('Error in getAnnouncement:', error);
    return next(new AppError(error.message, 500));
  }
});

// Create announcement
exports.createAnnouncement = catchAsync(async (req, res, next) => {
  try {
    const { title, content, type, targetAudience, startDate, endDate, isActive } = req.body;

    // Validate dates
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      return next(new AppError('End date must be after start date', 400));
    }

    const announcement = await Announcement.create({
      title,
      content,
      type: type || 'news',
      targetAudience: targetAudience || ['all'],
      startDate: startDate || new Date(),
      endDate: endDate || new Date(new Date().setMonth(new Date().getMonth() + 1)),
      createdBy: req.user.id,
      isActive: isActive !== undefined ? isActive : true
    });

    // Fetch the created announcement with creator info
    const createdAnnouncement = await Announcement.findByPk(announcement.id, {
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'firstName', 'lastName', 'email', 'role']
        }
      ]
    });

    // Emit socket event for real-time notifications
    const io = req.app.get('io');
    if (io) {
      io.emit('new-announcement', {
        id: createdAnnouncement.id,
        title: createdAnnouncement.title,
        type: createdAnnouncement.type,
        createdAt: createdAnnouncement.createdAt,
        targetAudience: createdAnnouncement.targetAudience
      });
    }

    res.status(201).json({
      success: true,
      data: createdAnnouncement
    });

  } catch (error) {
    console.error('Error in createAnnouncement:', error);
    return next(new AppError(error.message, 500));
  }
});

// Update announcement
exports.updateAnnouncement = catchAsync(async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, content, type, targetAudience, startDate, endDate, isActive } = req.body;

    const announcement = await Announcement.findByPk(id);

    if (!announcement) {
      return next(new AppError('Announcement not found', 404));
    }

    // Validate dates
    const newStartDate = startDate || announcement.startDate;
    const newEndDate = endDate || announcement.endDate;
    
    if (new Date(newStartDate) > new Date(newEndDate)) {
      return next(new AppError('End date must be after start date', 400));
    }

    await announcement.update({
      title: title || announcement.title,
      content: content || announcement.content,
      type: type || announcement.type,
      targetAudience: targetAudience || announcement.targetAudience,
      startDate: newStartDate,
      endDate: newEndDate,
      isActive: isActive !== undefined ? isActive : announcement.isActive
    });

    // Fetch updated announcement with creator info
    const updatedAnnouncement = await Announcement.findByPk(id, {
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'firstName', 'lastName', 'email', 'role']
        }
      ]
    });

    res.json({
      success: true,
      data: updatedAnnouncement
    });

  } catch (error) {
    console.error('Error in updateAnnouncement:', error);
    return next(new AppError(error.message, 500));
  }
});

// Delete announcement
exports.deleteAnnouncement = catchAsync(async (req, res, next) => {
  try {
    const { id } = req.params;

    const announcement = await Announcement.findByPk(id);

    if (!announcement) {
      return next(new AppError('Announcement not found', 404));
    }

    await announcement.destroy();

    res.json({
      success: true,
      message: 'Announcement deleted successfully'
    });

  } catch (error) {
    console.error('Error in deleteAnnouncement:', error);
    return next(new AppError(error.message, 500));
  }
});

// Bulk delete announcements
exports.bulkDeleteAnnouncements = catchAsync(async (req, res, next) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return next(new AppError('Please provide an array of announcement IDs', 400));
    }

    await Announcement.destroy({
      where: {
        id: {
          [Op.in]: ids
        }
      }
    });

    res.json({
      success: true,
      message: `${ids.length} announcements deleted successfully`
    });

  } catch (error) {
    console.error('Error in bulkDeleteAnnouncements:', error);
    return next(new AppError(error.message, 500));
  }
});

// Get announcements by audience
exports.getAnnouncementsByAudience = catchAsync(async (req, res, next) => {
  try {
    const { audience } = req.params;

    const announcements = await Announcement.findAll({
      where: {
        [Op.and]: [
          {
            [Op.or]: [
              { targetAudience: { [Op.like]: `%${audience}%` } },
              { targetAudience: { [Op.like]: '%all%' } }
            ]
          },
          {
            isActive: true,
            startDate: { [Op.lte]: new Date() },
            endDate: { [Op.gte]: new Date() }
          }
        ]
      },
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'firstName', 'lastName']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: announcements
    });

  } catch (error) {
    console.error('Error in getAnnouncementsByAudience:', error);
    return next(new AppError(error.message, 500));
  }
});

// Get active announcements
exports.getActiveAnnouncements = catchAsync(async (req, res, next) => {
  try {
    const now = new Date();
    const announcements = await Announcement.findAll({
      where: {
        isActive: true,
        startDate: { [Op.lte]: now },
        endDate: { [Op.gte]: now }
      },
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'firstName', 'lastName']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: announcements
    });

  } catch (error) {
    console.error('Error in getActiveAnnouncements:', error);
    return next(new AppError(error.message, 500));
  }
});

// Get urgent announcements
exports.getUrgentAnnouncements = catchAsync(async (req, res, next) => {
  try {
    const now = new Date();
    const announcements = await Announcement.findAll({
      where: {
        type: 'urgent',
        isActive: true,
        startDate: { [Op.lte]: now },
        endDate: { [Op.gte]: now }
      },
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'firstName', 'lastName']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: announcements
    });

  } catch (error) {
    console.error('Error in getUrgentAnnouncements:', error);
    return next(new AppError(error.message, 500));
  }
});

// Get announcement statistics
exports.getAnnouncementStats = catchAsync(async (req, res, next) => {
  try {
    const totalCount = await Announcement.count();
    
    const now = new Date();
    const activeCount = await Announcement.count({
      where: {
        isActive: true,
        startDate: { [Op.lte]: now },
        endDate: { [Op.gte]: now }
      }
    });

    const typeDistribution = await Announcement.findAll({
      attributes: [
        'type',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['type']
    });

    const monthlyTrend = await sequelize.query(`
      SELECT 
        DATE_FORMAT(created_at, '%b') as month,
        COUNT(*) as count
      FROM announcements 
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
      GROUP BY DATE_FORMAT(created_at, '%Y-%m')
      ORDER BY MIN(created_at) ASC
    `, { type: sequelize.QueryTypes.SELECT });

    res.json({
      success: true,
      data: {
        total: totalCount,
        active: activeCount,
        typeDistribution: typeDistribution.map(t => ({
          type: t.type,
          count: parseInt(t.get('count')) || 0
        })),
        monthlyTrend: monthlyTrend.map(m => ({
          month: m.month,
          count: parseInt(m.count) || 0
        }))
      }
    });

  } catch (error) {
    console.error('Error in getAnnouncementStats:', error);
    return next(new AppError(error.message, 500));
  }
});