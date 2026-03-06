// src/utils/constants.js
export const ROLES = {
  ADMIN: 'admin',
  TEACHER: 'teacher',
  STUDENT: 'student',
  PARENT: 'parent',
};

export const PAYMENT_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed',
  REFUNDED: 'refunded',
};

export const PAYMENT_TYPES = {
  TUITION: 'tuition',
  LIBRARY: 'library',
  LAB: 'lab',
  OTHER: 'other',
};

export const ATTENDANCE_STATUS = {
  PRESENT: 'present',
  ABSENT: 'absent',
  LATE: 'late',
  EXCUSED: 'excused',
};

export const GRADE_LETTERS = ['A', 'B', 'C', 'D', 'F'];

export const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

export const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];

export const DEPARTMENTS = [
  'Computer Science',
  'Engineering',
  'Business Administration',
  'Mathematics',
  'Physics',
  'Chemistry',
  'Biology',
  'Psychology',
  'Economics',
  'English Literature',
  'History',
  'Art',
  'Music',
];

export const ANNOUNCEMENT_TYPES = {
  NEWS: 'news',
  EVENT: 'event',
  URGENT: 'urgent',
};

export const USER_ROLES = ['admin', 'teacher', 'student', 'parent'];

export const API_ENDPOINTS = {
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  LOGOUT: '/auth/logout',
  USERS: '/users',
  STUDENTS: '/students',
  TEACHERS: '/teachers',
  COURSES: '/courses',
  GRADES: '/grades',
  ATTENDANCE: '/attendance',
  PAYMENTS: '/payments',
  ANNOUNCEMENTS: '/announcements',
  SCHEDULES: '/schedules',
  PROFILE: '/profile',
};