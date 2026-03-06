// src/pages/admin/AdminDashboard.js
import React from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  LinearProgress,
  Alert,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  People as PeopleIcon,
  School as SchoolIcon,
  Assignment as AssignmentIcon,
  AttachMoney as MoneyIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
  Event as EventIcon,
  Payment as PaymentIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import StatCard from '../../components/dashboard/StatCard';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d'];

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: dashboardData, isLoading, error } = useQuery({
    queryKey: ['adminDashboard'],
    queryFn: async () => {
      const response = await api.get('/dashboard/admin');
      return response.data.data;
    }
  });

  if (isLoading) {
    return (
      <Box sx={{ width: '100%', mt: 4 }}>
        <LinearProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ mt: 4 }}>
        <Alert severity="error">
          Error loading dashboard data. Please try again later.
        </Alert>
      </Box>
    );
  }

  // Default data if API returns nothing
  const stats = dashboardData || {
    totalStudents: 1250,
    totalTeachers: 85,
    activeCourses: 45,
    monthlyRevenue: 250000,
    studentTrend: 5.2,
    teacherTrend: 3.1,
    courseTrend: 2.5,
    revenueTrend: 7.8,
    enrollmentTrends: [
      { month: 'Jan', students: 65, teachers: 28 },
      { month: 'Feb', students: 75, teachers: 30 },
      { month: 'Mar', students: 85, teachers: 32 },
      { month: 'Apr', students: 95, teachers: 35 },
      { month: 'May', students: 105, teachers: 38 },
      { month: 'Jun', students: 115, teachers: 40 }
    ],
    departmentDistribution: [
      { name: 'Computer Science', value: 400 },
      { name: 'Engineering', value: 300 },
      { name: 'Business', value: 200 },
      { name: 'Mathematics', value: 150 },
      { name: 'Other', value: 100 }
    ],
    recentActivities: [
      { 
        id: 1, 
        type: 'student', 
        description: 'New student enrolled', 
        student: { user: { firstName: 'John', lastName: 'Doe' } },
        timestamp: new Date() 
      },
      { 
        id: 2, 
        type: 'teacher', 
        description: 'New teacher joined', 
        teacher: { user: { firstName: 'Sarah', lastName: 'Johnson' } },
        timestamp: new Date() 
      },
      { 
        id: 3, 
        type: 'payment', 
        description: 'Payment received', 
        student: { user: { firstName: 'Jane', lastName: 'Smith' } },
        amount: 5000,
        timestamp: new Date() 
      },
      { 
        id: 4, 
        type: 'course', 
        description: 'New course added', 
        course: { courseName: 'Advanced JavaScript' },
        timestamp: new Date() 
      }
    ],
    pendingApprovals: [
      { 
        id: 1, 
        type: 'teacher', 
        teacher: { user: { firstName: 'Robert', lastName: 'Chen' } },
        date: new Date(), 
        link: '/admin/teachers/approve/1' 
      },
      { 
        id: 2, 
        type: 'student', 
        student: { user: { firstName: 'Emily', lastName: 'Brown' } },
        date: new Date(), 
        link: '/admin/students/approve/2' 
      },
      { 
        id: 3, 
        type: 'course', 
        course: { courseName: 'Data Science 101' },
        date: new Date(), 
        link: '/admin/courses/approve/3' 
      }
    ],
    totalCollected: 850000,
    pendingCollection: 150000,
    overdueAmount: 25000,
    collectionRate: 85,
    popularCourses: [
      { course: { courseName: 'Computer Science 101' }, enrolledStudents: 45 },
      { course: { courseName: 'Calculus I' }, enrolledStudents: 38 },
      { course: { courseName: 'Physics Fundamentals' }, enrolledStudents: 32 },
      { course: { courseName: 'Business Management' }, enrolledStudents: 28 }
    ],
    recentPayments: [
      { 
        id: 1, 
        student: { user: { firstName: 'John', lastName: 'Doe' } }, 
        amount: 5000, 
        date: new Date(), 
        status: 'completed' 
      },
      { 
        id: 2, 
        student: { user: { firstName: 'Jane', lastName: 'Smith' } }, 
        amount: 5000, 
        date: new Date(), 
        status: 'completed' 
      },
      { 
        id: 3, 
        student: { user: { firstName: 'Bob', lastName: 'Wilson' } }, 
        amount: 2500, 
        date: new Date(), 
        status: 'pending' 
      }
    ]
  };

  // Helper function to get student name
  const getStudentName = (student) => {
    if (!student) return 'Unknown Student';
    if (student.user) {
      return `${student.user.firstName || ''} ${student.user.lastName || ''}`.trim() || 'Unknown Student';
    }
    return student.name || 'Unknown Student';
  };

  // Helper function to get teacher name
  const getTeacherName = (teacher) => {
    if (!teacher) return 'Unknown Teacher';
    if (teacher.user) {
      return `${teacher.user.firstName || ''} ${teacher.user.lastName || ''}`.trim() || 'Unknown Teacher';
    }
    return teacher.name || 'Unknown Teacher';
  };

  // Helper function to get course name
  const getCourseName = (course) => {
    if (!course) return 'Unknown Course';
    return course.courseName || course.name || 'Unknown Course';
  };

  // Format activity description
  const formatActivityDescription = (activity) => {
    switch (activity.type) {
      case 'student':
        return `New student enrolled: ${getStudentName(activity.student)}`;
      case 'teacher':
        return `New teacher joined: ${getTeacherName(activity.teacher)}`;
      case 'payment':
        const studentName = getStudentName(activity.student);
        const amount = activity.amount ? `$${activity.amount.toLocaleString()}` : '';
        return `Payment received${amount ? `: ${amount}` : ''} from ${studentName}`;
      case 'course':
        return `New course added: ${getCourseName(activity.course)}`;
      default:
        return activity.description || 'Unknown activity';
    }
  };

  // Format approval item name
  const getApprovalName = (item) => {
    switch (item.type) {
      case 'teacher':
        return getTeacherName(item.teacher);
      case 'student':
        return getStudentName(item.student);
      case 'course':
        return getCourseName(item.course);
      default:
        return item.name || 'Unknown';
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Admin Dashboard
      </Typography>
      <Typography variant="subtitle1" color="textSecondary" gutterBottom>
        Welcome back, {user?.firstName} {user?.lastName}
      </Typography>

      <Grid container spacing={3} sx={{ mt: 1 }}>
        {/* Stats Cards */}
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Students"
            value={stats.totalStudents?.toLocaleString()}
            icon={<PeopleIcon />}
            color="#1976d2"
            trend={stats.studentTrend}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Teachers"
            value={stats.totalTeachers?.toLocaleString()}
            icon={<SchoolIcon />}
            color="#2e7d32"
            trend={stats.teacherTrend}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Courses"
            value={stats.activeCourses?.toLocaleString()}
            icon={<AssignmentIcon />}
            color="#ed6c02"
            trend={stats.courseTrend}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Monthly Revenue"
            value={`$${stats.monthlyRevenue?.toLocaleString()}`}
            icon={<MoneyIcon />}
            color="#9c27b0"
            trend={stats.revenueTrend}
          />
        </Grid>

        {/* Enrollment Trends Chart */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2, height: 400 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">Enrollment Trends</Typography>
              <Chip 
                icon={<TrendingUpIcon />} 
                label="Last 6 months" 
                size="small" 
                color="primary" 
                variant="outlined"
              />
            </Box>
            <Box sx={{ width: '100%', height: 320 }}>
              <ResponsiveContainer>
                <LineChart data={stats.enrollmentTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="students" stroke="#1976d2" strokeWidth={2} />
                  <Line type="monotone" dataKey="teachers" stroke="#2e7d32" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        {/* Department Distribution */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, height: 400 }}>
            <Typography variant="h6" gutterBottom>
              Department Distribution
            </Typography>
            <Box sx={{ width: '100%', height: 320 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={stats.departmentDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.name}: ${entry.value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {stats.departmentDistribution?.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        {/* Popular Courses */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Popular Courses
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Course Name</TableCell>
                    <TableCell align="right">Enrolled Students</TableCell>
                    <TableCell align="right">Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {stats.popularCourses?.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{getCourseName(item.course || item)}</TableCell>
                      <TableCell align="right">{item.enrolledStudents || item.students || 0}</TableCell>
                      <TableCell align="right">
                        <Button
                          size="small"
                          variant="text"
                          onClick={() => navigate('/admin/courses')}
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        {/* Recent Activities */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Recent Activities
            </Typography>
            <List>
              {stats.recentActivities?.map((activity, index) => (
                <ListItem key={activity.id} divider={index < stats.recentActivities.length - 1}>
                  <ListItemIcon>
                    {activity.type === 'student' && <PeopleIcon color="primary" />}
                    {activity.type === 'teacher' && <SchoolIcon color="secondary" />}
                    {activity.type === 'payment' && <PaymentIcon color="success" />}
                    {activity.type === 'course' && <AssignmentIcon color="info" />}
                  </ListItemIcon>
                  <ListItemText
                    primary={formatActivityDescription(activity)}
                    secondary={new Date(activity.timestamp).toLocaleString()}
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>

        {/* Pending Approvals */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Pending Approvals
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Type</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell align="center">Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {stats.pendingApprovals?.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Chip
                          label={item.type}
                          size="small"
                          color={item.type === 'teacher' ? 'secondary' : 
                                 item.type === 'student' ? 'primary' : 'default'}
                        />
                      </TableCell>
                      <TableCell>{getApprovalName(item)}</TableCell>
                      <TableCell>{new Date(item.date).toLocaleDateString()}</TableCell>
                      <TableCell align="center">
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => navigate(item.link)}
                        >
                          Review
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        {/* Recent Payments */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Recent Payments
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Student</TableCell>
                    <TableCell align="right">Amount</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {stats.recentPayments?.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>{getStudentName(payment.student)}</TableCell>
                      <TableCell align="right">${payment.amount?.toLocaleString()}</TableCell>
                      <TableCell>{new Date(payment.date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Chip
                          label={payment.status}
                          color={payment.status === 'completed' ? 'success' : 'warning'}
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        {/* Fee Collection Summary */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Fee Collection Summary
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Card elevation={0} sx={{ bgcolor: '#e3f2fd' }}>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Total Collected
                    </Typography>
                    <Typography variant="h5" color="primary" fontWeight="bold">
                      ${stats.totalCollected?.toLocaleString()}
                    </Typography>
                    <Box display="flex" alignItems="center" mt={1}>
                      <TrendingUpIcon fontSize="small" color="success" />
                      <Typography variant="caption" color="success.main" ml={0.5}>
                        +12.5% from last month
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card elevation={0} sx={{ bgcolor: '#fff3e0' }}>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Pending Collection
                    </Typography>
                    <Typography variant="h5" color="warning.main" fontWeight="bold">
                      ${stats.pendingCollection?.toLocaleString()}
                    </Typography>
                    <Box display="flex" alignItems="center" mt={1}>
                      <WarningIcon fontSize="small" color="warning" />
                      <Typography variant="caption" color="warning.main" ml={0.5}>
                        {stats.pendingCollection} students pending
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card elevation={0} sx={{ bgcolor: '#ffebee' }}>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Overdue
                    </Typography>
                    <Typography variant="h5" color="error" fontWeight="bold">
                      ${stats.overdueAmount?.toLocaleString()}
                    </Typography>
                    <Box display="flex" alignItems="center" mt={1}>
                      <WarningIcon fontSize="small" color="error" />
                      <Typography variant="caption" color="error.main" ml={0.5}>
                        8 accounts overdue
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card elevation={0} sx={{ bgcolor: '#e8f5e8' }}>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Collection Rate
                    </Typography>
                    <Typography variant="h5" color="success.main" fontWeight="bold">
                      {stats.collectionRate}%
                    </Typography>
                    <Box display="flex" alignItems="center" mt={1}>
                      <TrendingUpIcon fontSize="small" color="success" />
                      <Typography variant="caption" color="success.main" ml={0.5}>
                        Target: 90%
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Quick Actions
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6} sm={3}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<PeopleIcon />}
                  onClick={() => navigate('/admin/students')}
                  sx={{ py: 1.5 }}
                >
                  Manage Students
                </Button>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<SchoolIcon />}
                  onClick={() => navigate('/admin/teachers')}
                  sx={{ py: 1.5 }}
                >
                  Manage Teachers
                </Button>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<AssignmentIcon />}
                  onClick={() => navigate('/admin/courses')}
                  sx={{ py: 1.5 }}
                >
                  Manage Courses
                </Button>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<PaymentIcon />}
                  onClick={() => navigate('/admin/fees')}
                  sx={{ py: 1.5 }}
                >
                  Manage Fees
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AdminDashboard;