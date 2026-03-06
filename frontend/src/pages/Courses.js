// src/pages/Courses.js
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
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { toast } from 'react-toastify';
import api from '../services/api';

const validationSchema = yup.object({
  courseCode: yup.string().required('Course code is required'),
  courseName: yup.string().required('Course name is required'),
  credits: yup.number().required('Credits are required').min(1).max(6),
  department: yup.string().required('Department is required'),
  teacherId: yup.string().required('Teacher is required'),
  semester: yup.number().required('Semester is required').min(1).max(8),
  maxStudents: yup.number().required('Maximum students is required').min(1),
  description: yup.string(),
});

const Courses = () => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const queryClient = useQueryClient();

  const { data: courses, isLoading: coursesLoading, error: coursesError } = useQuery({
    queryKey: ['courses'],
    queryFn: () => api.get('/courses').then(res => res.data),
  });

  const { data: teachers } = useQuery({
    queryKey: ['teachers-list'],
    queryFn: () => api.get('/teachers').then(res => res.data),
  });

  const createMutation = useMutation({
    mutationFn: (newCourse) => api.post('/courses', newCourse),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      toast.success('Course created successfully');
      setOpenDialog(false);
      formik.resetForm();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create course');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (updatedCourse) => api.put(`/courses/${updatedCourse.id}`, updatedCourse),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      toast.success('Course updated successfully');
      setOpenDialog(false);
      formik.resetForm();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update course');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/courses/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      toast.success('Course deleted successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete course');
    },
  });

  const formik = useFormik({
    initialValues: {
      courseCode: selectedCourse?.course_code || '',
      courseName: selectedCourse?.course_name || '',
      credits: selectedCourse?.credits || '',
      department: selectedCourse?.department || '',
      teacherId: selectedCourse?.teacher_id || '',
      semester: selectedCourse?.semester || '',
      maxStudents: selectedCourse?.max_students || '',
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

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this course?')) {
      deleteMutation.mutate(id);
    }
  };

  const filteredCourses = courses?.filter((course) =>
    course.course_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.course_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.department?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const paginatedCourses = filteredCourses?.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const departments = [
    'Computer Science',
    'Engineering',
    'Business',
    'Mathematics',
    'Physics',
    'Chemistry',
    'Biology',
    'English',
    'History',
  ];

  if (coursesLoading) {
    return (
      <Box sx={{ width: '100%', mt: 4 }}>
        <LinearProgress />
      </Box>
    );
  }

  if (coursesError) {
    return (
      <Box sx={{ mt: 4 }}>
        <Alert severity="error">
          Error loading courses. Please try again later.
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Courses</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Course
        </Button>
      </Box>

      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <Box sx={{ p: 2 }}>
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
        </Box>

        <TableContainer sx={{ maxHeight: 440 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Course Code</TableCell>
                <TableCell>Course Name</TableCell>
                <TableCell>Department</TableCell>
                <TableCell>Credits</TableCell>
                <TableCell>Teacher</TableCell>
                <TableCell>Semester</TableCell>
                <TableCell>Students</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedCourses?.map((course) => (
                <TableRow hover key={course.id}>
                  <TableCell>
                    <Chip label={course.course_code} size="small" color="primary" />
                  </TableCell>
                  <TableCell>{course.course_name}</TableCell>
                  <TableCell>{course.department}</TableCell>
                  <TableCell>{course.credits}</TableCell>
                  <TableCell>
                    {course.teacher_name || 'Not assigned'}
                  </TableCell>
                  <TableCell>Semester {course.semester}</TableCell>
                  <TableCell>
                    {course.enrolled_students || 0}/{course.max_students}
                  </TableCell>
                  <TableCell align="center">
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
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={filteredCourses?.length || 0}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
        />
      </Paper>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>{selectedCourse ? 'Edit Course' : 'Add New Course'}</DialogTitle>
        <form onSubmit={formik.handleSubmit}>
          <DialogContent>
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
                  >
                    {teachers?.map((teacher) => (
                      <MenuItem key={teacher.id} value={teacher.id}>
                        {teacher.first_name} {teacher.last_name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  name="semester"
                  label="Semester"
                  type="number"
                  value={formik.values.semester}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.semester && Boolean(formik.errors.semester)}
                  helperText={formik.touched.semester && formik.errors.semester}
                  margin="normal"
                />
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
    </Box>
  );
};

export default Courses;