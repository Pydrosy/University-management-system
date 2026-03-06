// backend/models/Schedule.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Schedule = sequelize.define('Schedule', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  courseId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'course_id',
    references: {
      model: 'courses',
      key: 'id'
    }
  },
  dayOfWeek: {
    type: DataTypes.ENUM('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'),
    field: 'day_of_week',
    allowNull: false
  },
  startTime: {
    type: DataTypes.TIME,
    field: 'start_time',
    allowNull: false
  },
  endTime: {
    type: DataTypes.TIME,
    field: 'end_time',
    allowNull: false
  },
  classroom: {
    type: DataTypes.STRING(50)
  },
  academicYear: {
    type: DataTypes.STRING(20),
    field: 'academic_year'
  },
  semester: {
    type: DataTypes.STRING(20)
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'created_at'
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'updated_at'
  }
}, {
  tableName: 'schedules',
  timestamps: true
});

module.exports = Schedule;