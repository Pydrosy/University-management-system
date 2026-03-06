// src/pages/teacher/TeacherCourses.js
import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Grid,
  Card,
  CardContent,
  CardActions,
  Chip,
  Avatar,
  LinearProgress,
  Alert,
  Tooltip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  School as SchoolIcon,
  People as PeopleIcon,
  Assignment as AssignmentIcon,
  Grade as GradeIcon,
  Schedule as ScheduleIcon,
  ExpandMore as ExpandMoreIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  AccessTime as TimeIcon,
  LocationOn as LocationIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { formatDate } from '../../utils/formatters';

const TeacherCourses = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [openAssignmentDialog, setOpenAssignmentDialog] = useState(false);

  // Fetch teacher's courses
  const { data: courses, isLoading, error, refetch } = useQuery({
    queryKey: ['teacher-courses', user?.id],
    queryFn: async () => {
      const response = await api.get('/teachers/courses');
      return response.data.data || response.data;
    }
  });

  // Fetch course statistics
  const { data: courseStats } = useQuery({
    queryKey: ['course-stats'],
    queryFn: async () => {
      const response = await api.get('/courses/stats');
      return response.data.data;
    }
  });

  const handleViewCourse = (course) => {
    setSelectedCourse(course);
    setOpenViewDialog(true);
  };

  const handleCloseViewDialog = () => {
    setOpenViewDialog(false);
    setSelectedCourse(null);
  };

  const handleCreateAssignment = (course) => {
    navigate(`/teacher/assignments?courseId=${course.id}`);
  };

  const handleViewGrades = (course) => {
    navigate(`/teacher/grades?courseId=${course.id}`);
  };

  const handleViewStudents = (course) => {
    navigate(`/teacher/students?courseId=${course.id}`);
  };

  const handleViewSchedule = (course) => {
    navigate(`/teacher/schedule?courseId=${course.id}`);
  };

  // Calculate course progress
  const calculateProgress = (course) => {
    if (!course.assignments || course.assignments.length === 0) return 0;
    const graded = course.assignments.filter(a => a.status === 'graded').length;
    return Math.round((graded / course.assignments.length) * 100);
  };

  // Get course status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'success';
      case 'inactive': return 'default';
      case 'completed': return 'info';
      default: return 'default';
    }
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            My Courses
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Manage your courses, view students, and track progress
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={() => refetch()}
        >
          Refresh
        </Button>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total Courses
                  </Typography>
                  <Typography variant="h4">
                    {courses?.length || 0}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'primary.main' }}>
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
                    Total Students
                  </Typography>
                  <Typography variant="h4">
                    {courseStats?.totalStudents || 0}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'success.main' }}>
                  <PeopleIcon />
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
                    Active Assignments
                  </Typography>
                  <Typography variant="h4">
                    {courseStats?.activeAssignments || 0}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'warning.main' }}>
                  <AssignmentIcon />
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
                    Pending Grading
                  </Typography>
                  <Typography variant="h4" color="warning.main">
                    {courseStats?.pendingGrading || 0}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'error.main' }}>
                  <GradeIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Courses Grid */}
      <Grid container spacing={3}>
        {courses?.map((course) => {
          const progress = calculateProgress(course);
          const isActive = course.status === 'active';
          
          return (
            <Grid item xs={12} md={6} lg={4} key={course.id}>
              <Card sx={{ 
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                '&:hover': {
                  boxShadow: 6,
                }
              }}>
                {/* Status Chip */}
                <Chip
                  label={course.status}
                  color={getStatusColor(course.status)}
                  size="small"
                  sx={{
                    position: 'absolute',
                    top: 12,
                    right: 12,
                    zIndex: 1
                  }}
                />

                <CardContent sx={{ flexGrow: 1 }}>
                  {/* Course Header */}
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                      <SchoolIcon />
                    </Avatar>
                    <Box>
                      <Typography variant="h6" component="h2">
                        {course.courseName}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {course.courseCode}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Course Details */}
                  <Stack spacing={1} sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <PeopleIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body2">
                        {course.enrolledStudents || 0} Students Enrolled
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <AssignmentIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body2">
                        {course.assignments?.length || 0} Assignments
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <TimeIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body2">
                        {course.semester ? `Semester ${course.semester}` : 'Ongoing'}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <LocationIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body2">
                        {course.department}
                      </Typography>
                    </Box>
                  </Stack>

                  {/* Progress Bar */}
                  <Box sx={{ mt: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="caption" color="textSecondary">
                        Grading Progress
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
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
                          bgcolor: progress === 100 ? 'success.main' : 'primary.main'
                        }
                      }}
                    />
                  </Box>

                  {/* Course Description */}
                  {course.description && (
                    <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
                      {course.description.length > 100 
                        ? `${course.description.substring(0, 100)}...` 
                        : course.description}
                    </Typography>
                  )}
                </CardContent>

                <Divider />

                {/* Action Buttons */}
                <CardActions sx={{ justifyContent: 'space-between', p: 2 }}>
                  <Tooltip title="View Details">
                    <Button 
                      size="small" 
                      startIcon={<ViewIcon />}
                      onClick={() => handleViewCourse(course)}
                    >
                      View
                    </Button>
                  </Tooltip>
                  <Tooltip title="Manage Assignments">
                    <Button 
                      size="small" 
                      startIcon={<AssignmentIcon />}
                      onClick={() => handleCreateAssignment(course)}
                    >
                      Assignments
                    </Button>
                  </Tooltip>
                  <Tooltip title="View Grades">
                    <Button 
                      size="small" 
                      startIcon={<GradeIcon />}
                      onClick={() => handleViewGrades(course)}
                    >
                      Grades
                    </Button>
                  </Tooltip>
                </CardActions>
              </Card>
            </Grid>
          );
        })}

        {/* Empty State */}
        {(!courses || courses.length === 0) && (
          <Grid item xs={12}>
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <SchoolIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="textSecondary" gutterBottom>
                No Courses Assigned
              </Typography>
              <Typography variant="body2" color="textSecondary">
                You haven't been assigned any courses yet. Contact the administrator to get started.
              </Typography>
            </Paper>
          </Grid>
        )}
      </Grid>

      {/* Course Details Dialog */}
      <Dialog 
        open={openViewDialog} 
        onClose={handleCloseViewDialog} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SchoolIcon color="primary" />
            <Typography variant="h6">Course Details</Typography>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {selectedCourse && (
            <Grid container spacing={3}>
              {/* Course Header */}
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ width: 60, height: 60, bgcolor: 'primary.main' }}>
                    <SchoolIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h5">{selectedCourse.courseName}</Typography>
                    <Typography variant="subtitle1" color="textSecondary">
                      {selectedCourse.courseCode}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                      <Chip 
                        label={selectedCourse.status} 
                        color={getStatusColor(selectedCourse.status)}
                        size="small"
                      />
                      <Chip 
                        icon={<PeopleIcon />}
                        label={`${selectedCourse.enrolledStudents || 0} Students`}
                        size="small"
                        variant="outlined"
                      />
                    </Box>
                  </Box>
                </Box>
              </Grid>

              <Grid item xs={12}>
                <Divider />
              </Grid>

              {/* Course Information */}
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                  Course Information
                </Typography>
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="body2" color="textSecondary">Department</Typography>
                    <Typography variant="body1">{selectedCourse.department}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="textSecondary">Credits</Typography>
                    <Typography variant="body1">{selectedCourse.credits || 'Not specified'}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="textSecondary">Semester</Typography>
                    <Typography variant="body1">{selectedCourse.semester || 'Not specified'}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="textSecondary">Schedule</Typography>
                    <Typography variant="body1">
                      {selectedCourse.schedule || 'To be arranged'}
                    </Typography>
                  </Box>
                </Stack>
              </Grid>

              {/* Statistics */}
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                  Course Statistics
                </Typography>
                <Stack spacing={2}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Enrolled Students:</Typography>
                    <Chip 
                      label={selectedCourse.enrolledStudents || 0}
                      size="small"
                      color="primary"
                    />
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Assignments:</Typography>
                    <Chip 
                      label={selectedCourse.assignments?.length || 0}
                      size="small"
                      color="info"
                    />
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Pending Grading:</Typography>
                    <Chip 
                      label={selectedCourse.pendingGrading || 0}
                      size="small"
                      color="warning"
                    />
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Average Grade:</Typography>
                    <Chip 
                      label={selectedCourse.averageGrade || 'N/A'}
                      size="small"
                      color="success"
                    />
                  </Box>
                </Stack>
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

              {/* Recent Assignments */}
              {selectedCourse.assignments && selectedCourse.assignments.length > 0 && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                    Recent Assignments
                  </Typography>
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Title</TableCell>
                          <TableCell>Due Date</TableCell>
                          <TableCell>Submissions</TableCell>
                          <TableCell>Status</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {selectedCourse.assignments.slice(0, 5).map((assignment) => (
                          <TableRow key={assignment.id}>
                            <TableCell>{assignment.title}</TableCell>
                            <TableCell>
                              {new Date(assignment.dueDate).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              {assignment.submissions?.length || 0}
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={assignment.status}
                                size="small"
                                color={assignment.status === 'published' ? 'success' : 'default'}
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseViewDialog}>Close</Button>
          <Button 
            variant="contained" 
            onClick={() => {
              handleCloseViewDialog();
              handleCreateAssignment(selectedCourse);
            }}
            startIcon={<AssignmentIcon />}
          >
            Create Assignment
          </Button>
          <Button 
            variant="outlined" 
            onClick={() => {
              handleCloseViewDialog();
              handleViewGrades(selectedCourse);
            }}
          >
            View Grades
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TeacherCourses;