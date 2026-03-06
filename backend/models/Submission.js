// backend/models/Submission.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Submission = sequelize.define('Submission', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  assignmentId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'assignment_id',
    references: {
      model: 'assignments',
      key: 'id'
    }
  },
  studentId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'student_id',
    references: {
      model: 'students',
      key: 'id'
    }
  },
  submissionText: {
    type: DataTypes.TEXT,
    field: 'submission_text'
  },
  fileUrl: {
    type: DataTypes.STRING(255),
    field: 'file_url'
  },
  submissionDate: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'submission_date'
  },
  score: {
    type: DataTypes.DECIMAL(5, 2)
  },
  feedback: {
    type: DataTypes.TEXT
  },
  // Note: grade column might not exist in your table
  // Remove or comment out if not present
  // grade: {
  //   type: DataTypes.CHAR(2)
  // },
  status: {
    type: DataTypes.ENUM('submitted', 'late', 'graded'),
    defaultValue: 'submitted'
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
  tableName: 'submissions',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['assignment_id', 'student_id']
    }
  ]
});

module.exports = Submission;