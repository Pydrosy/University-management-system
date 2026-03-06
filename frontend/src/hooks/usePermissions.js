// src/hooks/usePermissions.js
import { useAuth } from './useAuth';

export const usePermissions = () => {
  const { user } = useAuth();

  const can = (action, resource) => {
    // Define permissions based on roles
    const permissions = {
      admin: {
        create: ['student', 'teacher', 'course', 'announcement', 'payment'],
        read: ['student', 'teacher', 'course', 'announcement', 'payment', 'grade'],
        update: ['student', 'teacher', 'course', 'announcement', 'payment', 'grade'],
        delete: ['student', 'teacher', 'course', 'announcement', 'payment'],
      },
      teacher: {
        create: ['announcement', 'grade', 'assignment'],
        read: ['student', 'course', 'announcement', 'grade', 'assignment'],
        update: ['grade', 'announcement', 'assignment'],
        delete: ['announcement', 'assignment'],
      },
      student: {
        create: [],
        read: ['course', 'announcement', 'grade', 'assignment'],
        update: ['profile'],
        delete: [],
      },
      parent: {
        create: [],
        read: ['student', 'announcement', 'grade'],
        update: [],
        delete: [],
      },
    };

    if (!user || !permissions[user.role]) {
      return false;
    }

    return permissions[user.role][action]?.includes(resource) || false;
  };

  const hasRole = (roles) => {
    if (!user) return false;
    if (typeof roles === 'string') {
      return user.role === roles;
    }
    return roles.includes(user.role);
  };

  const isAdmin = () => user?.role === 'admin';
  const isTeacher = () => user?.role === 'teacher';
  const isStudent = () => user?.role === 'student';
  const isParent = () => user?.role === 'parent';

  return {
    can,
    hasRole,
    isAdmin,
    isTeacher,
    isStudent,
    isParent,
    role: user?.role,
  };
};