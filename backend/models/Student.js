// models/Student.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Student = sequelize.define('Student', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
    field: 'user_id',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  studentNumber: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true,
    field: 'student_number'
  },
  major: {
    type: DataTypes.STRING(100)
  },
  enrollmentDate: {
    type: DataTypes.DATEONLY,
    field: 'enrollment_date'
  },
  currentSemester: {
    type: DataTypes.INTEGER,
    field: 'current_semester',
    defaultValue: 1
  },
  gpa: {
    type: DataTypes.DECIMAL(3, 2),
    defaultValue: 0.00
  },
  guardianId: {
    type: DataTypes.INTEGER,
    field: 'guardian_id'
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
  tableName: 'students',
  timestamps: true
});

module.exports = Student;