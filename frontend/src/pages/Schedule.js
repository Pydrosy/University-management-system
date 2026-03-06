// src/pages/Schedule.js
import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  LinearProgress,
  IconButton,
  Card,
  CardContent,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  AccessTime as TimeIcon,
  LocationOn as LocationIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { toast } from 'react-toastify';
import api from '../services/api';

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
});

const Schedule = () => {
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [selectedDay, setSelectedDay] = useState('Monday');
  const queryClient = useQueryClient();

  const { data: schedules, isLoading } = useQuery({
    queryKey: ['schedules'],
    queryFn: () => api.get('/schedules').then(res => res.data)
  });

  const { data: courses } = useQuery({
    queryKey: ['courses-list'],
    queryFn: () => api.get('/courses').then(res => res.data)
  });

  const createMutation = useMutation({
    mutationFn: (newSchedule) => api.post('/schedules', newSchedule),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      toast.success('Schedule created successfully');
      setOpenDialog(false);
      formik.resetForm();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create schedule');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (updatedSchedule) => api.put(`/schedules/${updatedSchedule.id}`, updatedSchedule),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      toast.success('Schedule updated successfully');
      setOpenDialog(false);
      formik.resetForm();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update schedule');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/schedules/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      toast.success('Schedule deleted successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete schedule');
    },
  });

  const formik = useFormik({
    initialValues: {
      courseId: selectedSchedule?.course_id || '',
      dayOfWeek: selectedSchedule?.day_of_week || 'Monday',
      startTime: selectedSchedule?.start_time || '',
      endTime: selectedSchedule?.end_time || '',
      classroom: selectedSchedule?.classroom || '',
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

  const getScheduleForDay = (day) => {
    return schedules?.filter(s => s.day_of_week === day) || [];
  };

  const getCourseName = (courseId) => {
    const course = courses?.find(c => c.id === courseId);
    return course ? `${course.course_code} - ${course.course_name}` : 'Unknown Course';
  };

  if (isLoading) {
    return (
      <Box sx={{ width: '100%', mt: 4 }}>
        <LinearProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Class Schedule</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Schedule
        </Button>
      </Box>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {daysOfWeek.map((day) => (
          <Grid item key={day}>
            <Button
              variant={selectedDay === day ? 'contained' : 'outlined'}
              onClick={() => setSelectedDay(day)}
            >
              {day}
            </Button>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={2}>
        {timeSlots.map((timeSlot) => {
          const [start, end] = timeSlot.split('-');
          const schedule = getScheduleForDay(selectedDay).find(
            s => s.start_time === start && s.end_time === end
          );

          return (
            <Grid item xs={12} key={timeSlot}>
              <Card variant="outlined">
                <CardContent>
                  <Grid container alignItems="center" spacing={2}>
                    <Grid item xs={2}>
                      <Box display="flex" alignItems="center">
                        <TimeIcon sx={{ mr: 1, color: 'text.secondary' }} />
                        <Typography>{timeSlot}</Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={8}>
                      {schedule ? (
                        <Box>
                          <Typography variant="h6">
                            {getCourseName(schedule.course_id)}
                          </Typography>
                          <Box display="flex" alignItems="center" mt={1}>
                            <LocationIcon sx={{ mr: 1, fontSize: 20, color: 'text.secondary' }} />
                            <Typography variant="body2" color="textSecondary">
                              Room: {schedule.classroom}
                            </Typography>
                          </Box>
                        </Box>
                      ) : (
                        <Typography color="textSecondary">No class scheduled</Typography>
                      )}
                    </Grid>
                    <Grid item xs={2} sx={{ textAlign: 'right' }}>
                      {schedule && (
                        <>
                          <IconButton size="small" onClick={() => handleOpenDialog(schedule)}>
                            <EditIcon />
                          </IconButton>
                          <IconButton size="small" onClick={() => handleDelete(schedule.id)}>
                            <DeleteIcon />
                          </IconButton>
                        </>
                      )}
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{selectedSchedule ? 'Edit Schedule' : 'Add New Schedule'}</DialogTitle>
        <form onSubmit={formik.handleSubmit}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Course</InputLabel>
                  <Select
                    name="courseId"
                    value={formik.values.courseId}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                  >
                    {courses?.map((course) => (
                      <MenuItem key={course.id} value={course.id}>
                        {course.course_code} - {course.course_name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
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
              <Grid item xs={12} sm={3}>
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
              <Grid item xs={12} sm={3}>
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
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  name="classroom"
                  label="Classroom"
                  value={formik.values.classroom}
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
                : (selectedSchedule ? 'Update' : 'Create')}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default Schedule;