// src/pages/student/StudentCourses.js
import React, { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  CardMedia,
  Button,
  Chip,
  LinearProgress,
  Alert,
  Paper,
  Avatar,
  Divider,
  Stack,
  Tooltip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  School as SchoolIcon,
  Schedule as ScheduleIcon,
  Assignment as AssignmentIcon,
  Person as PersonIcon,
  ExpandMore as ExpandMoreIcon,
  Grade as GradeIcon,
  Event as EventIcon,
  AccessTime as TimeIcon,
  LocationOn as LocationIcon,
  MenuBook as MenuBookIcon,
  PlayCircleOutline as PlayIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { formatDate } from '../../utils/formatters';

const StudentCourses = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [openDetailsDialog, setOpenDetailsDialog] = useState(false);

  // Fetch student courses
  const { data: response, isLoading, error, refetch } = useQuery({
    queryKey: ['studentCourses'],
    queryFn: async () => {
      console.log('Fetching courses for student:', user?.id);
      const res = await api.get('/students/courses');
      console.log('Courses response:', res.data);
      return res.data;
    }
  });

  const courses = response?.data || [];

  const handleViewDetails = (course) => {
    setSelectedCourse(course);
    setOpenDetailsDialog(true);
  };

  const handleCloseDetails = () => {
    setOpenDetailsDialog(false);
    setSelectedCourse(null);
  };

  const handleViewAssignments = (courseId) => {
    navigate(`/student/assignments?courseId=${courseId}`);
  };

  const handleViewMaterials = (courseId) => {
    navigate(`/student/materials?courseId=${courseId}`);
  };

  const getProgressColor = (progress) => {
    if (progress >= 80) return 'success';
    if (progress >= 50) return 'info';
    if (progress >= 25) return 'warning';
    return 'error';
  };

  if (isLoading) {
    return (
      <Box sx={{ width: '100%', mt: 4 }}>
        <LinearProgress />
        <Typography variant="body2" color="textSecondary" align="center" sx={{ mt: 2 }}>
          Loading your courses...
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
          Error loading courses. Please try again later.
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          My Courses
        </Typography>
        <Typography variant="subtitle1" color="textSecondary">
          You are enrolled in {courses.length} {courses.length === 1 ? 'course' : 'courses'}
        </Typography>
      </Box>

      {/* Stats Summary */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Avatar sx={{ bgcolor: 'primary.main', mx: 'auto', mb: 1 }}>
              <SchoolIcon />
            </Avatar>
            <Typography variant="h5">{courses.length}</Typography>
            <Typography variant="body2" color="textSecondary">Total Courses</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Avatar sx={{ bgcolor: 'success.main', mx: 'auto', mb: 1 }}>
              <AssignmentIcon />
            </Avatar>
            <Typography variant="h5">
              {courses.reduce((sum, c) => sum + (c.assignments?.length || 0), 0)}
            </Typography>
            <Typography variant="body2" color="textSecondary">Total Assignments</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Avatar sx={{ bgcolor: 'info.main', mx: 'auto', mb: 1 }}>
              <GradeIcon />
            </Avatar>
            <Typography variant="h5">
              {courses.reduce((sum, c) => sum + (c.credits || 0), 0)}
            </Typography>
            <Typography variant="body2" color="textSecondary">Total Credits</Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Courses Grid */}
      <Grid container spacing={3}>
        {courses.length > 0 ? (
          courses.map((course) => {
            const progress = course.progress || 0;
            const progressColor = getProgressColor(progress);
            
            return (
              <Grid item xs={12} md={6} lg={4} key={course.id}>
                <Card sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 6
                  }
                }}>
                  {/* Course Header with Color Accent */}
                  <Box sx={{ 
                    height: 8, 
                    bgcolor: progressColor === 'success' ? 'success.main' :
                             progressColor === 'info' ? 'info.main' :
                             progressColor === 'warning' ? 'warning.main' : 'error.main'
                  }} />
                  
                  <CardContent sx={{ flexGrow: 1 }}>
                    {/* Title and Code */}
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                      <Typography variant="h6" component="h2" sx={{ fontWeight: 'bold', mr: 1 }}>
                        {course.courseName}
                      </Typography>
                      <Chip
                        label={course.courseCode}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    </Box>
                    
                    {/* Department */}
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      {course.department}
                    </Typography>
                    
                    {/* Description */}
                    {course.description && (
                      <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                        {course.description.length > 100 
                          ? `${course.description.substring(0, 100)}...` 
                          : course.description}
                      </Typography>
                    )}
                    
                    {/* Course Details */}
                    <Stack spacing={1.5} sx={{ mt: 2 }}>
                      <Box display="flex" alignItems="center">
                        <PersonIcon sx={{ fontSize: 20, mr: 1, color: 'text.secondary' }} />
                        <Typography variant="body2">
                          {course.instructorName || 'Not assigned'}
                        </Typography>
                      </Box>
                      
                      {course.schedules && course.schedules.length > 0 && (
                        <Box display="flex" alignItems="flex-start">
                          <ScheduleIcon sx={{ fontSize: 20, mr: 1, color: 'text.secondary', mt: 0.5 }} />
                          <Box>
                            {course.schedules.slice(0, 2).map((schedule, idx) => (
                              <Typography key={idx} variant="body2">
                                {schedule.dayOfWeek}: {schedule.startTime} - {schedule.endTime}
                              </Typography>
                            ))}
                            {course.schedules.length > 2 && (
                              <Typography variant="caption" color="textSecondary">
                                +{course.schedules.length - 2} more sessions
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      )}
                      
                      <Box display="flex" alignItems="center">
                        <AssignmentIcon sx={{ fontSize: 20, mr: 1, color: 'text.secondary' }} />
                        <Typography variant="body2">
                          {course.assignments?.length || 0} Assignments
                        </Typography>
                      </Box>

                      <Box display="flex" alignItems="center">
                        <MenuBookIcon sx={{ fontSize: 20, mr: 1, color: 'text.secondary' }} />
                        <Typography variant="body2">
                          Credits: {course.credits}
                        </Typography>
                      </Box>
                    </Stack>

                    {/* Progress Bar */}
                    <Box sx={{ mt: 3 }}>
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                        <Typography variant="caption" color="textSecondary">
                          Course Progress
                        </Typography>
                        <Typography variant="caption" fontWeight="bold" color={`${progressColor}.main`}>
                          {progress}%
                        </Typography>
                      </Box>
                      <LinearProgress 
                        variant="determinate" 
                        value={progress} 
                        sx={{ 
                          height: 6, 
                          borderRadius: 3,
                          bgcolor: 'grey.200',
                          '& .MuiLinearProgress-bar': {
                            bgcolor: progressColor === 'success' ? 'success.main' :
                                     progressColor === 'info' ? 'info.main' :
                                     progressColor === 'warning' ? 'warning.main' : 'error.main'
                          }
                        }}
                      />
                    </Box>
                  </CardContent>
                  
                  <Divider />
                  
                  <CardActions sx={{ justifyContent: 'space-between', p: 2 }}>
                    <Tooltip title="View Course Details">
                      <Button 
                        size="small" 
                        startIcon={<InfoIcon />}
                        onClick={() => handleViewDetails(course)}
                      >
                        Details
                      </Button>
                    </Tooltip>
                    <Tooltip title="View Assignments">
                      <Button 
                        size="small" 
                        startIcon={<AssignmentIcon />}
                        onClick={() => handleViewAssignments(course.id)}
                      >
                        Assignments
                      </Button>
                    </Tooltip>
                    <Tooltip title="Course Materials">
                      <Button 
                        size="small" 
                        startIcon={<MenuBookIcon />}
                        onClick={() => handleViewMaterials(course.id)}
                      >
                        Materials
                      </Button>
                    </Tooltip>
                  </CardActions>
                </Card>
              </Grid>
            );
          })
        ) : (
          <Grid item xs={12}>
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <SchoolIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="textSecondary" gutterBottom>
                No Courses Enrolled
              </Typography>
              <Typography variant="body2" color="textSecondary">
                You are not enrolled in any courses yet. Please contact the administration.
              </Typography>
            </Paper>
          </Grid>
        )}
      </Grid>

      {/* Course Details Dialog */}
      <Dialog 
        open={openDetailsDialog} 
        onClose={handleCloseDetails} 
        maxWidth="md" 
        fullWidth
      >
        {selectedCourse && (
          <>
            <DialogTitle>
              <Box display="flex" alignItems="center" gap={1}>
                <SchoolIcon color="primary" />
                <Typography variant="h6">Course Details</Typography>
              </Box>
            </DialogTitle>
            <DialogContent dividers>
              <Grid container spacing={3}>
                {/* Course Header */}
                <Grid item xs={12}>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                    <Box>
                      <Typography variant="h5">{selectedCourse.courseName}</Typography>
                      <Typography variant="subtitle1" color="textSecondary">
                        {selectedCourse.courseCode}
                      </Typography>
                    </Box>
                    <Chip
                      label={`Credits: ${selectedCourse.credits}`}
                      color="primary"
                      variant="outlined"
                    />
                  </Box>
                </Grid>

                <Grid item xs={12}>
                  <Divider />
                </Grid>

                {/* Description */}
                {selectedCourse.description && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                      Description
                    </Typography>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <Typography variant="body2">{selectedCourse.description}</Typography>
                    </Paper>
                  </Grid>
                )}

                {/* Course Information */}
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                    Course Information
                  </Typography>
                  <Stack spacing={1}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <PersonIcon fontSize="small" color="action" />
                      <Typography variant="body2">
                        Instructor: {selectedCourse.instructorName || 'Not assigned'}
                      </Typography>
                    </Box>
                    <Box display="flex" alignItems="center" gap={1}>
                      <MenuBookIcon fontSize="small" color="action" />
                      <Typography variant="body2">
                        Department: {selectedCourse.department}
                      </Typography>
                    </Box>
                    <Box display="flex" alignItems="center" gap={1}>
                      <GradeIcon fontSize="small" color="action" />
                      <Typography variant="body2">
                        Credits: {selectedCourse.credits}
                      </Typography>
                    </Box>
                    <Box display="flex" alignItems="center" gap={1}>
                      <AssignmentIcon fontSize="small" color="action" />
                      <Typography variant="body2">
                        Assignments: {selectedCourse.assignments?.length || 0}
                      </Typography>
                    </Box>
                  </Stack>
                </Grid>

                {/* Schedule */}
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                    Class Schedule
                  </Typography>
                  {selectedCourse.schedules && selectedCourse.schedules.length > 0 ? (
                    <List dense>
                      {selectedCourse.schedules.map((schedule, idx) => (
                        <ListItem key={idx} sx={{ px: 0 }}>
                          <ListItemIcon sx={{ minWidth: 36 }}>
                            <EventIcon fontSize="small" color="action" />
                          </ListItemIcon>
                          <ListItemText
                            primary={schedule.dayOfWeek}
                            secondary={`${schedule.startTime} - ${schedule.endTime} | Room: ${schedule.classroom}`}
                          />
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <Typography variant="body2" color="textSecondary">
                      No schedule available
                    </Typography>
                  )}
                </Grid>

                {/* Assignments Preview */}
                {selectedCourse.assignments && selectedCourse.assignments.length > 0 && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                      Recent Assignments
                    </Typography>
                    <List>
                      {selectedCourse.assignments.slice(0, 3).map((assignment) => {
                        const isOverdue = new Date(assignment.dueDate) < new Date();
                        return (
                          <ListItem key={assignment.id} sx={{ px: 0 }}>
                            <ListItemIcon sx={{ minWidth: 36 }}>
                              <AssignmentIcon fontSize="small" color={isOverdue ? 'error' : 'primary'} />
                            </ListItemIcon>
                            <ListItemText
                              primary={assignment.title}
                              secondary={
                                <Box component="span">
                                  <Typography component="span" variant="caption" color="textSecondary">
                                    Due: {formatDate(assignment.dueDate)}
                                  </Typography>
                                  {isOverdue && (
                                    <Chip
                                      label="Overdue"
                                      color="error"
                                      size="small"
                                      sx={{ ml: 1, height: 20 }}
                                    />
                                  )}
                                </Box>
                              }
                            />
                          </ListItem>
                        );
                      })}
                    </List>
                  </Grid>
                )}
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDetails}>Close</Button>
              <Button 
                variant="contained" 
                onClick={() => {
                  handleCloseDetails();
                  handleViewAssignments(selectedCourse.id);
                }}
                startIcon={<AssignmentIcon />}
              >
                View All Assignments
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default StudentCourses;