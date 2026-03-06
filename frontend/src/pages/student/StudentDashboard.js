// src/pages/student/StudentDashboard.js
import React from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  LinearProgress,
  Alert,
  Button,
  List,
  ListItem,
  ListItemText,
  Chip,
  ListItemIcon,
  Divider,
  Avatar,
  Stack,
  Tooltip,
  IconButton,
} from '@mui/material';
import {
  School as SchoolIcon,
  Assignment as AssignmentIcon,
  Grade as GradeIcon,
  Payment as PaymentIcon,
  Event as EventIcon,
  Warning as WarningIcon,
  CalendarToday as CalendarIcon,
  AccessTime as TimeIcon,
  LocationOn as LocationIcon,
  TrendingUp as TrendingUpIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import StatCard from '../../components/dashboard/StatCard';
import { formatDate } from '../../utils/formatters';

const StudentDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Use the endpoint without ID - it will use the logged-in user's ID from the auth token
  const { data: response, isLoading, error, refetch } = useQuery({
    queryKey: ['studentDashboard'],
    queryFn: async () => {
      console.log('Fetching student dashboard for user:', user);
      const res = await api.get('/students/dashboard');
      console.log('Dashboard response:', res.data);
      return res.data;
    }
  });

  const dashboardData = response?.data || {};

  // Helper function to get grade color
  const getGradeColor = (grade) => {
    if (!grade) return 'default';
    if (grade >= 90) return 'success';
    if (grade >= 80) return 'info';
    if (grade >= 70) return 'warning';
    return 'error';
  };

  // Helper function to get status color
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'success';
      case 'pending': return 'warning';
      case 'overdue': return 'error';
      case 'completed': return 'info';
      default: return 'default';
    }
  };

  // Calculate fees due safely
  const calculateFeesDue = () => {
    if (!dashboardData?.feeReminders || !Array.isArray(dashboardData.feeReminders)) {
      return 0;
    }
    
    return dashboardData.feeReminders.reduce((sum, fee) => {
      const amount = parseFloat(fee.amount || 0);
      return sum + (isNaN(amount) ? 0 : amount);
    }, 0);
  };

  const feesDue = calculateFeesDue();

  if (isLoading) {
    return (
      <Box sx={{ width: '100%', mt: 4 }}>
        <LinearProgress />
        <Typography variant="body2" color="textSecondary" align="center" sx={{ mt: 2 }}>
          Loading your dashboard...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ mt: 4 }}>
        <Alert 
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={() => refetch()}>
              Retry
            </Button>
          }
        >
          Error loading dashboard data. Please try again later.
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      {/* Welcome Section */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Student Dashboard
        </Typography>
        <Typography variant="subtitle1" color="textSecondary">
          Welcome back, {user?.firstName} {user?.lastName}! Here's your academic overview.
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Enrolled Courses"
            value={dashboardData?.enrolledCourses || 0}
            icon={<SchoolIcon />}
            color="#1976d2"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Pending Assignments"
            value={dashboardData?.pendingAssignments || 0}
            icon={<AssignmentIcon />}
            color="#ed6c02"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Current GPA"
            value={dashboardData?.currentGPA || '0.0'}
            icon={<GradeIcon />}
            color="#2e7d32"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Fees Due"
            value={`$${feesDue.toFixed(2)}`}
            icon={<PaymentIcon />}
            color="#9c27b0"
          />
        </Grid>
      </Grid>

      {/* Main Content Grid */}
      <Grid container spacing={3}>
        {/* Upcoming Assignments */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6">
                <AssignmentIcon sx={{ mr: 1, verticalAlign: 'middle', color: 'primary.main' }} />
                Upcoming Assignments
              </Typography>
              <Chip 
                label={`${dashboardData?.upcomingAssignments?.length || 0} pending`}
                color="warning"
                size="small"
              />
            </Box>
            <Divider sx={{ mb: 2 }} />
            
            {dashboardData?.upcomingAssignments?.length > 0 ? (
              <List>
                {dashboardData.upcomingAssignments.map((assignment, index) => (
                  <React.Fragment key={assignment.id}>
                    <ListItem 
                      sx={{ 
                        px: 0,
                        '&:hover': {
                          bgcolor: 'action.hover',
                          borderRadius: 1
                        }
                      }}
                    >
                      <ListItemIcon>
                        <Avatar sx={{ bgcolor: 'warning.light', width: 40, height: 40 }}>
                          <AssignmentIcon fontSize="small" />
                        </Avatar>
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Typography variant="subtitle2" fontWeight="bold">
                            {assignment.title}
                          </Typography>
                        }
                        secondary={
                          <Box component="span">
                            <Typography component="span" variant="caption" display="block" color="textSecondary">
                              {assignment.courseName}
                            </Typography>
                            <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                              <TimeIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                              <Typography component="span" variant="caption" color="textSecondary">
                                Due: {formatDate(assignment.dueDate)}
                              </Typography>
                            </Box>
                          </Box>
                        }
                      />
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => navigate(`/student/assignments/${assignment.id}`)}
                        sx={{ ml: 1 }}
                      >
                        View
                      </Button>
                    </ListItem>
                    {index < dashboardData.upcomingAssignments.length - 1 && <Divider sx={{ my: 1 }} />}
                  </React.Fragment>
                ))}
              </List>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <CheckCircleIcon sx={{ fontSize: 48, color: 'success.main', mb: 2 }} />
                <Typography color="textSecondary">
                  No pending assignments. Great job!
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Recent Grades */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6">
                <GradeIcon sx={{ mr: 1, verticalAlign: 'middle', color: 'success.main' }} />
                Recent Grades
              </Typography>
              <Chip 
                label={`GPA: ${dashboardData?.currentGPA || '0.0'}`}
                color="success"
                size="small"
              />
            </Box>
            <Divider sx={{ mb: 2 }} />
            
            {dashboardData?.recentGrades?.length > 0 ? (
              <List>
                {dashboardData.recentGrades.map((grade, index) => (
                  <React.Fragment key={grade.id}>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemIcon>
                        <Avatar 
                          sx={{ 
                            bgcolor: grade.score >= 90 ? 'success.light' : 
                                    grade.score >= 80 ? 'info.light' :
                                    grade.score >= 70 ? 'warning.light' : 'error.light',
                            width: 40,
                            height: 40
                          }}
                        >
                          <GradeIcon fontSize="small" />
                        </Avatar>
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Typography variant="subtitle2" fontWeight="bold">
                            {grade.assignmentName}
                          </Typography>
                        }
                        secondary={
                          <Box component="span">
                            <Typography component="span" variant="caption" display="block" color="textSecondary">
                              {grade.courseName}
                            </Typography>
                            <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                              <Chip
                                label={`Score: ${grade.score}`}
                                size="small"
                                color={getGradeColor(grade.score)}
                                sx={{ height: 20 }}
                              />
                              {grade.feedback && (
                                <Tooltip title={grade.feedback}>
                                  <InfoIcon fontSize="small" color="action" />
                                </Tooltip>
                              )}
                            </Box>
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < dashboardData.recentGrades.length - 1 && <Divider sx={{ my: 1 }} />}
                  </React.Fragment>
                ))}
              </List>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <GradeIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                <Typography color="textSecondary">
                  No grades available yet.
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Today's Schedule */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6">
                <EventIcon sx={{ mr: 1, verticalAlign: 'middle', color: 'primary.main' }} />
                Today's Schedule
              </Typography>
              <Chip 
                label={new Date().toLocaleDateString('en-US', { weekday: 'long' })}
                color="primary"
                size="small"
                variant="outlined"
              />
            </Box>
            <Divider sx={{ mb: 2 }} />
            
            {dashboardData?.todaySchedule?.length > 0 ? (
              <List>
                {dashboardData.todaySchedule.map((schedule, index) => (
                  <React.Fragment key={schedule.id}>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemIcon>
                        <Avatar sx={{ bgcolor: 'info.light', width: 40, height: 40 }}>
                          <SchoolIcon fontSize="small" />
                        </Avatar>
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Typography variant="subtitle2" fontWeight="bold">
                            {schedule.courseName}
                          </Typography>
                        }
                        secondary={
                          <Box component="span">
                            <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                              <TimeIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                              <Typography component="span" variant="caption" color="textSecondary">
                                {schedule.startTime} - {schedule.endTime}
                              </Typography>
                            </Box>
                            <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                              <LocationIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                              <Typography component="span" variant="caption" color="textSecondary">
                                Room: {schedule.classroom}
                              </Typography>
                            </Box>
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < dashboardData.todaySchedule.length - 1 && <Divider sx={{ my: 1 }} />}
                  </React.Fragment>
                ))}
              </List>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <EventIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                <Typography color="textSecondary">
                  No classes scheduled for today.
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Fee Reminders */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6">
                <PaymentIcon sx={{ mr: 1, verticalAlign: 'middle', color: 'warning.main' }} />
                Fee Reminders
              </Typography>
              {feesDue > 0 && (
                <Chip 
                  label={`$${feesDue.toFixed(2)} due`}
                  color="warning"
                  size="small"
                />
              )}
            </Box>
            <Divider sx={{ mb: 2 }} />
            
            {dashboardData?.feeReminders?.length > 0 ? (
              <List>
                {dashboardData.feeReminders.map((fee, index) => {
                  const isOverdue = new Date(fee.dueDate) < new Date();
                  const isUrgent = !isOverdue && new Date(fee.dueDate) - new Date() < 7 * 24 * 60 * 60 * 1000;
                  const amount = parseFloat(fee.amount || 0);
                  
                  return (
                    <React.Fragment key={fee.id}>
                      <ListItem 
                        sx={{ 
                          px: 0,
                          bgcolor: isOverdue ? '#ffebee' : isUrgent ? '#fff3e0' : 'inherit',
                          borderRadius: 1,
                          mb: 1
                        }}
                      >
                        <ListItemIcon>
                          <Avatar 
                            sx={{ 
                              bgcolor: isOverdue ? 'error.light' : isUrgent ? 'warning.light' : 'info.light',
                              width: 40,
                              height: 40
                            }}
                          >
                            <PaymentIcon fontSize="small" />
                          </Avatar>
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                              <Typography variant="subtitle2" fontWeight="bold">
                                {fee.description}
                              </Typography>
                              {isOverdue && (
                                <Chip
                                  label="OVERDUE"
                                  color="error"
                                  size="small"
                                  sx={{ height: 20 }}
                                />
                              )}
                              {isUrgent && !isOverdue && (
                                <Chip
                                  label="URGENT"
                                  color="warning"
                                  size="small"
                                  sx={{ height: 20 }}
                                />
                              )}
                            </Box>
                          }
                          secondary={
                            <Box component="span">
                              <Typography component="span" variant="caption" display="block" color="textSecondary">
                                Due: {formatDate(fee.dueDate)}
                              </Typography>
                              <Typography component="span" variant="subtitle2" color="primary.main">
                                Amount: ${amount.toFixed(2)}
                              </Typography>
                            </Box>
                          }
                        />
                        <Button
                          variant="contained"
                          size="small"
                          color={isOverdue ? 'error' : isUrgent ? 'warning' : 'primary'}
                          onClick={() => navigate('/student/fees')}
                          sx={{ ml: 1, minWidth: 80 }}
                        >
                          Pay Now
                        </Button>
                      </ListItem>
                    </React.Fragment>
                  );
                })}
              </List>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <CheckCircleIcon sx={{ fontSize: 48, color: 'success.main', mb: 2 }} />
                <Typography color="textSecondary">
                  No pending fees. All payments are up to date!
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Academic Progress */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              <TrendingUpIcon sx={{ mr: 1, verticalAlign: 'middle', color: 'success.main' }} />
              Academic Progress
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Grid container spacing={2}>
              <Grid item xs={12} md={3}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Courses Completed
                    </Typography>
                    <Typography variant="h4" color="success.main">
                      {dashboardData?.completedCourses || 0}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={3}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Current GPA
                    </Typography>
                    <Typography variant="h4" color="primary.main">
                      {dashboardData?.currentGPA || '0.0'}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={3}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Credits Earned
                    </Typography>
                    <Typography variant="h4" color="info.main">
                      {dashboardData?.creditsEarned || 0}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={3}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Attendance Rate
                    </Typography>
                    <Typography variant="h4" color="warning.main">
                      {dashboardData?.attendanceRate || 0}%
                    </Typography>
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
                  startIcon={<SchoolIcon />}
                  onClick={() => navigate('/student/courses')}
                  sx={{ py: 1.5 }}
                >
                  My Courses
                </Button>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<AssignmentIcon />}
                  onClick={() => navigate('/student/assignments')}
                  sx={{ py: 1.5 }}
                >
                  Assignments
                </Button>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<GradeIcon />}
                  onClick={() => navigate('/student/grades')}
                  sx={{ py: 1.5 }}
                >
                  View Grades
                </Button>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<PaymentIcon />}
                  onClick={() => navigate('/student/fees')}
                  sx={{ py: 1.5 }}
                >
                  Pay Fees
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default StudentDashboard;