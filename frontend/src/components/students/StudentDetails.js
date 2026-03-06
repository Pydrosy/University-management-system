// src/components/students/StudentDetails.js
import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Typography,
  Box,
  Chip,
  Avatar,
  Divider,
  Paper,
} from '@mui/material';
import {
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  CalendarToday as CalendarIcon,
  School as SchoolIcon,
  Badge as BadgeIcon,
} from '@mui/icons-material';

const InfoRow = ({ icon, label, value }) => (
  <Box display="flex" alignItems="center" mb={2}>
    <Box
      sx={{
        backgroundColor: 'primary.light',
        borderRadius: '50%',
        width: 40,
        height: 40,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        mr: 2,
        color: 'primary.main',
      }}
    >
      {icon}
    </Box>
    <Box>
      <Typography variant="caption" color="textSecondary">
        {label}
      </Typography>
      <Typography variant="body2">{value || 'Not provided'}</Typography>
    </Box>
  </Box>
);

const StudentDetails = ({ open, onClose, student }) => {
  if (!student) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h6">Student Details</Typography>
          <Chip
            label={student.is_active ? 'Active' : 'Inactive'}
            color={student.is_active ? 'success' : 'default'}
            size="small"
          />
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={3}>
          {/* Header */}
          <Grid item xs={12}>
            <Box display="flex" alignItems="center" mb={2}>
              <Avatar
                sx={{
                  width: 80,
                  height: 80,
                  bgcolor: 'primary.main',
                  fontSize: '2rem',
                  mr: 2,
                }}
              >
                {student.first_name?.[0]}{student.last_name?.[0]}
              </Avatar>
              <Box>
                <Typography variant="h5">
                  {student.first_name} {student.last_name}
                </Typography>
                <Typography variant="subtitle1" color="textSecondary">
                  {student.student_number}
                </Typography>
              </Box>
            </Box>
          </Grid>

          <Grid item xs={12}>
            <Divider />
          </Grid>

          {/* Personal Information */}
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              Personal Information
            </Typography>
            <Paper sx={{ p: 2 }}>
              <InfoRow
                icon={<EmailIcon />}
                label="Email"
                value={student.email}
              />
              <InfoRow
                icon={<PhoneIcon />}
                label="Phone"
                value={student.phone}
              />
              <InfoRow
                icon={<CalendarIcon />}
                label="Date of Birth"
                value={student.date_of_birth}
              />
              <InfoRow
                icon={<LocationIcon />}
                label="Address"
                value={student.address}
              />
            </Paper>
          </Grid>

          {/* Academic Information */}
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              Academic Information
            </Typography>
            <Paper sx={{ p: 2 }}>
              <InfoRow
                icon={<SchoolIcon />}
                label="Major"
                value={student.major}
              />
              <InfoRow
                icon={<BadgeIcon />}
                label="Enrollment Date"
                value={student.enrollment_date}
              />
              <InfoRow
                icon={<SchoolIcon />}
                label="Current Semester"
                value={student.current_semester || 'Not specified'}
              />
              <InfoRow
                icon={<SchoolIcon />}
                label="GPA"
                value={student.gpa || 'Not available'}
              />
            </Paper>
          </Grid>

          {/* Courses */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Enrolled Courses
            </Typography>
            <Paper sx={{ p: 2 }}>
              <Grid container spacing={1}>
                {student.courses?.map((course) => (
                  <Grid item xs={12} sm={6} md={4} key={course.id}>
                    <Paper variant="outlined" sx={{ p: 1 }}>
                      <Typography variant="subtitle2">{course.course_name}</Typography>
                      <Typography variant="caption" color="textSecondary">
                        {course.course_code}
                      </Typography>
                    </Paper>
                  </Grid>
                ))}
                {(!student.courses || student.courses.length === 0) && (
                  <Grid item xs={12}>
                    <Typography color="textSecondary" align="center">
                      No courses enrolled
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </Paper>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Close
        </Button>
        <Button variant="contained" color="primary">
          Edit
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default StudentDetails;