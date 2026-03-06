// src/pages/student/StudentSchedule.js
import React, { useState } from 'react';
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
  Person as PersonIcon,
  Refresh as RefreshIcon,
  Event as EventIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const StudentSchedule = () => {
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState(0); // 0 = list, 1 = calendar

  // Fetch student schedule using the correct endpoint
  const { data: response, isLoading, error, refetch } = useQuery({
    queryKey: ['studentSchedule'],
    queryFn: async () => {
      console.log('Fetching schedule for student:', user?.id);
      const res = await api.get('/students/schedule');
      console.log('Schedule response:', res.data);
      return res.data;
    }
  });

  const scheduleData = response?.data || {};
  const schedule = scheduleData.schedule || [];
  const scheduleByDay = scheduleData.scheduleByDay || {};

  const handleViewChange = (event, newValue) => {
    setViewMode(newValue);
  };

  const handleRefresh = () => {
    refetch();
  };

  // Get today's classes
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const todayClasses = schedule.filter(s => s.dayOfWeek === today) || [];

  // Calculate statistics
  const totalClasses = schedule.length;
  const uniqueCourses = new Set(schedule.map(s => s.courseId)).size;
  const totalHours = schedule.reduce((acc, s) => {
    if (!s.startTime || !s.endTime) return acc;
    const start = new Date(`1970-01-01T${s.startTime}`);
    const end = new Date(`1970-01-01T${s.endTime}`);
    const hours = (end - start) / (1000 * 60 * 60);
    return acc + (hours > 0 ? hours : 0);
  }, 0);

  const getCourseColor = (index) => {
    const colors = ['#1976d2', '#2e7d32', '#ed6c02', '#9c27b0', '#d32f2f', '#00796b', '#c2185b'];
    return colors[index % colors.length];
  };

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
          Error loading schedule. Please try again later.
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
            My Class Schedule
          </Typography>
          <Typography variant="body2" color="textSecondary">
            View your weekly class schedule
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
                    Weekly Hours
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
            {todayClasses.map((classItem) => (
              <Grid item xs={12} md={4} key={classItem.id}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" fontWeight="bold">
                      {classItem.courseName}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                      <TimeIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body2">
                        {classItem.startTime} - {classItem.endTime}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                      <LocationIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body2">
                        Room: {classItem.classroom}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                      <PersonIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body2">
                        {classItem.instructorName || 'TBA'}
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
              const daySchedules = scheduleByDay[day] || [];
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
                              <TableCell>Instructor</TableCell>
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
                                    {schedule.courseName}
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  <Chip 
                                    label={schedule.courseCode}
                                    size="small"
                                    variant="outlined"
                                  />
                                </TableCell>
                                <TableCell>
                                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <LocationIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                                    {schedule.classroom}
                                  </Box>
                                </TableCell>
                                <TableCell>
                                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <PersonIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                                    {schedule.instructorName || 'TBA'}
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
            
            {totalClasses === 0 && (
              <Grid item xs={12}>
                <Alert severity="info" sx={{ mt: 2 }}>
                  No classes scheduled. Your schedule will appear here once you enroll in courses.
                </Alert>
              </Grid>
            )}
          </Grid>
        </Paper>
      ) : (
        // Calendar View - Grid layout
        <Grid container spacing={2}>
          {daysOfWeek.map((day, index) => {
            const daySchedules = scheduleByDay[day] || [];
            
            return (
              <Grid item xs={12} md={6} lg={4} key={day}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6" sx={{ color: getCourseColor(index) }}>
                        {day}
                      </Typography>
                      <Chip 
                        label={`${daySchedules.length} classes`}
                        size="small"
                        color={daySchedules.length > 0 ? 'primary' : 'default'}
                      />
                    </Box>
                    <Divider sx={{ mb: 2 }} />
                    
                    {daySchedules.length > 0 ? (
                      daySchedules.map((schedule) => (
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
                            {schedule.courseName}
                          </Typography>
                          
                          <Typography variant="caption" display="block" color="textSecondary" gutterBottom>
                            {schedule.courseCode}
                          </Typography>
                          
                          <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                            <PersonIcon sx={{ fontSize: 14, mr: 0.5, color: 'text.secondary' }} />
                            <Typography variant="caption" color="textSecondary">
                              {schedule.instructorName || 'TBA'}
                            </Typography>
                          </Box>
                          
                          <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                            <LocationIcon sx={{ fontSize: 14, mr: 0.5, color: 'text.secondary' }} />
                            <Typography variant="caption" color="textSecondary">
                              Room {schedule.classroom}
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
            );
          })}
        </Grid>
      )}

      {/* Weekly Summary */}
      {totalClasses > 0 && (
        <Paper sx={{ mt: 3, p: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Weekly Summary
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <SchoolIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="body2">
                  {uniqueCourses} different courses
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <TimeIcon sx={{ mr: 1, color: 'success.main' }} />
                <Typography variant="body2">
                  {totalHours.toFixed(1)} class hours per week
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <LocationIcon sx={{ mr: 1, color: 'warning.main' }} />
                <Typography variant="body2">
                  {new Set(schedule.map(s => s.classroom)).size} different rooms
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      )}
    </Box>
  );
};

export default StudentSchedule;