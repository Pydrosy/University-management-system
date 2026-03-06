// src/pages/Dashboard.js
import React from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  LinearProgress,
  Alert,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import {
  People as PeopleIcon,
  School as SchoolIcon,
  Assignment as AssignmentIcon,
  AttachMoney as MoneyIcon,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts';
import api from '../services/api';
import StatCard from '../components/dashboard/StatCard';
import RecentActivities from '../components/dashboard/RecentActivities';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const Dashboard = () => {
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => api.get('/dashboard/stats').then(res => res.data)
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

  // Default data if stats is undefined
  const enrollmentData = stats?.enrollmentTrends || [
    { month: 'Jan', students: 65, teachers: 28 },
    { month: 'Feb', students: 75, teachers: 30 },
    { month: 'Mar', students: 85, teachers: 32 },
    { month: 'Apr', students: 95, teachers: 35 },
    { month: 'May', students: 105, teachers: 38 },
    { month: 'Jun', students: 115, teachers: 40 }
  ];

  const courseDistribution = stats?.courseDistribution || [
    { name: 'Computer Science', value: 400 },
    { name: 'Engineering', value: 300 },
    { name: 'Business', value: 200 },
    { name: 'Mathematics', value: 150 },
    { name: 'Other', value: 100 }
  ];

  const gradeDistribution = stats?.gradeDistribution || [
    { grade: 'A', count: 45 },
    { grade: 'B', count: 78 },
    { grade: 'C', count: 56 },
    { grade: 'D', count: 23 },
    { grade: 'F', count: 12 }
  ];

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      <Typography variant="subtitle1" color="textSecondary" gutterBottom>
        Welcome back, {stats?.user?.firstName || 'User'} {stats?.user?.lastName || ''}
      </Typography>

      <Grid container spacing={3} sx={{ mt: 1 }}>
        {/* Stats Cards */}
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Students"
            value={stats?.totalStudents?.toLocaleString() || '1,250'}
            icon={<PeopleIcon />}
            color="#1976d2"
            trend={stats?.studentTrend || 5.2}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Teachers"
            value={stats?.activeTeachers?.toLocaleString() || '85'}
            icon={<SchoolIcon />}
            color="#2e7d32"
            trend={stats?.teacherTrend || 3.1}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Courses"
            value={stats?.activeCourses?.toLocaleString() || '45'}
            icon={<AssignmentIcon />}
            color="#ed6c02"
            trend={stats?.courseTrend || 2.5}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Monthly Revenue"
            value={`$${stats?.monthlyRevenue?.toLocaleString() || '250,000'}`}
            icon={<MoneyIcon />}
            color="#9c27b0"
            trend={stats?.revenueTrend || 7.8}
          />
        </Grid>

        {/* Charts */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2, height: 400 }}>
            <Typography variant="h6" gutterBottom>
              Enrollment Trends
            </Typography>
            <Box sx={{ width: '100%', height: 320 }}>
              <ResponsiveContainer>
                <LineChart
                  data={enrollmentData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="students" stroke="#1976d2" strokeWidth={2} />
                  <Line type="monotone" dataKey="teachers" stroke="#2e7d32" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, height: 400 }}>
            <Typography variant="h6" gutterBottom>
              Course Distribution
            </Typography>
            <Box sx={{ width: '100%', height: 320 }}>
              <ResponsiveContainer>
                <PieChart margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <Pie
                    data={courseDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.name}: ${entry.value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {courseDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Recent Activities
            </Typography>
            <RecentActivities activities={stats?.recentActivities || []} />
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: 400 }}>
            <Typography variant="h6" gutterBottom>
              Grade Distribution
            </Typography>
            <Box sx={{ width: '100%', height: 320 }}>
              <ResponsiveContainer>
                <BarChart
                  data={gradeDistribution}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="grade" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#1976d2" />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;