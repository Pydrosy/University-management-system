// src/pages/teacher/TeacherStudents.js
import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Chip,
  Avatar,
  TextField,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Card,
  CardContent,
  LinearProgress,
  Alert,
  Tooltip,
  Stack,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Visibility as ViewIcon,
  Refresh as RefreshIcon,
  FileDownload as ExportIcon,
  School as SchoolIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Grade as GradeIcon,
  Assignment as AssignmentIcon,
  ExpandMore as ExpandMoreIcon,
  Close as CloseIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { formatDate } from '../../utils/formatters';

const TeacherStudents = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('all');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [filterAnchorEl, setFilterAnchorEl] = useState(null);

  // Fetch teacher's students
  const { data: coursesWithStudents, isLoading, error, refetch } = useQuery({
    queryKey: ['teacher-students', user?.id],
    queryFn: async () => {
      const response = await api.get('/teachers/students');
      return response.data.data || response.data;
    }
  });

  // Fetch all students for the teacher (flattened list)
  const allStudents = coursesWithStudents?.flatMap(course => 
    course.students.map(student => ({
      ...student,
      courseName: course.course.courseName,
      courseCode: course.course.courseCode,
      courseId: course.course.id
    }))
  ) || [];

  // Filter students based on search and course
  const filteredStudents = allStudents.filter(student => {
    const fullName = `${student.user?.firstName || ''} ${student.user?.lastName || ''}`.toLowerCase();
    const email = (student.user?.email || '').toLowerCase();
    const studentNumber = (student.studentNumber || '').toLowerCase();
    const searchLower = searchTerm.toLowerCase();

    const matchesSearch = 
      fullName.includes(searchLower) ||
      email.includes(searchLower) ||
      studentNumber.includes(searchLower);

    const matchesCourse = selectedCourse === 'all' || student.courseId === selectedCourse;

    return matchesSearch && matchesCourse;
  });

  const paginatedStudents = filteredStudents.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const handleViewStudent = (student) => {
    setSelectedStudent(student);
    setOpenViewDialog(true);
  };

  const handleCloseViewDialog = () => {
    setOpenViewDialog(false);
    setSelectedStudent(null);
  };

  const handleViewGrades = (studentId) => {
    navigate(`/teacher/grades?studentId=${studentId}`);
  };

  const handleViewAssignments = (studentId) => {
    navigate(`/teacher/assignments?studentId=${studentId}`);
  };

  const handleFilterClick = (event) => {
    setFilterAnchorEl(event.currentTarget);
  };

  const handleFilterClose = () => {
    setFilterAnchorEl(null);
  };

  const handleCourseFilter = (courseId) => {
    setSelectedCourse(courseId);
    setPage(0);
    handleFilterClose();
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleExport = () => {
    try {
      const csvContent = [
        ['Student Name', 'Student Number', 'Email', 'Phone', 'Course', 'Major', 'Enrollment Date', 'Current Semester', 'GPA'],
        ...filteredStudents.map(s => [
          `${s.user?.firstName || ''} ${s.user?.lastName || ''}`,
          s.studentNumber || '',
          s.user?.email || '',
          s.user?.phone || '',
          s.courseName || '',
          s.major || '',
          formatDate(s.enrollmentDate),
          s.currentSemester || 1,
          s.gpa || '0.0'
        ])
      ].map(row => row.join(',')).join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `my_students_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ width: '100%', mt: 4 }}>
        <LinearProgress />
        <Typography variant="body2" color="textSecondary" align="center" sx={{ mt: 2 }}>
          Loading your students...
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
          Error loading students. Please try again later.
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
            My Students
          </Typography>
          <Typography variant="body2" color="textSecondary">
            View and manage students enrolled in your courses
          </Typography>
        </Box>
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => refetch()}
          >
            Refresh
          </Button>
          <Button
            variant="outlined"
            startIcon={<ExportIcon />}
            onClick={handleExport}
            disabled={filteredStudents.length === 0}
          >
            Export
          </Button>
        </Stack>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total Students
                  </Typography>
                  <Typography variant="h4">
                    {allStudents.length}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  <PersonIcon />
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
                    Courses Teaching
                  </Typography>
                  <Typography variant="h4">
                    {coursesWithStudents?.length || 0}
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
                    Average GPA
                  </Typography>
                  <Typography variant="h4" color="info.main">
                    {(allStudents.reduce((acc, s) => acc + (parseFloat(s.gpa) || 0), 0) / (allStudents.length || 1)).toFixed(2)}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'info.main' }}>
                  <GradeIcon />
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
                    Pending Tasks
                  </Typography>
                  <Typography variant="h4" color="warning.main">
                    {allStudents.reduce((acc, s) => acc + (s.pendingAssignments || 0), 0)}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'warning.main' }}>
                  <AssignmentIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Course Accordions */}
      <Box sx={{ mb: 3 }}>
        {coursesWithStudents?.map((courseData) => (
          <Accordion key={courseData.course.id} sx={{ mb: 1 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <SchoolIcon color="primary" />
                  <Typography variant="subtitle1" fontWeight="bold">
                    {courseData.course.courseName}
                  </Typography>
                  <Chip 
                    label={courseData.course.courseCode} 
                    size="small" 
                    variant="outlined"
                  />
                </Box>
                <Chip 
                  label={`${courseData.students.length} students`}
                  color="primary"
                  size="small"
                />
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Student</TableCell>
                      <TableCell>Student Number</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>Major</TableCell>
                      <TableCell>Semester</TableCell>
                      <TableCell>GPA</TableCell>
                      <TableCell align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {courseData.students.map((student) => (
                      <TableRow key={student.id} hover>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
                              {student.user?.firstName?.[0]}{student.user?.lastName?.[0]}
                            </Avatar>
                            <Typography variant="body2">
                              {student.user?.firstName} {student.user?.lastName}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>{student.studentNumber}</TableCell>
                        <TableCell>{student.user?.email}</TableCell>
                        <TableCell>{student.major}</TableCell>
                        <TableCell>Semester {student.currentSemester || 1}</TableCell>
                        <TableCell>
                          <Chip
                            label={student.gpa || '0.0'}
                            size="small"
                            color={student.gpa >= 3.5 ? 'success' : student.gpa >= 2.5 ? 'warning' : 'error'}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Tooltip title="View Details">
                            <IconButton size="small" onClick={() => handleViewStudent(student)}>
                              <ViewIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="View Grades">
                            <IconButton size="small" onClick={() => handleViewGrades(student.id)}>
                              <GradeIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="View Assignments">
                            <IconButton size="small" onClick={() => handleViewAssignments(student.id)}>
                              <AssignmentIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </AccordionDetails>
          </Accordion>
        ))}
      </Box>

      {/* Search and Filter */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <TextField
            placeholder="Search students by name, email, or ID..."
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment>,
              endAdornment: searchTerm && (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setSearchTerm('')}>
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{ width: 400 }}
          />
          
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Chip 
              label={`${filteredStudents.length} students`}
              color="primary"
              variant="outlined"
            />
            
            <Button
              variant="outlined"
              size="small"
              startIcon={<FilterIcon />}
              onClick={handleFilterClick}
            >
              {selectedCourse === 'all' ? 'All Courses' : 'Filtered'}
            </Button>
            
            <Menu
              anchorEl={filterAnchorEl}
              open={Boolean(filterAnchorEl)}
              onClose={handleFilterClose}
            >
              <MenuItem onClick={() => handleCourseFilter('all')}>
                <em>All Courses</em>
              </MenuItem>
              <Divider />
              {coursesWithStudents?.map((courseData) => (
                <MenuItem 
                  key={courseData.course.id} 
                  onClick={() => handleCourseFilter(courseData.course.id)}
                >
                  {courseData.course.courseName} ({courseData.course.courseCode})
                </MenuItem>
              ))}
            </Menu>
          </Box>
        </Box>
      </Paper>

      {/* Students Table */}
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer sx={{ maxHeight: 500 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Student</TableCell>
                <TableCell>Student Number</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Phone</TableCell>
                <TableCell>Course</TableCell>
                <TableCell>Major</TableCell>
                <TableCell>GPA</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedStudents.map((student) => (
                <TableRow key={`${student.id}-${student.courseId}`} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar sx={{ bgcolor: 'secondary.main' }}>
                        {student.user?.firstName?.[0]}{student.user?.lastName?.[0]}
                      </Avatar>
                      <Typography variant="body2" fontWeight="bold">
                        {student.user?.firstName} {student.user?.lastName}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>{student.studentNumber}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <EmailIcon fontSize="small" color="action" />
                      {student.user?.email}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <PhoneIcon fontSize="small" color="action" />
                      {student.user?.phone || 'N/A'}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={student.courseCode}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>{student.major}</TableCell>
                  <TableCell>
                    <Chip
                      label={student.gpa || '0.0'}
                      size="small"
                      color={student.gpa >= 3.5 ? 'success' : student.gpa >= 2.5 ? 'warning' : 'error'}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="View Details">
                      <IconButton size="small" onClick={() => handleViewStudent(student)}>
                        <ViewIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="View Grades">
                      <IconButton size="small" onClick={() => handleViewGrades(student.id)}>
                        <GradeIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="View Assignments">
                      <IconButton size="small" onClick={() => handleViewAssignments(student.id)}>
                        <AssignmentIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
              {paginatedStudents.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 5 }}>
                    <Typography color="textSecondary">
                      No students found
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredStudents.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>

      {/* Student Details Dialog */}
      <Dialog 
        open={openViewDialog} 
        onClose={handleCloseViewDialog} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PersonIcon color="primary" />
            <Typography variant="h6">Student Profile</Typography>
          </Box>
          <IconButton
            onClick={handleCloseViewDialog}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {selectedStudent && (
            <Grid container spacing={3}>
              {/* Header */}
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                  <Avatar 
                    sx={{ 
                      width: 80, 
                      height: 80, 
                      bgcolor: 'secondary.main',
                      fontSize: '2rem'
                    }}
                  >
                    {selectedStudent.user?.firstName?.[0]}{selectedStudent.user?.lastName?.[0]}
                  </Avatar>
                  <Box>
                    <Typography variant="h5">
                      {selectedStudent.user?.firstName} {selectedStudent.user?.lastName}
                    </Typography>
                    <Typography variant="subtitle1" color="textSecondary">
                      {selectedStudent.studentNumber}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                      <Chip 
                        label={selectedStudent.courseName}
                        size="small"
                        color="primary"
                      />
                      <Chip 
                        label={`Semester ${selectedStudent.currentSemester || 1}`}
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

              {/* Personal Information */}
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Personal Information
                    </Typography>
                    <Stack spacing={2}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <EmailIcon color="action" />
                        <Typography>{selectedStudent.user?.email}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PhoneIcon color="action" />
                        <Typography>{selectedStudent.user?.phone || 'Not provided'}</Typography>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>

              {/* Academic Information */}
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Academic Information
                    </Typography>
                    <Stack spacing={2}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography color="textSecondary">Major:</Typography>
                        <Typography fontWeight="bold">{selectedStudent.major}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography color="textSecondary">Current Semester:</Typography>
                        <Typography>{selectedStudent.currentSemester || 1}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography color="textSecondary">GPA:</Typography>
                        <Chip 
                          label={selectedStudent.gpa || '0.0'}
                          size="small"
                          color={selectedStudent.gpa >= 3.5 ? 'success' : selectedStudent.gpa >= 2.5 ? 'warning' : 'error'}
                        />
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography color="textSecondary">Enrollment Date:</Typography>
                        <Typography>{formatDate(selectedStudent.enrollmentDate)}</Typography>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>

              {/* Enrolled Courses */}
              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Enrolled Courses
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {coursesWithStudents
                        ?.filter(c => c.students.some(s => s.id === selectedStudent.id))
                        .map(c => (
                          <Chip
                            key={c.course.id}
                            label={`${c.course.courseName} (${c.course.courseCode})`}
                            color="primary"
                            variant="outlined"
                          />
                        ))
                      }
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseViewDialog}>Close</Button>
          <Button 
            variant="contained" 
            onClick={() => handleViewGrades(selectedStudent?.id)}
            startIcon={<GradeIcon />}
          >
            View Grades
          </Button>
          <Button 
            variant="outlined"
            onClick={() => handleViewAssignments(selectedStudent?.id)}
            startIcon={<AssignmentIcon />}
          >
            View Assignments
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TeacherStudents;