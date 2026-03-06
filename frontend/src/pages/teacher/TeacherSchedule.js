// src/pages/teacher/TeacherSchedule.js
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  Alert,
  Tabs,
  Tab,
  Avatar,
  Button,
  Stack,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
} from '@mui/material';
import {
  Schedule as ScheduleIcon,
  AccessTime as TimeIcon,
  LocationOn as LocationIcon,
  School as SchoolIcon,
  Today as TodayIcon,
  ViewWeek as ViewWeekIcon,
  Refresh as RefreshIcon,
  People as PeopleIcon,
  Event as EventIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const TeacherSchedule = () => {
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState(0); // 0 = list, 1 = calendar
  const [debug, setDebug] = useState(null);
  const [teacherId, setTeacherId] = useState(null);

  // Fetch teacher profile to get the teacher ID
  const { data: teacherProfile, isLoading: profileLoading } = useQuery({
    queryKey: ['teacher-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not logged in');
      console.log('Fetching teacher profile for user ID:', user.id);
      // You might need to create this endpoint or use an existing one
      const res = await api.get(`/teachers/user/${user.id}`);
      return res.data;
    },
    enabled: !!user?.id,
    retry: 1
  });

  // Set teacher ID when profile is loaded
  useEffect(() => {
    if (teacherProfile?.data?.id) {
      setTeacherId(teacherProfile.data.id);
      console.log('Teacher ID set to:', teacherProfile.data.id);
    }
  }, [teacherProfile]);

  console.log('Current user:', user);
  console.log('Teacher ID from profile:', teacherId);

  const { data: response, isLoading, error, refetch } = useQuery({
    queryKey: ['teacher-schedule', teacherId],
    queryFn: async () => {
      if (!teacherId) {
        throw new Error('Teacher ID not found. Please ensure you are logged in as a teacher.');
      }
      console.log('Fetching schedules for teacher ID:', teacherId);
      const res = await api.get(`/schedules/teacher/${teacherId}`);
      console.log('Schedule API response:', res.data);
      return res.data;
    },
    enabled: !!teacherId,
    retry: 1
  });

  const schedules = response?.data || [];

  useEffect(() => {
    if (schedules.length === 0 && !isLoading && !error && teacherId) {
      setDebug('No schedules found. Admin may not have assigned any classes to you yet.');
    } else if (schedules.length > 0) {
      setDebug(`Found ${schedules.length} schedule entries`);
    }
  }, [schedules, isLoading, error, teacherId]);

  const handleViewChange = (event, newValue) => {
    setViewMode(newValue);
  };

  const handleRefresh = () => {
    refetch();
  };

  // Get today's classes
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const todayClasses = schedules?.filter(s => s.dayOfWeek === today) || [];

  // Group schedules by day
  const schedulesByDay = daysOfWeek.reduce((acc, day) => {
    acc[day] = schedules?.filter(s => s.dayOfWeek === day) || [];
    return acc;
  }, {});

  // Calculate statistics
  const totalClasses = schedules?.length || 0;
  const uniqueCourses = new Set(schedules?.map(s => s.courseId)).size || 0;
  const totalHours = schedules?.reduce((acc, s) => {
    if (!s.startTime || !s.endTime) return acc;
    const start = new Date(`1970-01-01T${s.startTime}`);
    const end = new Date(`1970-01-01T${s.endTime}`);
    const hours = (end - start) / (1000 * 60 * 60);
    return acc + (hours > 0 ? hours : 0);
  }, 0) || 0;

  const getCourseColor = (index) => {
    const colors = ['#1976d2', '#2e7d32', '#ed6c02', '#9c27b0', '#d32f2f', '#00796b', '#c2185b'];
    return colors[index % colors.length];
  };

  if (profileLoading || (isLoading && !teacherId)) {
    return (
      <Box sx={{ width: '100%', mt: 4 }}>
        <LinearProgress />
        <Typography variant="body2" color="textSecondary" align="center" sx={{ mt: 2 }}>
          Loading teacher profile...
        </Typography>
      </Box>
    );
  }

  if (isLoading) {
    return (
      <Box sx={{ width: '100%', mt: 4 }}>
        <LinearProgress />
        <Typography variant="body2" color="textSecondary" align="center" sx={{ mt: 2 }}>
          Loading your schedule...
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
            <Button color="inherit" size="small" onClick={handleRefresh}>
              Retry
            </Button>
          }
        >
          Error loading schedule: {error.message}
        </Alert>
      </Box>
    );
  }

  if (!teacherId) {
    return (
      <Box sx={{ mt: 4 }}>
        <Alert severity="warning">
          Teacher ID not found. Please ensure you are logged in as a teacher.
          <Button 
            color="inherit" 
            size="small" 
            onClick={handleRefresh}
            sx={{ ml: 2 }}
          >
            Retry
          </Button>
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            My Teaching Schedule
          </Typography>
          <Typography variant="body2" color="textSecondary">
            View and manage your class schedule
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={handleRefresh}
        >
          Refresh
        </Button>
      </Box>

      {/* Debug info - remove in production */}
      {debug && process.env.NODE_ENV === 'development' && (
        <Alert severity="info" sx={{ mb: 2 }}>
          {debug}
        </Alert>
      )}

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total Classes
                  </Typography>
                  <Typography variant="h4">
                    {totalClasses}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  <ScheduleIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Unique Courses
                  </Typography>
                  <Typography variant="h4" color="success.main">
                    {uniqueCourses}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'success.main' }}>
                  <SchoolIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Teaching Hours
                  </Typography>
                  <Typography variant="h4" color="info.main">
                    {totalHours.toFixed(1)} hrs
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'info.main' }}>
                  <TimeIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Today's Classes
                  </Typography>
                  <Typography variant="h4" color="warning.main">
                    {todayClasses.length}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'warning.main' }}>
                  <TodayIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Warning if no schedules */}
      {totalClasses === 0 && teacherId && (
        <Alert severity="info" sx={{ mb: 3 }}>
          No classes have been scheduled for you yet. Please contact the administrator if you believe this is an error.
        </Alert>
      )}

      {/* Today's Schedule Summary */}
      {todayClasses.length > 0 && (
        <Paper sx={{ p: 2, mb: 3, bgcolor: '#e3f2fd' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <TodayIcon color="primary" sx={{ mr: 1 }} />
            <Typography variant="h6" color="primary">
              Today's Classes
            </Typography>
          </Box>
          <Grid container spacing={2}>
            {todayClasses.map((schedule) => (
              <Grid item xs={12} md={4} key={schedule.id}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" fontWeight="bold">
                      {schedule.course?.courseName || 'Unknown Course'}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                      <TimeIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body2">
                        {schedule.startTime} - {schedule.endTime}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                      <LocationIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body2">
                        Room: {schedule.classroom}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Paper>
      )}

      {/* View Toggle */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={viewMode} onChange={handleViewChange} variant="fullWidth">
          <Tab icon={<ViewWeekIcon />} label="List View" iconPosition="start" />
          <Tab icon={<TodayIcon />} label="Calendar View" iconPosition="start" />
        </Tabs>
      </Paper>

      {viewMode === 0 ? (
        // List View - Detailed schedule by day
        <Paper sx={{ p: 3 }}>
          <Grid container spacing={3}>
            {daysOfWeek.map((day, index) => {
              const daySchedules = schedulesByDay[day];
              const dayColor = getCourseColor(index);
              
              return (
                <Grid item xs={12} key={day}>
                  <Paper 
                    variant="outlined" 
                    sx={{ 
                      p: 2,
                      borderLeft: '6px solid',
                      borderLeftColor: dayColor,
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6" sx={{ color: dayColor }}>
                        {day}
                      </Typography>
                      <Chip 
                        label={`${daySchedules.length} classes`}
                        size="small"
                        sx={{ bgcolor: dayColor, color: 'white' }}
                      />
                    </Box>
                    
                    {daySchedules.length > 0 ? (
                      <TableContainer>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Time</TableCell>
                              <TableCell>Course</TableCell>
                              <TableCell>Code</TableCell>
                              <TableCell>Room</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {daySchedules.map((schedule) => (
                              <TableRow key={schedule.id} hover>
                                <TableCell>
                                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <TimeIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                                    {schedule.startTime} - {schedule.endTime}
                                  </Box>
                                </TableCell>
                                <TableCell>
                                  <Typography variant="body2" fontWeight="bold">
                                    {schedule.course?.courseName || 'Unknown'}
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  <Chip 
                                    label={schedule.course?.courseCode || 'N/A'}
                                    size="small"
                                    variant="outlined"
                                  />
                                </TableCell>
                                <TableCell>
                                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <LocationIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                                    {schedule.classroom || 'TBA'}
                                  </Box>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    ) : (
                      <Typography color="textSecondary" sx={{ py: 2, textAlign: 'center' }}>
                        No classes scheduled
                      </Typography>
                    )}
                  </Paper>
                </Grid>
              );
            })}
          </Grid>
        </Paper>
      ) : (
        // Calendar View - Grid layout
        <Grid container spacing={2}>
          {daysOfWeek.map((day, index) => (
            <Grid item xs={12} md={6} lg={4} key={day}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" sx={{ color: getCourseColor(index) }}>
                      {day}
                    </Typography>
                    <Chip 
                      label={`${schedulesByDay[day].length} classes`}
                      size="small"
                      color={schedulesByDay[day].length > 0 ? 'primary' : 'default'}
                    />
                  </Box>
                  <Divider sx={{ mb: 2 }} />
                  
                  {schedulesByDay[day]?.length > 0 ? (
                    schedulesByDay[day].map((schedule) => (
                      <Box 
                        key={schedule.id} 
                        sx={{ 
                          mb: 2, 
                          p: 2, 
                          bgcolor: '#f8f9fa', 
                          borderRadius: 2,
                          border: '1px solid',
                          borderColor: 'divider',
                          '&:hover': {
                            bgcolor: '#f0f0f0',
                            boxShadow: 1,
                          }
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <TimeIcon sx={{ fontSize: 16, mr: 1, color: 'primary.main' }} />
                          <Typography variant="body2" fontWeight="bold">
                            {schedule.startTime} - {schedule.endTime}
                          </Typography>
                        </Box>
                        
                        <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                          {schedule.course?.courseName || 'Unknown Course'}
                        </Typography>
                        
                        <Typography variant="caption" display="block" color="textSecondary" gutterBottom>
                          {schedule.course?.courseCode || 'N/A'}
                        </Typography>
                        
                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                          <LocationIcon sx={{ fontSize: 14, mr: 0.5, color: 'text.secondary' }} />
                          <Typography variant="body2" color="textSecondary">
                            Room {schedule.classroom || 'TBA'}
                          </Typography>
                        </Box>
                      </Box>
                    ))
                  ) : (
                    <Box sx={{ py: 4, textAlign: 'center' }}>
                      <EventIcon sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }} />
                      <Typography color="textSecondary" variant="body2">
                        No classes
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Legend or additional info */}
      {schedules && schedules.length > 0 && (
        <Paper sx={{ mt: 3, p: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Weekly Summary
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <SchoolIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="body2">
                  Teaching {uniqueCourses} different courses
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <TimeIcon sx={{ mr: 1, color: 'success.main' }} />
                <Typography variant="body2">
                  {totalHours.toFixed(1)} teaching hours per week
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <LocationIcon sx={{ mr: 1, color: 'warning.main' }} />
                <Typography variant="body2">
                  {new Set(schedules?.map(s => s.classroom)).size} different rooms
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      )}
    </Box>
  );
};

export default TeacherSchedule;