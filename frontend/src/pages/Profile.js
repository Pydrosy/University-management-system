// src/pages/Profile.js
import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Avatar,
  Button,
  TextField,
  Divider,
  Chip,
  Card,
  CardContent,
  Alert,
  LinearProgress,
  IconButton,
  Tab,
  Tabs,
} from '@mui/material';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  PhotoCamera as PhotoCameraIcon,
  School as SchoolIcon,
  Work as WorkIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const validationSchema = yup.object({
  firstName: yup.string().required('First name is required'),
  lastName: yup.string().required('Last name is required'),
  email: yup.string().email('Invalid email').required('Email is required'),
  phone: yup.string(),
  address: yup.string(),
  dateOfBirth: yup.date(),
});

const Profile = () => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: () => api.get(`/users/${user?.id}`).then(res => res.data),
    enabled: !!user?.id
  });

  const updateMutation = useMutation({
    mutationFn: (updatedProfile) => api.put(`/users/${user?.id}`, updatedProfile),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
      toast.success('Profile updated successfully');
      setIsEditing(false);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    },
  });

  const formik = useFormik({
    initialValues: {
      firstName: profile?.first_name || '',
      lastName: profile?.last_name || '',
      email: profile?.email || '',
      phone: profile?.phone || '',
      address: profile?.address || '',
      dateOfBirth: profile?.date_of_birth || '',
    },
    validationSchema,
    enableReinitialize: true,
    onSubmit: (values) => {
      updateMutation.mutate(values);
    },
  });

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
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
      <Typography variant="h4" gutterBottom>
        My Profile
      </Typography>

      <Grid container spacing={3}>
        {/* Profile Header */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Box display="flex" alignItems="center">
              <Box position="relative">
                <Avatar
                  sx={{
                    width: 100,
                    height: 100,
                    bgcolor: 'primary.main',
                    fontSize: '2.5rem',
                  }}
                >
                  {profile?.first_name?.[0]}{profile?.last_name?.[0]}
                </Avatar>
                <IconButton
                  size="small"
                  sx={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    backgroundColor: 'background.paper',
                    '&:hover': {
                      backgroundColor: 'background.paper',
                    },
                  }}
                >
                  <PhotoCameraIcon fontSize="small" />
                </IconButton>
              </Box>
              <Box ml={3}>
                <Typography variant="h5">
                  {profile?.first_name} {profile?.last_name}
                </Typography>
                <Typography variant="subtitle1" color="textSecondary">
                  {profile?.email}
                </Typography>
                <Chip
                  icon={profile?.role === 'student' ? <SchoolIcon /> : <WorkIcon />}
                  label={profile?.role}
                  color="primary"
                  size="small"
                  sx={{ mt: 1 }}
                />
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* Tabs */}
        <Grid item xs={12}>
          <Paper sx={{ width: '100%' }}>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              indicatorColor="primary"
              textColor="primary"
              variant="fullWidth"
            >
              <Tab icon={<PersonIcon />} label="Personal Information" />
              <Tab icon={<SchoolIcon />} label="Academic Information" />
              {profile?.role === 'teacher' && (
                <Tab icon={<WorkIcon />} label="Professional Information" />
              )}
            </Tabs>

            <Box sx={{ p: 3 }}>
              {/* Personal Information Tab */}
              {tabValue === 0 && (
                <Box>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h6">Personal Information</Typography>
                    {!isEditing ? (
                      <Button
                        startIcon={<EditIcon />}
                        variant="outlined"
                        onClick={() => setIsEditing(true)}
                      >
                        Edit
                      </Button>
                    ) : (
                      <Box>
                        <Button
                          startIcon={<CancelIcon />}
                          onClick={() => setIsEditing(false)}
                          sx={{ mr: 1 }}
                        >
                          Cancel
                        </Button>
                        <Button
                          startIcon={<SaveIcon />}
                          variant="contained"
                          onClick={formik.handleSubmit}
                          disabled={updateMutation.isPending}
                        >
                          {updateMutation.isPending ? 'Saving...' : 'Save'}
                        </Button>
                      </Box>
                    )}
                  </Box>
                  <Divider sx={{ mb: 3 }} />

                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      {isEditing ? (
                        <TextField
                          fullWidth
                          name="firstName"
                          label="First Name"
                          value={formik.values.firstName}
                          onChange={formik.handleChange}
                          onBlur={formik.handleBlur}
                          error={formik.touched.firstName && Boolean(formik.errors.firstName)}
                          helperText={formik.touched.firstName && formik.errors.firstName}
                        />
                      ) : (
                        <Box>
                          <Typography variant="caption" color="textSecondary">
                            First Name
                          </Typography>
                          <Typography variant="body1">
                            {profile?.first_name}
                          </Typography>
                        </Box>
                      )}
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      {isEditing ? (
                        <TextField
                          fullWidth
                          name="lastName"
                          label="Last Name"
                          value={formik.values.lastName}
                          onChange={formik.handleChange}
                          onBlur={formik.handleBlur}
                          error={formik.touched.lastName && Boolean(formik.errors.lastName)}
                          helperText={formik.touched.lastName && formik.errors.lastName}
                        />
                      ) : (
                        <Box>
                          <Typography variant="caption" color="textSecondary">
                            Last Name
                          </Typography>
                          <Typography variant="body1">
                            {profile?.last_name}
                          </Typography>
                        </Box>
                      )}
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      {isEditing ? (
                        <TextField
                          fullWidth
                          name="email"
                          label="Email"
                          type="email"
                          value={formik.values.email}
                          onChange={formik.handleChange}
                          onBlur={formik.handleBlur}
                          error={formik.touched.email && Boolean(formik.errors.email)}
                          helperText={formik.touched.email && formik.errors.email}
                        />
                      ) : (
                        <Box>
                          <Typography variant="caption" color="textSecondary">
                            Email
                          </Typography>
                          <Typography variant="body1">
                            {profile?.email}
                          </Typography>
                        </Box>
                      )}
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      {isEditing ? (
                        <TextField
                          fullWidth
                          name="phone"
                          label="Phone"
                          value={formik.values.phone}
                          onChange={formik.handleChange}
                        />
                      ) : (
                        <Box>
                          <Typography variant="caption" color="textSecondary">
                            Phone
                          </Typography>
                          <Typography variant="body1">
                            {profile?.phone || 'Not provided'}
                          </Typography>
                        </Box>
                      )}
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      {isEditing ? (
                        <TextField
                          fullWidth
                          name="dateOfBirth"
                          label="Date of Birth"
                          type="date"
                          value={formik.values.dateOfBirth}
                          onChange={formik.handleChange}
                          InputLabelProps={{ shrink: true }}
                        />
                      ) : (
                        <Box>
                          <Typography variant="caption" color="textSecondary">
                            Date of Birth
                          </Typography>
                          <Typography variant="body1">
                            {profile?.date_of_birth || 'Not provided'}
                          </Typography>
                        </Box>
                      )}
                    </Grid>
                    <Grid item xs={12}>
                      {isEditing ? (
                        <TextField
                          fullWidth
                          name="address"
                          label="Address"
                          multiline
                          rows={2}
                          value={formik.values.address}
                          onChange={formik.handleChange}
                        />
                      ) : (
                        <Box>
                          <Typography variant="caption" color="textSecondary">
                            Address
                          </Typography>
                          <Typography variant="body1">
                            {profile?.address || 'Not provided'}
                          </Typography>
                        </Box>
                      )}
                    </Grid>
                  </Grid>
                </Box>
              )}

              {/* Academic Information Tab */}
              {tabValue === 1 && profile?.role === 'student' && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Academic Information
                  </Typography>
                  <Divider sx={{ mb: 3 }} />
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography color="textSecondary" gutterBottom>
                            Student Number
                          </Typography>
                          <Typography variant="h6">
                            {profile?.student?.student_number || 'N/A'}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography color="textSecondary" gutterBottom>
                            Major
                          </Typography>
                          <Typography variant="h6">
                            {profile?.student?.major || 'N/A'}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography color="textSecondary" gutterBottom>
                            Current Semester
                          </Typography>
                          <Typography variant="h6">
                            {profile?.student?.current_semester || 'N/A'}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography color="textSecondary" gutterBottom>
                            GPA
                          </Typography>
                          <Typography variant="h6">
                            {profile?.student?.gpa || 'N/A'}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>
                </Box>
              )}

              {tabValue === 1 && profile?.role === 'teacher' && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Professional Information
                  </Typography>
                  <Divider sx={{ mb: 3 }} />
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography color="textSecondary" gutterBottom>
                            Employee ID
                          </Typography>
                          <Typography variant="h6">
                            {profile?.teacher?.employee_id || 'N/A'}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography color="textSecondary" gutterBottom>
                            Department
                          </Typography>
                          <Typography variant="h6">
                            {profile?.teacher?.department || 'N/A'}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography color="textSecondary" gutterBottom>
                            Qualification
                          </Typography>
                          <Typography variant="h6">
                            {profile?.teacher?.qualification || 'N/A'}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography color="textSecondary" gutterBottom>
                            Specialization
                          </Typography>
                          <Typography variant="h6">
                            {profile?.teacher?.specialization || 'N/A'}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={12}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography color="textSecondary" gutterBottom>
                            Courses Teaching
                          </Typography>
                          <Box display="flex" flexWrap="wrap" gap={1}>
                            {profile?.teacher?.courses?.map((course) => (
                              <Chip
                                key={course.id}
                                label={course.course_name}
                                size="small"
                                color="primary"
                                variant="outlined"
                              />
                            ))}
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Profile;