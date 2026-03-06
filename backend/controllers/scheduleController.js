// backend/controllers/scheduleController.js
const { Schedule, Course, Teacher, User } = require('../models');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const { Op } = require('sequelize');
const sequelize = require('../config/database');

// Get all schedules
exports.getAllSchedules = catchAsync(async (req, res, next) => {
  try {
    // Simplified query - first get all schedules
    const schedules = await Schedule.findAll({
      order: [
        ['dayOfWeek', 'ASC'],
        ['startTime', 'ASC']
      ]
    });

    // Then manually add course info if needed
    const schedulesWithDetails = [];
    
    for (const schedule of schedules) {
      const scheduleJson = schedule.toJSON();
      
      // Get course details
      if (schedule.courseId) {
        const course = await Course.findByPk(schedule.courseId, {
          include: [
            {
              model: Teacher,
              as: 'teacher',
              include: [
                {
                  model: User,
                  as: 'user',
                  attributes: ['firstName', 'lastName']
                }
              ]
            }
          ]
        });
        
        scheduleJson.Course = course;
      }
      
      schedulesWithDetails.push(scheduleJson);
    }

    res.json({
      success: true,
      data: schedulesWithDetails
    });

  } catch (error) {
    console.error('Error in getAllSchedules:', error);
    // Return empty array instead of error
    res.json({
      success: true,
      data: []
    });
  }
});

// Get single schedule
exports.getSchedule = catchAsync(async (req, res, next) => {
  try {
    const { id } = req.params;

    const schedule = await Schedule.findByPk(id);

    if (!schedule) {
      return next(new AppError('Schedule not found', 404));
    }

    // Get course details
    let course = null;
    if (schedule.courseId) {
      course = await Course.findByPk(schedule.courseId, {
        include: [
          {
            model: Teacher,
            as: 'teacher',
            include: [
              {
                model: User,
                as: 'user',
                attributes: ['firstName', 'lastName']
              }
            ]
          }
        ]
      });
    }

    const scheduleJson = schedule.toJSON();
    scheduleJson.Course = course;

    res.json({
      success: true,
      data: scheduleJson
    });

  } catch (error) {
    console.error('Error in getSchedule:', error);
    return next(new AppError(error.message, 500));
  }
});

// Create schedule
exports.createSchedule = catchAsync(async (req, res, next) => {
  try {
    const { courseId, dayOfWeek, startTime, endTime, classroom, academicYear, semester } = req.body;

    // Check if course exists
    const course = await Course.findByPk(courseId);
    if (!course) {
      return next(new AppError('Course not found', 404));
    }

    const schedule = await Schedule.create({
      courseId,
      dayOfWeek,
      startTime,
      endTime,
      classroom,
      academicYear,
      semester
    });

    res.status(201).json({
      success: true,
      data: schedule
    });

  } catch (error) {
    console.error('Error in createSchedule:', error);
    return next(new AppError(error.message, 500));
  }
});

// Update schedule
exports.updateSchedule = catchAsync(async (req, res, next) => {
  try {
    const { id } = req.params;
    const schedule = await Schedule.findByPk(id);

    if (!schedule) {
      return next(new AppError('Schedule not found', 404));
    }

    await schedule.update(req.body);

    res.json({
      success: true,
      data: schedule
    });

  } catch (error) {
    console.error('Error in updateSchedule:', error);
    return next(new AppError(error.message, 500));
  }
});

// Delete schedule
exports.deleteSchedule = catchAsync(async (req, res, next) => {
  try {
    const { id } = req.params;
    const schedule = await Schedule.findByPk(id);

    if (!schedule) {
      return next(new AppError('Schedule not found', 404));
    }

    await schedule.destroy();

    res.json({
      success: true,
      message: 'Schedule deleted successfully'
    });

  } catch (error) {
    console.error('Error in deleteSchedule:', error);
    return next(new AppError(error.message, 500));
  }
});

// Bulk delete schedules
exports.bulkDeleteSchedules = catchAsync(async (req, res, next) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return next(new AppError('Please provide an array of schedule IDs', 400));
    }

    await Schedule.destroy({
      where: {
        id: {
          [Op.in]: ids
        }
      }
    });

    res.json({
      success: true,
      message: `${ids.length} schedules deleted successfully`
    });

  } catch (error) {
    console.error('Error in bulkDeleteSchedules:', error);
    return next(new AppError(error.message, 500));
  }
});

// Get schedules by day
exports.getSchedulesByDay = catchAsync(async (req, res, next) => {
  try {
    const { day } = req.params;

    const schedules = await Schedule.findAll({
      where: { dayOfWeek: day },
      order: [['startTime', 'ASC']]
    });

    res.json({
      success: true,
      data: schedules
    });

  } catch (error) {
    console.error('Error in getSchedulesByDay:', error);
    return next(new AppError(error.message, 500));
  }
});

// Get schedules by course
exports.getSchedulesByCourse = catchAsync(async (req, res, next) => {
  try {
    const { courseId } = req.params;

    const schedules = await Schedule.findAll({
      where: { courseId },
      order: [['dayOfWeek', 'ASC'], ['startTime', 'ASC']]
    });

    res.json({
      success: true,
      data: schedules
    });

  } catch (error) {
    console.error('Error in getSchedulesByCourse:', error);
    return next(new AppError(error.message, 500));
  }
});

// Get schedules by teacher - FIXED VERSION
exports.getSchedulesByTeacher = catchAsync(async (req, res, next) => {
  try {
    const { teacherId } = req.params;

    console.log('Fetching schedules for teacher ID:', teacherId);

    if (!teacherId) {
      return next(new AppError('Teacher ID is required', 400));
    }

    // First, find all courses taught by this teacher
    const courses = await Course.findAll({
      where: { teacherId },
      attributes: ['id', 'courseName', 'courseCode']
    });

    console.log(`Found ${courses.length} courses for teacher ${teacherId}`);

    const courseIds = courses.map(c => c.id);

    if (courseIds.length === 0) {
      return res.json({
        success: true,
        data: []
      });
    }

    // Get schedules for these courses
    const schedules = await Schedule.findAll({
      where: {
        courseId: { [Op.in]: courseIds }
      },
      include: [
        {
          model: Course,
          as: 'course',
          attributes: ['id', 'courseName', 'courseCode']
        }
      ],
      order: [
        ['dayOfWeek', 'ASC'],
        ['startTime', 'ASC']
      ]
    });

    console.log(`Found ${schedules.length} schedules for teacher ${teacherId}`);

    res.json({
      success: true,
      data: schedules
    });

  } catch (error) {
    console.error('Error in getSchedulesByTeacher:', error);
    return next(new AppError(error.message, 500));
  }
});

// Check classroom availability
exports.checkAvailability = catchAsync(async (req, res, next) => {
  try {
    const { classroom, dayOfWeek, startTime, endTime } = req.query;

    const conflictingSchedule = await Schedule.findOne({
      where: {
        classroom,
        dayOfWeek,
        [Op.or]: [
          {
            startTime: {
              [Op.lt]: endTime
            },
            endTime: {
              [Op.gt]: startTime
            }
          }
        ]
      }
    });

    res.json({
      success: true,
      available: !conflictingSchedule
    });

  } catch (error) {
    console.error('Error in checkAvailability:', error);
    return next(new AppError(error.message, 500));
  }
});