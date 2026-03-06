// src/pages/Announcements.js
import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Chip,
  Alert,
  LinearProgress,
  Card,
  CardContent,
  CardActions,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Announcement as AnnouncementIcon,
  Event as EventIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { toast } from 'react-toastify';
import api from '../services/api';

const validationSchema = yup.object({
  title: yup.string().required('Title is required'),
  content: yup.string().required('Content is required'),
  type: yup.string().required('Type is required'),
  targetAudience: yup.array().min(1, 'Select at least one audience'),
  startDate: yup.date().required('Start date is required'),
  endDate: yup.date().required('End date is required'),
});

const Announcements = () => {
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const queryClient = useQueryClient();

  const { data: announcements, isLoading } = useQuery({
    queryKey: ['announcements'],
    queryFn: () => api.get('/announcements').then(res => res.data)
  });

  const createMutation = useMutation({
    mutationFn: (newAnnouncement) => api.post('/announcements', newAnnouncement),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      toast.success('Announcement created successfully');
      setOpenDialog(false);
      formik.resetForm();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create announcement');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (updatedAnnouncement) => api.put(`/announcements/${updatedAnnouncement.id}`, updatedAnnouncement),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      toast.success('Announcement updated successfully');
      setOpenDialog(false);
      formik.resetForm();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update announcement');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/announcements/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      toast.success('Announcement deleted successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete announcement');
    },
  });

  const formik = useFormik({
    initialValues: {
      title: selectedAnnouncement?.title || '',
      content: selectedAnnouncement?.content || '',
      type: selectedAnnouncement?.type || 'news',
      targetAudience: selectedAnnouncement?.target_audience || [],
      startDate: selectedAnnouncement?.start_date || '',
      endDate: selectedAnnouncement?.end_date || '',
    },
    validationSchema,
    enableReinitialize: true,
    onSubmit: (values) => {
      if (selectedAnnouncement) {
        updateMutation.mutate({ id: selectedAnnouncement.id, ...values });
      } else {
        createMutation.mutate(values);
      }
    },
  });

  const handleOpenDialog = (announcement = null) => {
    setSelectedAnnouncement(announcement);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedAnnouncement(null);
    formik.resetForm();
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this announcement?')) {
      deleteMutation.mutate(id);
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'urgent': return <WarningIcon color="error" />;
      case 'event': return <EventIcon color="info" />;
      default: return <InfoIcon color="primary" />;
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'urgent': return 'error';
      case 'event': return 'info';
      default: return 'primary';
    }
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
        <Typography variant="h4">Announcements</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          New Announcement
        </Button>
      </Box>

      <Grid container spacing={3}>
        {announcements?.map((announcement) => (
          <Grid item xs={12} key={announcement.id}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  {getTypeIcon(announcement.type)}
                  <Typography variant="h6" sx={{ ml: 1, flex: 1 }}>
                    {announcement.title}
                  </Typography>
                  <Chip
                    label={announcement.type}
                    color={getTypeColor(announcement.type)}
                    size="small"
                    sx={{ mr: 1 }}
                  />
                  <Chip
                    label="Active"
                    color="success"
                    size="small"
                    variant="outlined"
                  />
                </Box>

                <Typography variant="body1" paragraph>
                  {announcement.content}
                </Typography>

                <Box display="flex" alignItems="center" mt={2}>
                  <Typography variant="caption" color="textSecondary">
                    Posted: {new Date(announcement.created_at).toLocaleDateString()}
                  </Typography>
                  <Box sx={{ flex: 1 }} />
                  <Typography variant="caption" color="textSecondary">
                    Valid: {new Date(announcement.start_date).toLocaleDateString()} - {new Date(announcement.end_date).toLocaleDateString()}
                  </Typography>
                </Box>

                <Box mt={2}>
                  <Typography variant="caption" color="textSecondary" component="span">
                    Target: 
                  </Typography>
                  {announcement.target_audience?.map((audience) => (
                    <Chip
                      key={audience}
                      label={audience}
                      size="small"
                      variant="outlined"
                      sx={{ ml: 1 }}
                    />
                  ))}
                </Box>
              </CardContent>
              <Divider />
              <CardActions>
                <IconButton size="small" onClick={() => handleOpenDialog(announcement)}>
                  <EditIcon />
                </IconButton>
                <IconButton size="small" onClick={() => handleDelete(announcement.id)}>
                  <DeleteIcon />
                </IconButton>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedAnnouncement ? 'Edit Announcement' : 'New Announcement'}
        </DialogTitle>
        <form onSubmit={formik.handleSubmit}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  name="title"
                  label="Title"
                  value={formik.values.title}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.title && Boolean(formik.errors.title)}
                  helperText={formik.touched.title && formik.errors.title}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  name="content"
                  label="Content"
                  multiline
                  rows={4}
                  value={formik.values.content}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.content && Boolean(formik.errors.content)}
                  helperText={formik.touched.content && formik.errors.content}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Type</InputLabel>
                  <Select
                    name="type"
                    value={formik.values.type}
                    onChange={formik.handleChange}
                  >
                    <MenuItem value="news">News</MenuItem>
                    <MenuItem value="event">Event</MenuItem>
                    <MenuItem value="urgent">Urgent</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Target Audience</InputLabel>
                  <Select
                    name="targetAudience"
                    value={formik.values.targetAudience}
                    onChange={formik.handleChange}
                    multiple
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((value) => (
                          <Chip key={value} label={value} size="small" />
                        ))}
                      </Box>
                    )}
                  >
                    <MenuItem value="all">All</MenuItem>
                    <MenuItem value="students">Students</MenuItem>
                    <MenuItem value="teachers">Teachers</MenuItem>
                    <MenuItem value="parents">Parents</MenuItem>
                    <MenuItem value="staff">Staff</MenuItem>
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
                : (selectedAnnouncement ? 'Update' : 'Create')}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default Announcements;