// models/Teacher.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Teacher = sequelize.define('Teacher', {
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
  employeeId: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true,
    field: 'employee_id'
  },
  department: {
    type: DataTypes.STRING(100)
  },
  qualification: {
    type: DataTypes.TEXT
  },
  specialization: {
    type: DataTypes.STRING(100)
  },
  joiningDate: {
    type: DataTypes.DATEONLY,
    field: 'joining_date'
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
  tableName: 'teachers',
  timestamps: true
});

module.exports = Teacher;