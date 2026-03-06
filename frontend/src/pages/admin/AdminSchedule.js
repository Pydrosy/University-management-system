// src/pages/admin/AdminSchedule.js
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
  Avatar,
  Tabs,
  Tab,
   Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
  FileDownload as ExportIcon,
  Schedule as ScheduleIcon,
  AccessTime as TimeIcon,
  LocationOn as LocationIcon,
  School as SchoolIcon,
  Person as PersonIcon,
  Today as TodayIcon,
  ViewWeek as ViewWeekIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { toast } from 'react-toastify';
import api from '../../services/api';

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const timeSlots = [
  '08:00-09:30',
  '09:45-11:15',
  '11:30-13:00',
  '13:30-15:00',
  '15:15-16:45',
  '17:00-18:30',
];

const validationSchema = yup.object({
  courseId: yup.string().required('Course is required'),
  dayOfWeek: yup.string().required('Day is required'),
  startTime: yup.string().required('Start time is required'),
  endTime: yup.string().required('End time is required'),
  classroom: yup.string().required('Classroom is required'),
  academicYear: yup.string().required('Academic year is required'),
  semester: yup.string().required('Semester is required'),
});

const AdminSchedule = () => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDay, setFilterDay] = useState('all');
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [selectedSchedules, setSelectedSchedules] = useState([]);
  const [tabValue, setTabValue] = useState(0);
  const queryClient = useQueryClient();

  // Fetch schedules
  const { data: schedules, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-schedules'],
    queryFn: async () => {
      const response = await api.get('/schedules');
      return response.data.data || response.data;
    }
  });

  // Fetch courses for dropdown
  const { data: courses } = useQuery({
    queryKey: ['courses-list'],
    queryFn: async () => {
      const response = await api.get('/courses');
      return response.data.data || response.data;
    }
  });

  // Fetch teachers for course info
  const { data: teachers } = useQuery({
    queryKey: ['teachers-list'],
    queryFn: async () => {
      const response = await api.get('/teachers');
      return response.data.data || response.data;
    }
  });

  // Create schedule mutation
  const createMutation = useMutation({
    mutationFn: (newSchedule) => api.post('/schedules', newSchedule),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-schedules'] });
      toast.success('Schedule created successfully');
      setOpenDialog(false);
      formik.resetForm();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create schedule');
    },
  });

  // Update schedule mutation
  const updateMutation = useMutation({
    mutationFn: (updatedSchedule) => api.put(`/schedules/${updatedSchedule.id}`, updatedSchedule),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-schedules'] });
      toast.success('Schedule updated successfully');
      setOpenDialog(false);
      formik.resetForm();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update schedule');
    },
  });

  // Delete schedule mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/schedules/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-schedules'] });
      toast.success('Schedule deleted successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete schedule');
    },
  });

  // Bulk delete mutation
  const bulkDeleteMutation = useMutation({
    mutationFn: (ids) => api.post('/schedules/bulk-delete', { ids }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-schedules'] });
      setSelectedSchedules([]);
      toast.success('Selected schedules deleted successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete selected schedules');
    },
  });

  const formik = useFormik({
    initialValues: {
      courseId: selectedSchedule?.courseId || selectedSchedule?.course_id || '',
      dayOfWeek: selectedSchedule?.dayOfWeek || selectedSchedule?.day_of_week || 'Monday',
      startTime: selectedSchedule?.startTime || selectedSchedule?.start_time || '',
      endTime: selectedSchedule?.endTime || selectedSchedule?.end_time || '',
      classroom: selectedSchedule?.classroom || '',
      academicYear: selectedSchedule?.academicYear || selectedSchedule?.academic_year || '2024-2025',
      semester: selectedSchedule?.semester || 'Fall',
    },
    validationSchema,
    enableReinitialize: true,
    onSubmit: (values) => {
      if (selectedSchedule) {
        updateMutation.mutate({ id: selectedSchedule.id, ...values });
      } else {
        createMutation.mutate(values);
      }
    },
  });

  const handleOpenDialog = (schedule = null) => {
    setSelectedSchedule(schedule);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedSchedule(null);
    formik.resetForm();
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this schedule?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleBulkDelete = () => {
    if (selectedSchedules.length === 0) {
      toast.warning('No schedules selected');
      return;
    }
    
    if (window.confirm(`Are you sure you want to delete ${selectedSchedules.length} selected schedules?`)) {
      bulkDeleteMutation.mutate(selectedSchedules);
    }
  };

  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelectedSchedules(filteredSchedules.map(s => s.id));
    } else {
      setSelectedSchedules([]);
    }
  };

  const handleSelectSchedule = (id) => {
    setSelectedSchedules(prev => 
      prev.includes(id) ? prev.filter(sId => sId !== id) : [...prev, id]
    );
  };

  const handleExport = () => {
    const csvContent = [
      ['ID', 'Course', 'Day', 'Start Time', 'End Time', 'Classroom', 'Academic Year', 'Semester'],
      ...filteredSchedules.map(s => [
        s.id,
        getCourseName(s.courseId || s.course_id),
        s.dayOfWeek || s.day_of_week,
        s.startTime || s.start_time,
        s.endTime || s.end_time,
        s.classroom,
        s.academicYear || s.academic_year,
        s.semester
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `schedules_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Get course name by ID
  const getCourseName = (courseId) => {
    const course = courses?.find(c => c.id === courseId);
    return course ? `${course.courseCode || course.course_code} - ${course.courseName || course.course_name}` : 'Unknown Course';
  };

  // Get teacher name by course ID
  const getTeacherName = (courseId) => {
    const course = courses?.find(c => c.id === courseId);
    if (!course) return 'Unknown';
    const teacher = teachers?.find(t => t.id === (course.teacherId || course.teacher_id));
    return teacher ? `${teacher.firstName || teacher.first_name} ${teacher.lastName || teacher.last_name}` : 'Not assigned';
  };

  // Filter schedules based on search and day
  const filteredSchedules = schedules?.filter((schedule) => {
    const courseName = getCourseName(schedule.courseId || schedule.course_id);
    const teacherName = getTeacherName(schedule.courseId || schedule.course_id);
    
    const matchesSearch = 
      courseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (schedule.classroom || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacherName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDay = filterDay === 'all' || (schedule.dayOfWeek || schedule.day_of_week) === filterDay;
    
    return matchesSearch && matchesDay;
  }) || [];

  // Group schedules by day for calendar view
  const schedulesByDay = daysOfWeek.reduce((acc, day) => {
    acc[day] = filteredSchedules.filter(s => (s.dayOfWeek || s.day_of_week) === day);
    return acc;
  }, {});

  const paginatedSchedules = filteredSchedules.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

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
          Error loading schedules. Please try again later.
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Schedule Management</Typography>
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
          {selectedSchedules.length > 0 && (
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={handleBulkDelete}
            >
              Delete Selected ({selectedSchedules.length})
            </Button>
          )}
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Add Schedule
          </Button>
        </Stack>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Classes
              </Typography>
              <Typography variant="h4">
                {schedules?.length || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Active Courses
              </Typography>
              <Typography variant="h4" color="success.main">
                {new Set(schedules?.map(s => s.courseId || s.course_id)).size || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Classrooms Used
              </Typography>
              <Typography variant="h4" color="primary">
                {new Set(schedules?.map(s => s.classroom)).size || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Busiest Day
              </Typography>
              <Typography variant="h4" color="info.main">
                {Object.entries(schedulesByDay).reduce((max, [day, classes]) => 
                  classes.length > (max.count || 0) ? { day, count: classes.length } : max
                , { day: 'N/A', count: 0 }).day}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs for List/Calendar View */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="schedule view tabs">
          <Tab icon={<ViewWeekIcon />} label="List View" />
          <Tab icon={<TodayIcon />} label="Calendar View" />
        </Tabs>
      </Paper>

      {tabValue === 0 ? (
        // List View
        <Paper sx={{ width: '100%', overflow: 'hidden' }}>
          <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <TextField
              placeholder="Search by course, classroom, teacher..."
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
              sx={{ width: 350 }}
            />
            
            <Box display="flex" alignItems="center" gap={2}>
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Filter by Day</InputLabel>
                <Select
                  value={filterDay}
                  onChange={(e) => setFilterDay(e.target.value)}
                  label="Filter by Day"
                >
                  <MenuItem value="all">All Days</MenuItem>
                  {daysOfWeek.map((day) => (
                    <MenuItem key={day} value={day}>{day}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Chip 
                label={`${filteredSchedules.length} schedules`}
                color="primary"
                variant="outlined"
              />
            </Box>
          </Box>

          <TableContainer sx={{ maxHeight: 500 }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <input
                      type="checkbox"
                      checked={selectedSchedules.length === filteredSchedules.length && filteredSchedules.length > 0}
                      onChange={handleSelectAll}
                      style={{ cursor: 'pointer' }}
                    />
                  </TableCell>
                  <TableCell>Course</TableCell>
                  <TableCell>Teacher</TableCell>
                  <TableCell>Day</TableCell>
                  <TableCell>Time</TableCell>
                  <TableCell>Classroom</TableCell>
                  <TableCell>Academic Year</TableCell>
                  <TableCell>Semester</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedSchedules.map((schedule) => (
                  <TableRow 
                    hover 
                    key={schedule.id}
                    selected={selectedSchedules.includes(schedule.id)}
                  >
                    <TableCell padding="checkbox">
                      <input
                        type="checkbox"
                        checked={selectedSchedules.includes(schedule.id)}
                        onChange={() => handleSelectSchedule(schedule.id)}
                        style={{ cursor: 'pointer' }}
                      />
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <Avatar sx={{ mr: 2, bgcolor: 'info.main' }}>
                          <SchoolIcon />
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight="bold">
                            {getCourseName(schedule.courseId || schedule.course_id)}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <PersonIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                        {getTeacherName(schedule.courseId || schedule.course_id)}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={schedule.dayOfWeek || schedule.day_of_week} 
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <TimeIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                        {schedule.startTime || schedule.start_time} - {schedule.endTime || schedule.end_time}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <LocationIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                        {schedule.classroom}
                      </Box>
                    </TableCell>
                    <TableCell>{schedule.academicYear || schedule.academic_year}</TableCell>
                    <TableCell>{schedule.semester}</TableCell>
                    <TableCell align="center">
                      <Tooltip title="Edit">
                        <IconButton size="small" onClick={() => handleOpenDialog(schedule)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton size="small" onClick={() => handleDelete(schedule.id)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
                {paginatedSchedules.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} align="center" sx={{ py: 3 }}>
                      <Typography color="textSecondary">
                        No schedules found
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
            count={filteredSchedules.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </Paper>
      ) : (
        // Calendar View
        <Paper sx={{ p: 3 }}>
          <Grid container spacing={2}>
            {daysOfWeek.map((day) => (
              <Grid item size={{ xs: 12, md: 6, lg: 4 }} key={day}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ color: 'primary.main' }}>
                      {day}
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    {schedulesByDay[day]?.length > 0 ? (
                      schedulesByDay[day].map((schedule) => (
                        <Box 
                          key={schedule.id} 
                          sx={{ 
                            mb: 2, 
                            p: 1.5, 
                            bgcolor: '#f5f5f5', 
                            borderRadius: 1,
                            borderLeft: '4px solid',
                            borderLeftColor: 'primary.main'
                          }}
                        >
                          <Typography variant="subtitle2" fontWeight="bold">
                            {getCourseName(schedule.courseId || schedule.course_id)}
                          </Typography>
                          <Box display="flex" alignItems="center" mt={0.5}>
                            <TimeIcon sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
                            <Typography variant="caption">
                              {schedule.startTime || schedule.start_time} - {schedule.endTime || schedule.end_time}
                            </Typography>
                          </Box>
                          <Box display="flex" alignItems="center">
                            <LocationIcon sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
                            <Typography variant="caption">
                              Room: {schedule.classroom}
                            </Typography>
                          </Box>
                          <Box display="flex" alignItems="center">
                            <PersonIcon sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
                            <Typography variant="caption">
                              {getTeacherName(schedule.courseId || schedule.course_id)}
                            </Typography>
                          </Box>
                        </Box>
                      ))
                    ) : (
                      <Typography color="textSecondary" align="center" sx={{ py: 2 }}>
                        No classes scheduled
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Paper>
      )}

      {/* Schedule Form Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedSchedule ? 'Edit Schedule' : 'Add New Schedule'}
        </DialogTitle>
        <form onSubmit={formik.handleSubmit}>
          <DialogContent dividers>
            <Grid container spacing={2}>
              <Grid item size={{ xs: 12 }}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Course</InputLabel>
                  <Select
                    name="courseId"
                    value={formik.values.courseId}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.courseId && Boolean(formik.errors.courseId)}
                  >
                    {courses?.map((course) => (
                      <MenuItem key={course.id} value={course.id}>
                        {course.courseCode || course.course_code} - {course.courseName || course.course_name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Day</InputLabel>
                  <Select
                    name="dayOfWeek"
                    value={formik.values.dayOfWeek}
                    onChange={formik.handleChange}
                  >
                    {daysOfWeek.map((day) => (
                      <MenuItem key={day} value={day}>
                        {day}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item size={{ xs: 12, sm: 3 }}>
                <TextField
                  fullWidth
                  name="startTime"
                  label="Start Time"
                  type="time"
                  value={formik.values.startTime}
                  onChange={formik.handleChange}
                  InputLabelProps={{ shrink: true }}
                  margin="normal"
                />
              </Grid>
              <Grid item size={{ xs: 12, sm: 3 }}>
                <TextField
                  fullWidth
                  name="endTime"
                  label="End Time"
                  type="time"
                  value={formik.values.endTime}
                  onChange={formik.handleChange}
                  InputLabelProps={{ shrink: true }}
                  margin="normal"
                />
              </Grid>
              <Grid item size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  name="classroom"
                  label="Classroom"
                  value={formik.values.classroom}
                  onChange={formik.handleChange}
                  margin="normal"
                />
              </Grid>
              <Grid item size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  name="academicYear"
                  label="Academic Year"
                  value={formik.values.academicYear}
                  onChange={formik.handleChange}
                  margin="normal"
                  placeholder="e.g., 2024-2025"
                />
              </Grid>
              <Grid item size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Semester</InputLabel>
                  <Select
                    name="semester"
                    value={formik.values.semester}
                    onChange={formik.handleChange}
                  >
                    <MenuItem value="Fall">Fall</MenuItem>
                    <MenuItem value="Spring">Spring</MenuItem>
                    <MenuItem value="Summer">Summer</MenuItem>
                    <MenuItem value="Winter">Winter</MenuItem>
                  </Select>
                </FormControl>
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
                : (selectedSchedule ? 'Update' : 'Create')}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default AdminSchedule;