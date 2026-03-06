// src/pages/admin/AdminCourses.js
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
  TextField,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  LinearProgress,
  Tooltip,
  Card,
  CardContent,
  Stack,
  Switch,
  FormControlLabel,
  Avatar,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Visibility as ViewIcon,
  Refresh as RefreshIcon,
  FileDownload as ExportIcon,
  School as SchoolIcon,
  People as PeopleIcon,
  Assignment as AssignmentIcon,
  Schedule as ScheduleIcon,
  Book as BookIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { toast } from 'react-toastify';
import api from '../../services/api';
import { formatDate } from '../../utils/formatters';

const validationSchema = yup.object({
  courseCode: yup.string().required('Course code is required'),
  courseName: yup.string().required('Course name is required'),
  credits: yup.number().required('Credits are required').min(1).max(6),
  department: yup.string().required('Department is required'),
  teacherId: yup.string().required('Teacher is required'),
  semester: yup.number().required('Semester is required').min(1).max(8),
  maxStudents: yup.number().required('Maximum students is required').min(1),
  status: yup.string().required('Status is required'),
  startDate: yup.date().required('Start date is required'),
  endDate: yup.date().required('End date is required'),
  description: yup.string(),
});

const AdminCourses = () => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAnchorEl, setFilterAnchorEl] = useState(null);
  const [filterBy, setFilterBy] = useState('all');
  const [openDialog, setOpenDialog] = useState(false);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedCourses, setSelectedCourses] = useState([]);
  const queryClient = useQueryClient();

  // Fetch courses
  const { data: courses, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-courses'],
    queryFn: async () => {
      const response = await api.get('/courses');
      return response.data.data || response.data;
    }
  });

  // Fetch teachers for dropdown
  const { data: teachers } = useQuery({
    queryKey: ['teachers-list'],
    queryFn: async () => {
      const response = await api.get('/teachers');
      return response.data.data || response.data;
    }
  });

  // Create course mutation
  const createMutation = useMutation({
    mutationFn: (newCourse) => api.post('/courses', newCourse),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-courses'] });
      toast.success('Course created successfully');
      setOpenDialog(false);
      formik.resetForm();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create course');
    },
  });

  // Update course mutation
  const updateMutation = useMutation({
    mutationFn: (updatedCourse) => api.put(`/courses/${updatedCourse.id}`, updatedCourse),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-courses'] });
      toast.success('Course updated successfully');
      setOpenDialog(false);
      formik.resetForm();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update course');
    },
  });

  // Delete course mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/courses/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-courses'] });
      toast.success('Course deleted successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete course');
    },
  });

  // Bulk delete mutation
  const bulkDeleteMutation = useMutation({
    mutationFn: (ids) => api.post('/courses/bulk-delete', { ids }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-courses'] });
      setSelectedCourses([]);
      toast.success('Selected courses deleted successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete selected courses');
    },
  });

  const formik = useFormik({
    initialValues: {
      courseCode: selectedCourse?.courseCode || selectedCourse?.course_code || '',
      courseName: selectedCourse?.courseName || selectedCourse?.course_name || '',
      credits: selectedCourse?.credits || '',
      department: selectedCourse?.department || '',
      teacherId: selectedCourse?.teacherId || selectedCourse?.teacher_id || '',
      semester: selectedCourse?.semester || '',
      maxStudents: selectedCourse?.maxStudents || selectedCourse?.max_students || '',
      status: selectedCourse?.status || 'active',
      startDate: selectedCourse?.startDate || selectedCourse?.start_date || '',
      endDate: selectedCourse?.endDate || selectedCourse?.end_date || '',
      description: selectedCourse?.description || '',
    },
    validationSchema,
    enableReinitialize: true,
    onSubmit: (values) => {
      if (selectedCourse) {
        updateMutation.mutate({ id: selectedCourse.id, ...values });
      } else {
        createMutation.mutate(values);
      }
    },
  });

  const handleOpenDialog = (course = null) => {
    setSelectedCourse(course);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedCourse(null);
    formik.resetForm();
  };

  const handleViewCourse = (course) => {
    setSelectedCourse(course);
    setOpenViewDialog(true);
  };

  const handleCloseViewDialog = () => {
    setOpenViewDialog(false);
    setSelectedCourse(null);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this course?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleBulkDelete = () => {
    if (selectedCourses.length === 0) {
      toast.warning('No courses selected');
      return;
    }
    
    if (window.confirm(`Are you sure you want to delete ${selectedCourses.length} selected courses?`)) {
      bulkDeleteMutation.mutate(selectedCourses);
    }
  };

  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelectedCourses(filteredCourses.map(c => c.id));
    } else {
      setSelectedCourses([]);
    }
  };

  const handleSelectCourse = (id) => {
    setSelectedCourses(prev => 
      prev.includes(id) ? prev.filter(cId => cId !== id) : [...prev, id]
    );
  };

  const handleExport = () => {
    const csvContent = [
      ['ID', 'Course Code', 'Course Name', 'Department', 'Credits', 'Teacher', 'Semester', 'Students', 'Status', 'Start Date', 'End Date'],
      ...filteredCourses.map(c => [
        c.id,
        c.courseCode || c.course_code,
        c.courseName || c.course_name,
        c.department,
        c.credits,
        c.teacherName || c.teacher_name || 'Not assigned',
        c.semester,
        `${c.enrolledStudents || c.enrolled_students || 0}/${c.maxStudents || c.max_students || 0}`,
        c.status,
        formatDate(c.startDate || c.start_date),
        formatDate(c.endDate || c.end_date)
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `courses_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const handleFilterClick = (event) => {
    setFilterAnchorEl(event.currentTarget);
  };

  const handleFilterClose = () => {
    setFilterAnchorEl(null);
  };

  const handleFilterSelect = (filter) => {
    setFilterBy(filter);
    handleFilterClose();
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Get teacher name by ID
  const getTeacherName = (teacherId) => {
    const teacher = teachers?.find(t => t.id === teacherId);
    return teacher ? `${teacher.firstName || teacher.first_name} ${teacher.lastName || teacher.last_name}` : 'Not assigned';
  };

  // Filter courses based on search and filter
  const filteredCourses = courses?.filter((course) => {
    const teacherName = getTeacherName(course.teacherId || course.teacher_id);
    
    const matchesSearch = 
      (course.courseCode || course.course_code || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (course.courseName || course.course_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (course.department || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacherName.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterBy === 'all') return matchesSearch;
    if (filterBy === 'active') return matchesSearch && course.status === 'active';
    if (filterBy === 'inactive') return matchesSearch && course.status === 'inactive';
    if (filterBy === 'completed') return matchesSearch && course.status === 'completed';
    return matchesSearch;
  }) || [];

  const paginatedCourses = filteredCourses.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const departments = [
    'Computer Science',
    'Engineering',
    'Business Administration',
    'Mathematics',
    'Physics',
    'Chemistry',
    'Biology',
    'Psychology',
    'Economics',
    'English Literature',
    'History',
    'Art',
    'Music',
  ];

  const semesters = [1, 2, 3, 4, 5, 6, 7, 8];

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
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Course Management</Typography>
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
          >
            Export
          </Button>
          {selectedCourses.length > 0 && (
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={handleBulkDelete}
            >
              Delete Selected ({selectedCourses.length})
            </Button>
          )}
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Add Course
          </Button>
        </Stack>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Courses
              </Typography>
              <Typography variant="h4">
                {courses?.length || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Active Courses
              </Typography>
              <Typography variant="h4" color="success.main">
                {courses?.filter(c => c.status === 'active').length || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Credits
              </Typography>
              <Typography variant="h4" color="primary">
                {courses?.reduce((acc, c) => acc + (c.credits || 0), 0) || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Enrollments
              </Typography>
              <Typography variant="h4" color="info.main">
                {courses?.reduce((acc, c) => acc + (c.enrolledStudents || c.enrolled_students || 0), 0) || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <TextField
            placeholder="Search courses..."
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ width: 300 }}
          />
          
          <Box display="flex" alignItems="center" gap={2}>
            <Chip 
              label={`${filteredCourses.length} courses`}
              color="primary"
              variant="outlined"
            />
            <Button
              variant="outlined"
              size="small"
              startIcon={<FilterIcon />}
              onClick={handleFilterClick}
            >
              Filter: {filterBy.charAt(0).toUpperCase() + filterBy.slice(1)}
            </Button>
          </Box>
        </Box>

        <TableContainer sx={{ maxHeight: 500 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <input
                    type="checkbox"
                    checked={selectedCourses.length === filteredCourses.length && filteredCourses.length > 0}
                    onChange={handleSelectAll}
                    style={{ cursor: 'pointer' }}
                  />
                </TableCell>
                <TableCell>Course</TableCell>
                <TableCell>Code</TableCell>
                <TableCell>Department</TableCell>
                <TableCell>Credits</TableCell>
                <TableCell>Teacher</TableCell>
                <TableCell>Semester</TableCell>
                <TableCell>Students</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedCourses.map((course) => {
                const teacherName = getTeacherName(course.teacherId || course.teacher_id);
                const enrolled = course.enrolledStudents || course.enrolled_students || 0;
                const maxStudents = course.maxStudents || course.max_students || 0;
                const fillPercentage = maxStudents > 0 ? (enrolled / maxStudents) * 100 : 0;
                
                return (
                  <TableRow 
                    hover 
                    key={course.id}
                    selected={selectedCourses.includes(course.id)}
                    sx={{ cursor: 'pointer' }}
                  >
                    <TableCell padding="checkbox">
                      <input
                        type="checkbox"
                        checked={selectedCourses.includes(course.id)}
                        onChange={() => handleSelectCourse(course.id)}
                        style={{ cursor: 'pointer' }}
                      />
                    </TableCell>
                    <TableCell onClick={() => handleViewCourse(course)}>
                      <Box display="flex" alignItems="center">
                        <Avatar sx={{ mr: 2, bgcolor: 'info.main' }}>
                          <BookIcon />
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight="bold">
                            {course.courseName || course.course_name}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {course.courseCode || course.course_code}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell onClick={() => handleViewCourse(course)}>
                      {course.courseCode || course.course_code}
                    </TableCell>
                    <TableCell onClick={() => handleViewCourse(course)}>
                      {course.department}
                    </TableCell>
                    <TableCell onClick={() => handleViewCourse(course)}>
                      {course.credits}
                    </TableCell>
                    <TableCell onClick={() => handleViewCourse(course)}>
                      {teacherName}
                    </TableCell>
                    <TableCell onClick={() => handleViewCourse(course)}>
                      Semester {course.semester}
                    </TableCell>
                    <TableCell onClick={() => handleViewCourse(course)}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="body2">
                          {enrolled}/{maxStudents}
                        </Typography>
                        <LinearProgress 
                          variant="determinate" 
                          value={fillPercentage} 
                          sx={{ 
                            width: 50, 
                            height: 6, 
                            borderRadius: 3,
                            bgcolor: '#e0e0e0',
                            '& .MuiLinearProgress-bar': {
                              bgcolor: fillPercentage > 90 ? 'error.main' : 
                                      fillPercentage > 75 ? 'warning.main' : 'success.main'
                            }
                          }}
                        />
                      </Box>
                    </TableCell>
                    <TableCell onClick={() => handleViewCourse(course)}>
                      <Chip
                        label={course.status}
                        color={course.status === 'active' ? 'success' : 
                               course.status === 'inactive' ? 'default' : 'info'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="View">
                        <IconButton size="small" onClick={() => handleViewCourse(course)}>
                          <ViewIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit">
                        <IconButton size="small" onClick={() => handleOpenDialog(course)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton size="small" onClick={() => handleDelete(course.id)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}
              {paginatedCourses.length === 0 && (
                <TableRow>
                  <TableCell colSpan={10} align="center" sx={{ py: 3 }}>
                    <Typography color="textSecondary">
                      No courses found
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50, 100]}
          component="div"
          count={filteredCourses.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>

      {/* Course Form Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedCourse ? 'Edit Course' : 'Add New Course'}
        </DialogTitle>
        <form onSubmit={formik.handleSubmit}>
          <DialogContent dividers>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  name="courseCode"
                  label="Course Code"
                  value={formik.values.courseCode}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.courseCode && Boolean(formik.errors.courseCode)}
                  helperText={formik.touched.courseCode && formik.errors.courseCode}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  name="courseName"
                  label="Course Name"
                  value={formik.values.courseName}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.courseName && Boolean(formik.errors.courseName)}
                  helperText={formik.touched.courseName && formik.errors.courseName}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  name="credits"
                  label="Credits"
                  type="number"
                  value={formik.values.credits}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.credits && Boolean(formik.errors.credits)}
                  helperText={formik.touched.credits && formik.errors.credits}
                  margin="normal"
                  inputProps={{ min: 1, max: 6 }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Department</InputLabel>
                  <Select
                    name="department"
                    value={formik.values.department}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.department && Boolean(formik.errors.department)}
                  >
                    {departments.map((dept) => (
                      <MenuItem key={dept} value={dept}>
                        {dept}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Teacher</InputLabel>
                  <Select
                    name="teacherId"
                    value={formik.values.teacherId}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.teacherId && Boolean(formik.errors.teacherId)}
                  >
                    <MenuItem value="">Select Teacher</MenuItem>
                    {teachers?.map((teacher) => (
                      <MenuItem key={teacher.id} value={teacher.id}>
                        {teacher.firstName || teacher.first_name} {teacher.lastName || teacher.last_name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Semester</InputLabel>
                  <Select
                    name="semester"
                    value={formik.values.semester}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.semester && Boolean(formik.errors.semester)}
                  >
                    {semesters.map((sem) => (
                      <MenuItem key={sem} value={sem}>
                        Semester {sem}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  name="maxStudents"
                  label="Maximum Students"
                  type="number"
                  value={formik.values.maxStudents}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.maxStudents && Boolean(formik.errors.maxStudents)}
                  helperText={formik.touched.maxStudents && formik.errors.maxStudents}
                  margin="normal"
                  inputProps={{ min: 1 }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Status</InputLabel>
                  <Select
                    name="status"
                    value={formik.values.status}
                    onChange={formik.handleChange}
                  >
                    <MenuItem value="active">Active</MenuItem>
                    <MenuItem value="inactive">Inactive</MenuItem>
                    <MenuItem value="completed">Completed</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  name="startDate"
                  label="Start Date"
                  type="date"
                  value={formik.values.startDate}
                  onChange={formik.handleChange}
                  InputLabelProps={{ shrink: true }}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  name="endDate"
                  label="End Date"
                  type="date"
                  value={formik.values.endDate}
                  onChange={formik.handleChange}
                  InputLabelProps={{ shrink: true }}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  name="description"
                  label="Description"
                  multiline
                  rows={3}
                  value={formik.values.description}
                  onChange={formik.handleChange}
                  margin="normal"
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button 
              type="submit" 
              variant="contained" 
              color="primary"
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {createMutation.isPending || updateMutation.isPending 
                ? 'Saving...' 
                : (selectedCourse ? 'Update' : 'Create')}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* View Course Dialog */}
      <Dialog open={openViewDialog} onClose={handleCloseViewDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          Course Details
          <IconButton
            onClick={handleCloseViewDialog}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <DeleteIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {selectedCourse && (
            <Grid container spacing={3}>
              <Grid item xs={12} display="flex" alignItems="center" gap={2}>
                <Avatar sx={{ width: 80, height: 80, bgcolor: 'info.main', fontSize: '2rem' }}>
                  <BookIcon />
                </Avatar>
                <Box>
                  <Typography variant="h5">
                    {selectedCourse.courseName || selectedCourse.course_name}
                  </Typography>
                  <Typography variant="subtitle1" color="textSecondary">
                    {selectedCourse.courseCode || selectedCourse.course_code}
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Basic Information</Typography>
                    <Stack spacing={2}>
                      <Box display="flex" justifyContent="space-between">
                        <Typography color="textSecondary">Department:</Typography>
                        <Typography fontWeight="bold">{selectedCourse.department}</Typography>
                      </Box>
                      <Box display="flex" justifyContent="space-between">
                        <Typography color="textSecondary">Credits:</Typography>
                        <Typography>{selectedCourse.credits}</Typography>
                      </Box>
                      <Box display="flex" justifyContent="space-between">
                        <Typography color="textSecondary">Semester:</Typography>
                        <Typography>Semester {selectedCourse.semester}</Typography>
                      </Box>
                      <Box display="flex" justifyContent="space-between">
                        <Typography color="textSecondary">Status:</Typography>
                        <Chip 
                          label={selectedCourse.status}
                          color={selectedCourse.status === 'active' ? 'success' : 
                                 selectedCourse.status === 'inactive' ? 'default' : 'info'}
                        />
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Teacher Information</Typography>
                    <Stack spacing={2}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <SchoolIcon color="action" />
                        <Typography>
                          {getTeacherName(selectedCourse.teacherId || selectedCourse.teacher_id)}
                        </Typography>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Schedule & Capacity</Typography>
                    <Stack spacing={2}>
                      <Box display="flex" justifyContent="space-between">
                        <Typography color="textSecondary">Start Date:</Typography>
                        <Typography>{formatDate(selectedCourse.startDate || selectedCourse.start_date)}</Typography>
                      </Box>
                      <Box display="flex" justifyContent="space-between">
                        <Typography color="textSecondary">End Date:</Typography>
                        <Typography>{formatDate(selectedCourse.endDate || selectedCourse.end_date)}</Typography>
                      </Box>
                      <Box display="flex" justifyContent="space-between">
                        <Typography color="textSecondary">Enrollment:</Typography>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography>
                            {selectedCourse.enrolledStudents || selectedCourse.enrolled_students || 0} / {selectedCourse.maxStudents || selectedCourse.max_students || 0}
                          </Typography>
                          <Chip 
                            size="small"
                            label={`${Math.round(((selectedCourse.enrolledStudents || selectedCourse.enrolled_students || 0) / (selectedCourse.maxStudents || selectedCourse.max_students || 1)) * 100)}%`}
                            color="primary"
                          />
                        </Box>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Quick Stats</Typography>
                    <Stack spacing={2}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <PeopleIcon color="action" />
                        <Typography>Enrolled Students: {selectedCourse.enrolledStudents || selectedCourse.enrolled_students || 0}</Typography>
                      </Box>
                      <Box display="flex" alignItems="center" gap={1}>
                        <AssignmentIcon color="action" />
                        <Typography>Assignments: {selectedCourse.assignmentCount || 0}</Typography>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>

              {selectedCourse.description && (
                <Grid item xs={12}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>Description</Typography>
                      <Typography>{selectedCourse.description}</Typography>
                    </CardContent>
                  </Card>
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
              handleOpenDialog(selectedCourse);
            }}
          >
            Edit
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminCourses;