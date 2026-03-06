// src/App.js
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';

// Import useAuth hook
import { useAuth } from './context/AuthContext';

// Pages
import Login from './pages/Login';
import AdminDashboard from './pages/admin/AdminDashboard';
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import StudentDashboard from './pages/student/StudentDashboard';

// Admin Pages
import AdminStudents from './pages/admin/AdminStudents';
import AdminTeachers from './pages/admin/AdminTeachers';
import AdminCourses from './pages/admin/AdminCourses';
import AdminFees from './pages/admin/AdminFees';
import AdminAnnouncements from './pages/admin/AdminAnnouncements';
import AdminSchedule from './pages/admin/AdminSchedule';
import AdminGrades from './pages/admin/AdminGrades';

// Teacher Pages
import TeacherCourses from './pages/teacher/TeacherCourses';
import TeacherStudents from './pages/teacher/TeacherStudents';
import TeacherAssignments from './pages/teacher/TeacherAssignments';
import TeacherGrades from './pages/teacher/TeacherGrades';
import TeacherAnnouncements from './pages/teacher/TeacherAnnouncements';
import TeacherSchedule from './pages/teacher/TeacherSchedule';

// Student Pages
import StudentCourses from './pages/student/StudentCourses';
import StudentAssignments from './pages/student/StudentAssignments';
import StudentGrades from './pages/student/StudentGrades';
import StudentFees from './pages/student/StudentFees';
import StudentProfile from './pages/student/StudentProfile';
import StudentSchedule from './pages/student/StudentSchedule';
import StudentAnnouncements from './pages/student/StudentAnnouncements'; // Added missing import

// Components
import Layout from './components/common/Layout';
import PrivateRoute from './components/common/PrivateRoute';
import Unauthorized from './pages/Unauthorized';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 30000,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastContainer 
        position="top-right" 
        autoClose={3000} 
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/unauthorized" element={<Unauthorized />} />
        
        {/* Admin Routes */}
        <Route path="/admin" element={<PrivateRoute requiredRoles={['admin']}><Layout /></PrivateRoute>}>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="students" element={<AdminStudents />} />
          <Route path="teachers" element={<AdminTeachers />} />
          <Route path="courses" element={<AdminCourses />} />
          <Route path="fees" element={<AdminFees />} />
          <Route path="schedule" element={<AdminSchedule />} />
          <Route path="announcements" element={<AdminAnnouncements />} />
          <Route path="grades" element={<AdminGrades />} />
        </Route>

        {/* Teacher Routes */}
        <Route path="/teacher" element={<PrivateRoute requiredRoles={['teacher']}><Layout /></PrivateRoute>}>
          <Route index element={<Navigate to="/teacher/dashboard" replace />} />
          <Route path="dashboard" element={<TeacherDashboard />} />
          <Route path="courses" element={<TeacherCourses />} />
          <Route path="students" element={<TeacherStudents />} />
          <Route path="assignments" element={<TeacherAssignments />} />
          <Route path="grades" element={<TeacherGrades />} />
          <Route path="schedule" element={<TeacherSchedule />} />
          <Route path="announcements" element={<TeacherAnnouncements />} />
        </Route>

        {/* Student Routes */}
        <Route path="/student" element={<PrivateRoute requiredRoles={['student']}><Layout /></PrivateRoute>}>
          <Route index element={<Navigate to="/student/dashboard" replace />} />
          <Route path="dashboard" element={<StudentDashboard />} />
          <Route path="courses" element={<StudentCourses />} />
          <Route path="assignments" element={<StudentAssignments />} />
          <Route path="grades" element={<StudentGrades />} />
          <Route path="fees" element={<StudentFees />} />
          <Route path="schedule" element={<StudentSchedule />} />
          <Route path="announcements" element={<StudentAnnouncements />} />
          <Route path="profile" element={<StudentProfile />} />
        </Route>

        {/* Default redirect based on role */}
        <Route path="/" element={<PrivateRoute><RoleBasedRedirect /></PrivateRoute>} />
      </Routes>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

// Component to redirect users based on their role
const RoleBasedRedirect = () => {
  const { user } = useAuth();
  
  if (user?.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
  if (user?.role === 'teacher') return <Navigate to="/teacher/dashboard" replace />;
  if (user?.role === 'student') return <Navigate to="/student/dashboard" replace />;
  
  return <Navigate to="/login" replace />;
};

export default App;