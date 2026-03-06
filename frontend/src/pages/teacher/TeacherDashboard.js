// src/pages/teacher/TeacherDashboard.js
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
  Divider,
} from '@mui/material';
import {
  People as PeopleIcon,
  School as SchoolIcon,
  Assignment as AssignmentIcon,
  Grade as GradeIcon,
  Warning as WarningIcon,
  Schedule as ScheduleIcon,
  Event as EventIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import StatCard from '../../components/dashboard/StatCard';

const TeacherDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: response, isLoading, error } = useQuery({
    queryKey: ['teacherDashboard', user?.id],
    queryFn: async () => {
      const res = await api.get(`/teachers/dashboard/${user?.id}`);
      return res.data;
    }
  });

  const dashboardData = response?.data || {};

  if (isLoading) {
    return (
      <Box sx={{ width: '100%', mt: 4 }}>
        <LinearProgress />
        <Typography variant="body2" color="textSecondary" align="center" sx={{ mt: 2 }}>
          Loading dashboard data...
        </Typography>
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

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Teacher Dashboard
      </Typography>
      <Typography variant="subtitle1" color="textSecondary" gutterBottom>
        Welcome back, {user?.firstName} {user?.lastName}
      </Typography>

      <Grid container spacing={3} sx={{ mt: 1 }}>
        {/* Stats Cards */}
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Students"
            value={dashboardData?.totalStudents || 0}
            icon={<PeopleIcon />}
            color="#1976d2"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Courses Teaching"
            value={dashboardData?.teachingCourses || 0}
            icon={<SchoolIcon />}
            color="#2e7d32"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Pending Grading"
            value={dashboardData?.pendingGrading || 0}
            icon={<GradeIcon />}
            color="#ed6c02"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Assignments"
            value={dashboardData?.activeAssignments || 0}
            icon={<AssignmentIcon />}
            color="#9c27b0"
          />
        </Grid>

        {/* Students Overview */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: '100%', maxHeight: 400, overflow: 'auto' }}>
            <Typography variant="h6" gutterBottom>
              <Box display="flex" alignItems="center" gap={1}>
                <PeopleIcon color="primary" />
                Students Overview
              </Box>
            </Typography>
            <Divider sx={{ mb: 2 }} />
            {dashboardData?.studentsOverview?.length > 0 ? (
              <List>
                {dashboardData.studentsOverview.map((course) => (
                  <ListItem 
                    key={course.id} 
                    sx={{ 
                      bgcolor: 'background.paper',
                      mb: 1,
                      borderRadius: 1,
                      border: '1px solid',
                      borderColor: 'divider'
                    }}
                  >
                    <ListItemIcon>
                      <SchoolIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary={course.courseName}
                      secondary={
                        <Box component="span">
                          <Typography component="span" variant="body2" color="textSecondary">
                            {course.enrolledStudents} students enrolled
                          </Typography>
                          {course.submissions > 0 && (
                            <Chip
                              label={`${course.submissions} pending`}
                              color="warning"
                              size="small"
                              sx={{ ml: 1 }}
                            />
                          )}
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography color="textSecondary" align="center" sx={{ py: 4 }}>
                No courses assigned yet
              </Typography>
            )}
          </Paper>
        </Grid>

        {/* Pending Tasks */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: '100%', maxHeight: 400, overflow: 'auto' }}>
            <Typography variant="h6" gutterBottom>
              <Box display="flex" alignItems="center" gap={1}>
                <AssignmentIcon color="warning" />
                Pending Tasks
              </Box>
            </Typography>
            <Divider sx={{ mb: 2 }} />
            {dashboardData?.pendingTasks?.length > 0 ? (
              <List>
                {dashboardData.pendingTasks.map((task) => (
                  <ListItem 
                    key={task.id}
                    sx={{ 
                      bgcolor: 'background.paper',
                      mb: 1,
                      borderRadius: 1,
                      border: '1px solid',
                      borderColor: 'divider'
                    }}
                  >
                    <ListItemIcon>
                      {task.type === 'grade' ? (
                        <GradeIcon color="warning" />
                      ) : (
                        <AssignmentIcon color="info" />
                      )}
                    </ListItemIcon>
                    <ListItemText
                      primary={task.title}
                      secondary={`Due: ${new Date(task.dueDate).toLocaleDateString()}`}
                    />
                    <Button
                      size="small"
                      variant="contained"
                      color="primary"
                      onClick={() => navigate(task.link)}
                      sx={{ ml: 1 }}
                    >
                      {task.action}
                    </Button>
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography color="textSecondary" align="center" sx={{ py: 4 }}>
                No pending tasks
              </Typography>
            )}
          </Paper>
        </Grid>

        {/* Today's Classes */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: '100%', maxHeight: 400, overflow: 'auto' }}>
            <Typography variant="h6" gutterBottom>
              <Box display="flex" alignItems="center" gap={1}>
                <ScheduleIcon color="primary" />
                Today's Classes
              </Box>
            </Typography>
            <Divider sx={{ mb: 2 }} />
            {dashboardData?.todayClasses?.length > 0 ? (
              <List>
                {dashboardData.todayClasses.map((classItem) => (
                  <ListItem 
                    key={classItem.id}
                    sx={{ 
                      bgcolor: 'background.paper',
                      mb: 1,
                      borderRadius: 1,
                      border: '1px solid',
                      borderColor: 'divider'
                    }}
                  >
                    <ListItemIcon>
                      <SchoolIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary={classItem.courseName}
                      secondary={
                        <Box>
                          <Typography variant="body2" color="textSecondary">
                            {classItem.startTime} - {classItem.endTime} | Room: {classItem.room}
                          </Typography>
                        </Box>
                      }
                    />
                    <Chip
                      label={`${classItem.students} students`}
                      size="small"
                      color="info"
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography color="textSecondary" align="center" sx={{ py: 4 }}>
                No classes scheduled for today
              </Typography>
            )}
          </Paper>
        </Grid>

        {/* Recent Announcements */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: '100%', maxHeight: 400, overflow: 'auto' }}>
            <Typography variant="h6" gutterBottom>
              <Box display="flex" alignItems="center" gap={1}>
                <EventIcon color="info" />
                Recent Announcements
              </Box>
            </Typography>
            <Divider sx={{ mb: 2 }} />
            {dashboardData?.recentAnnouncements?.length > 0 ? (
              dashboardData.recentAnnouncements.map((announcement) => (
                <Card 
                  key={announcement.id} 
                  sx={{ 
                    mb: 2, 
                    bgcolor: announcement.urgent ? '#fff3e0' : 'background.paper',
                    border: '1px solid',
                    borderColor: announcement.urgent ? 'warning.light' : 'divider'
                  }}
                >
                  <CardContent>
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      {announcement.urgent && <WarningIcon color="warning" fontSize="small" />}
                      <Typography variant="subtitle1" fontWeight="bold">
                        {announcement.title}
                      </Typography>
                      {announcement.urgent && (
                        <Chip label="URGENT" color="error" size="small" sx={{ ml: 'auto' }} />
                      )}
                    </Box>
                    <Typography variant="body2" color="textSecondary" paragraph>
                      {announcement.content}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      Posted: {new Date(announcement.date).toLocaleDateString()}
                    </Typography>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Typography color="textSecondary" align="center" sx={{ py: 4 }}>
                No recent announcements
              </Typography>
            )}
          </Paper>
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Quick Actions
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<AssignmentIcon />}
                  onClick={() => navigate('/teacher/assignments')}
                  sx={{ py: 1.5 }}
                >
                  Manage Assignments
                </Button>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<GradeIcon />}
                  onClick={() => navigate('/teacher/grades')}
                  sx={{ py: 1.5 }}
                >
                  Grade Submissions
                </Button>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<PeopleIcon />}
                  onClick={() => navigate('/teacher/students')}
                  sx={{ py: 1.5 }}
                >
                  View Students
                </Button>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<ScheduleIcon />}
                  onClick={() => navigate('/teacher/schedule')}
                  sx={{ py: 1.5 }}
                >
                  View Schedule
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default TeacherDashboard;