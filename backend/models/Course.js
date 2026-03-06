// models/Course.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Course = sequelize.define('Course', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  courseCode: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true,
    field: 'course_code'
  },
  courseName: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'course_name'
  },
  description: {
    type: DataTypes.TEXT
  },
  credits: {
    type: DataTypes.INTEGER,
    defaultValue: 3
  },
  department: {
    type: DataTypes.STRING(100)
  },
  teacherId: {
    type: DataTypes.INTEGER,
    field: 'teacher_id',
    references: {
      model: 'teachers',
      key: 'id'
    }
  },
  semester: {
    type: DataTypes.INTEGER
  },
  maxStudents: {
    type: DataTypes.INTEGER,
    field: 'max_students',
    defaultValue: 30
  },
  enrolledStudents: {
    type: DataTypes.INTEGER,
    field: 'enrolled_students',
    defaultValue: 0
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'completed'),
    defaultValue: 'active'
  },
  startDate: {
    type: DataTypes.DATEONLY,
    field: 'start_date'
  },
  endDate: {
    type: DataTypes.DATEONLY,
    field: 'end_date'
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
  tableName: 'courses',
  timestamps: true
});

module.exports = Course;