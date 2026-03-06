// src/pages/student/StudentProfile.js
import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Avatar,
  Button,
  TextField,
  Divider,
  Chip,
  LinearProgress,
  Alert,
  IconButton,
  Stack,
  Tab,
  Tabs,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  Badge,
} from '@mui/material';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  School as SchoolIcon,
  CalendarToday as CalendarIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  PhotoCamera as PhotoCameraIcon,
  Grade as GradeIcon,
  Assignment as AssignmentIcon,
  Payment as PaymentIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { formatDate } from '../../utils/formatters';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { toast } from 'react-toastify';

// Validation schema for profile update
const profileValidationSchema = yup.object({
  firstName: yup.string()
    .required('First name is required')
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name cannot exceed 50 characters'),
  lastName: yup.string()
    .required('Last name is required')
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name cannot exceed 50 characters'),
  email: yup.string()
    .email('Please enter a valid email address')
    .required('Email is required'),
  phone: yup.string()
    .matches(/^[0-9+\-\s()]{10,20}$/, 'Please enter a valid phone number')
    .nullable(),
  address: yup.string()
    .max(200, 'Address cannot exceed 200 characters')
    .nullable(),
  dateOfBirth: yup.date()
    .max(new Date(), 'Date of birth cannot be in the future')
    .nullable(),
});

const StudentProfile = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [openPasswordDialog, setOpenPasswordDialog] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Fetch student profile data
  const { data: response, isLoading, error, refetch } = useQuery({
    queryKey: ['studentProfile'],
    queryFn: async () => {
      console.log('Fetching student profile for:', user?.id);
      const res = await api.get('/users/profile');
      console.log('Profile response:', res.data);
      return res.data;
    }
  });

  const profileData = response?.data || {};
  const studentInfo = profileData?.student || {};

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: (profileData) => api.put('/users/profile', profileData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['studentProfile'] });
      toast.success('Profile updated successfully');
      setIsEditing(false);
    },
    onError: (error) => {
      console.error('Profile update error:', error);
      toast.error(error.response?.data?.message || 'Failed to update profile');
    },
  });

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: (passwordData) => api.post('/auth/change-password', passwordData),
    onSuccess: () => {
      toast.success('Password changed successfully');
      setOpenPasswordDialog(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    },
    onError: (error) => {
      console.error('Password change error:', error);
      toast.error(error.response?.data?.message || 'Failed to change password');
    },
  });

  const formik = useFormik({
    initialValues: {
      firstName: profileData?.firstName || '',
      lastName: profileData?.lastName || '',
      email: profileData?.email || '',
      phone: profileData?.phone || '',
      address: profileData?.address || '',
      dateOfBirth: profileData?.dateOfBirth || '',
    },
    validationSchema: profileValidationSchema,
    enableReinitialize: true,
    onSubmit: (values) => {
      updateProfileMutation.mutate(values);
    },
  });

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleEditToggle = () => {
    if (isEditing) {
      // Cancel editing - reset form
      formik.resetForm();
    }
    setIsEditing(!isEditing);
  };

  const handleRefresh = () => {
    refetch();
  };

  const handlePasswordChange = () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    
    if (passwordData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    changePasswordMutation.mutate({
      currentPassword: passwordData.currentPassword,
      newPassword: passwordData.newPassword,
    });
  };

  const handlePasswordDialogClose = () => {
    setOpenPasswordDialog(false);
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
  };

  if (isLoading) {
    return (
      <Box sx={{ width: '100%', mt: 4 }}>
        <LinearProgress />
        <Typography variant="body2" color="textSecondary" align="center" sx={{ mt: 2 }}>
          Loading your profile...
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
          Error loading profile. Please try again later.
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
            My Profile
          </Typography>
          <Typography variant="body2" color="textSecondary">
            View and manage your personal information
          </Typography>
        </Box>
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
          >
            Refresh
          </Button>
          {!isEditing && (
            <Button
              variant="contained"
              startIcon={<EditIcon />}
              onClick={handleEditToggle}
            >
              Edit Profile
            </Button>
          )}
        </Stack>
      </Box>

      {/* Profile Header Card */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={2} sx={{ textAlign: 'center' }}>
            <Badge
              overlap="circular"
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              badgeContent={
                <Tooltip title="Change profile picture">
                  <IconButton size="small" sx={{ bgcolor: 'primary.main', color: 'white', '&:hover': { bgcolor: 'primary.dark' } }}>
                    <PhotoCameraIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              }
            >
              <Avatar
                sx={{
                  width: 120,
                  height: 120,
                  mx: 'auto',
                  bgcolor: 'primary.main',
                  fontSize: '3rem',
                }}
              >
                {profileData.firstName?.[0]}{profileData.lastName?.[0]}
              </Avatar>
            </Badge>
          </Grid>
          <Grid item xs={12} md={10}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
              <Box>
                <Typography variant="h4">
                  {profileData.firstName} {profileData.lastName}
                </Typography>
                <Typography variant="subtitle1" color="textSecondary" gutterBottom>
                  Student ID: {studentInfo.studentNumber || 'N/A'}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                  <Chip
                    icon={<SchoolIcon />}
                    label={studentInfo.major || 'Major not set'}
                    color="primary"
                    variant="outlined"
                  />
                  <Chip
                    icon={<GradeIcon />}
                    label={`GPA: ${studentInfo.gpa || '0.0'}`}
                    color={studentInfo.gpa >= 3.5 ? 'success' : studentInfo.gpa >= 2.5 ? 'warning' : 'error'}
                  />
                  <Chip
                    icon={<CalendarIcon />}
                    label={`Semester ${studentInfo.currentSemester || 1}`}
                    variant="outlined"
                  />
                </Box>
              </Box>
              <Button
                variant="outlined"
                color="secondary"
                onClick={() => setOpenPasswordDialog(true)}
                sx={{ mt: { xs: 2, md: 0 } }}
              >
                Change Password
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Profile Tabs */}
      <Paper sx={{ width: '100%', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} variant="fullWidth">
          <Tab icon={<PersonIcon />} label="Personal Information" />
          <Tab icon={<SchoolIcon />} label="Academic Information" />
          <Tab icon={<AssignmentIcon />} label="Activity Summary" />
        </Tabs>
      </Paper>

      {/* Personal Information Tab */}
      {tabValue === 0 && (
        <Paper sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Personal Information</Typography>
            {isEditing && (
              <Box>
                <Button
                  startIcon={<CancelIcon />}
                  onClick={handleEditToggle}
                  sx={{ mr: 1 }}
                >
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={formik.handleSubmit}
                  disabled={updateProfileMutation.isPending}
                >
                  {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </Box>
            )}
          </Box>
          <Divider sx={{ mb: 3 }} />

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
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
                  margin="normal"
                />
              ) : (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" color="textSecondary">
                    First Name
                  </Typography>
                  <Typography variant="body1">{profileData.firstName || 'Not set'}</Typography>
                </Box>
              )}
            </Grid>
            <Grid item xs={12} md={6}>
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
                  margin="normal"
                />
              ) : (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" color="textSecondary">
                    Last Name
                  </Typography>
                  <Typography variant="body1">{profileData.lastName || 'Not set'}</Typography>
                </Box>
              )}
            </Grid>
            <Grid item xs={12} md={6}>
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
                  margin="normal"
                />
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <EmailIcon color="action" />
                  <Box>
                    <Typography variant="caption" color="textSecondary">
                      Email
                    </Typography>
                    <Typography variant="body1">{profileData.email || 'Not set'}</Typography>
                  </Box>
                </Box>
              )}
            </Grid>
            <Grid item xs={12} md={6}>
              {isEditing ? (
                <TextField
                  fullWidth
                  name="phone"
                  label="Phone Number"
                  value={formik.values.phone}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.phone && Boolean(formik.errors.phone)}
                  helperText={formik.touched.phone && formik.errors.phone}
                  margin="normal"
                />
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <PhoneIcon color="action" />
                  <Box>
                    <Typography variant="caption" color="textSecondary">
                      Phone
                    </Typography>
                    <Typography variant="body1">{profileData.phone || 'Not provided'}</Typography>
                  </Box>
                </Box>
              )}
            </Grid>
            <Grid item xs={12} md={6}>
              {isEditing ? (
                <TextField
                  fullWidth
                  name="dateOfBirth"
                  label="Date of Birth"
                  type="date"
                  value={formik.values.dateOfBirth}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.dateOfBirth && Boolean(formik.errors.dateOfBirth)}
                  helperText={formik.touched.dateOfBirth && formik.errors.dateOfBirth}
                  InputLabelProps={{ shrink: true }}
                  margin="normal"
                />
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <CalendarIcon color="action" />
                  <Box>
                    <Typography variant="caption" color="textSecondary">
                      Date of Birth
                    </Typography>
                    <Typography variant="body1">
                      {profileData.dateOfBirth ? formatDate(profileData.dateOfBirth) : 'Not provided'}
                    </Typography>
                  </Box>
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
                  onBlur={formik.handleBlur}
                  error={formik.touched.address && Boolean(formik.errors.address)}
                  helperText={formik.touched.address && formik.errors.address}
                  margin="normal"
                />
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <LocationIcon color="action" />
                  <Box>
                    <Typography variant="caption" color="textSecondary">
                      Address
                    </Typography>
                    <Typography variant="body1">{profileData.address || 'Not provided'}</Typography>
                  </Box>
                </Box>
              )}
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Academic Information Tab */}
      {tabValue === 1 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>Academic Information</Typography>
          <Divider sx={{ mb: 3 }} />
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Student Number
                  </Typography>
                  <Typography variant="h5">
                    {studentInfo.studentNumber || 'N/A'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Major
                  </Typography>
                  <Typography variant="h5">
                    {studentInfo.major || 'Not specified'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Current Semester
                  </Typography>
                  <Typography variant="h5">
                    {studentInfo.currentSemester || 1}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    GPA
                  </Typography>
                  <Typography variant="h5" color={studentInfo.gpa >= 3.5 ? 'success.main' : studentInfo.gpa >= 2.5 ? 'warning.main' : 'error.main'}>
                    {studentInfo.gpa || '0.0'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Enrollment Date
                  </Typography>
                  <Typography variant="h5">
                    {studentInfo.enrollmentDate ? formatDate(studentInfo.enrollmentDate) : 'N/A'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Activity Summary Tab */}
      {tabValue === 2 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>Activity Summary</Typography>
          <Divider sx={{ mb: 3 }} />
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Card sx={{ textAlign: 'center', py: 2 }}>
                <CardContent>
                  <Avatar sx={{ bgcolor: 'primary.main', mx: 'auto', mb: 1, width: 56, height: 56 }}>
                    <SchoolIcon />
                  </Avatar>
                  <Typography variant="h4" color="primary.main">
                    {profileData.enrolledCourses || 0}
                  </Typography>
                  <Typography color="textSecondary">Enrolled Courses</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card sx={{ textAlign: 'center', py: 2 }}>
                <CardContent>
                  <Avatar sx={{ bgcolor: 'success.main', mx: 'auto', mb: 1, width: 56, height: 56 }}>
                    <AssignmentIcon />
                  </Avatar>
                  <Typography variant="h4" color="success.main">
                    {profileData.completedAssignments || 0}
                  </Typography>
                  <Typography color="textSecondary">Assignments Done</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card sx={{ textAlign: 'center', py: 2 }}>
                <CardContent>
                  <Avatar sx={{ bgcolor: 'info.main', mx: 'auto', mb: 1, width: 56, height: 56 }}>
                    <PaymentIcon />
                  </Avatar>
                  <Typography variant="h4" color="info.main">
                    ${profileData.totalPayments || 0}
                  </Typography>
                  <Typography color="textSecondary">Payments Made</Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Change Password Dialog */}
      <Dialog open={openPasswordDialog} onClose={handlePasswordDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Typography variant="h6">Change Password</Typography>
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                type="password"
                label="Current Password"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                type="password"
                label="New Password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                helperText="Password must be at least 6 characters long"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                type="password"
                label="Confirm New Password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                error={passwordData.newPassword !== passwordData.confirmPassword && passwordData.confirmPassword !== ''}
                helperText={
                  passwordData.newPassword !== passwordData.confirmPassword && passwordData.confirmPassword !== ''
                    ? 'Passwords do not match'
                    : ''
                }
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handlePasswordDialogClose}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handlePasswordChange}
            disabled={changePasswordMutation.isPending}
          >
            {changePasswordMutation.isPending ? 'Changing...' : 'Change Password'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default StudentProfile;