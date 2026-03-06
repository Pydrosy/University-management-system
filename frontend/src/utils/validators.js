// src/utils/validators.js
export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

export const validatePhone = (phone) => {
  const re = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/;
  return re.test(phone);
};

export const validateStudentNumber = (studentNumber) => {
  const re = /^[A-Z0-9]{6,10}$/;
  return re.test(studentNumber);
};

export const validateEmployeeId = (employeeId) => {
  const re = /^[A-Z0-9]{5,8}$/;
  return re.test(employeeId);
};

export const validatePassword = (password) => {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
  const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/;
  return re.test(password);
};

export const validateGrade = (grade) => {
  return ['A', 'B', 'C', 'D', 'F'].includes(grade);
};

export const validateDateRange = (startDate, endDate) => {
  return new Date(startDate) <= new Date(endDate);
};

export const validateAge = (dateOfBirth, minAge = 16) => {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age >= minAge;
};