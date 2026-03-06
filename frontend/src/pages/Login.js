// src/pages/Login.js
import React, { useState } from 'react';
import { toast } from 'react-toastify';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Alert,
  InputAdornment,
  IconButton,
  Card,
  CardContent,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { useAuth } from '../context/AuthContext';
import SchoolIcon from '@mui/icons-material/School';

const validationSchema = yup.object({
  email: yup.string().email('Enter a valid email').required('Email is required'),
  password: yup.string().required('Password is required').min(6, 'Password must be at least 6 characters'),
});

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const formik = useFormik({
    initialValues: {
      email: '',
      password: '',
    },
    validationSchema: validationSchema,
    onSubmit: async (values, { setSubmitting }) => {
      const result = await login(values);
      if (result.success) {
        // Redirect based on user role
        switch (result.role) {
          case 'admin':
            navigate('/admin/dashboard');
            break;
          case 'teacher':
            navigate('/teacher/dashboard');
            break;
          case 'student':
            navigate('/student/dashboard');
            break;
          default:
            navigate('/dashboard');
        }
        toast.success(`Welcome back! Redirecting to ${result.role} dashboard...`);
      } else {
        setError(result.error);
      }
      setSubmitting(false);
    },
  });

  // Quick login function for demo purposes
  const handleQuickLogin = (role) => {
    const credentials = {
      admin: { email: 'admin@school.com', password: 'admin123' },
      teacher: { email: 'teacher@school.com', password: 'teacher123' },
      student: { email: 'student@school.com', password: 'student123' },
    };
    
    formik.setValues(credentials[role]);
    formik.handleSubmit();
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          minHeight: '100vh',
        }}
      >
        <Card 
          elevation={3} 
          sx={{ 
            width: '100%',
            borderRadius: 2,
            overflow: 'hidden'
          }}
        >
          <Box sx={{ bgcolor: 'primary.main', p: 3, textAlign: 'center' }}>
            <SchoolIcon sx={{ fontSize: 60, color: 'white', mb: 1 }} />
            <Typography variant="h4" component="h1" sx={{ color: 'white', fontWeight: 'bold' }}>
              EduManage
            </Typography>
            <Typography variant="subtitle1" sx={{ color: 'rgba(255,255,255,0.8)' }}>
              Educational Management Platform
            </Typography>
          </Box>

          <CardContent sx={{ p: 4 }}>
            <Typography component="h2" variant="h6" align="center" gutterBottom>
              Sign In to Your Account
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mt: 2, mb: 2 }}>
                {error}
              </Alert>
            )}

            <Box component="form" onSubmit={formik.handleSubmit} sx={{ mt: 2 }}>
              <TextField
                margin="normal"
                fullWidth
                id="email"
                name="email"
                label="Email Address"
                autoComplete="email"
                autoFocus
                value={formik.values.email}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.email && Boolean(formik.errors.email)}
                helperText={formik.touched.email && formik.errors.email}
                variant="outlined"
              />

              <TextField
                margin="normal"
                fullWidth
                name="password"
                label="Password"
                type={showPassword ? 'text' : 'password'}
                id="password"
                autoComplete="current-password"
                value={formik.values.password}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.password && Boolean(formik.errors.password)}
                helperText={formik.touched.password && formik.errors.password}
                variant="outlined"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                sx={{ mt: 3, mb: 2, py: 1.5 }}
                disabled={formik.isSubmitting}
              >
                {formik.isSubmitting ? 'Signing in...' : 'Sign In'}
              </Button>

              {/* Quick Login Buttons for Demo */}
              <Typography variant="body2" color="textSecondary" align="center" sx={{ mt: 2, mb: 1 }}>
                Quick Login (Demo)
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', mb: 3 }}>
                <Button
                  size="small"
                  variant="outlined"
                  color="primary"
                  onClick={() => handleQuickLogin('admin')}
                  disabled={formik.isSubmitting}
                >
                  Admin
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  color="secondary"
                  onClick={() => handleQuickLogin('teacher')}
                  disabled={formik.isSubmitting}
                >
                  Teacher
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  color="success"
                  onClick={() => handleQuickLogin('student')}
                  disabled={formik.isSubmitting}
                >
                  Student
                </Button>
              </Box>

              <Box sx={{ mt: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                <Typography variant="body2" color="textSecondary" align="center" gutterBottom>
                  Demo Credentials
                </Typography>
                <Typography variant="body2" color="textSecondary" align="center">
                  <strong>Admin:</strong> admin@school.com / admin123
                </Typography>
                <Typography variant="body2" color="textSecondary" align="center">
                  <strong>Teacher:</strong> teacher@school.com / teacher123
                </Typography>
                <Typography variant="body2" color="textSecondary" align="center">
                  <strong>Student:</strong> student@school.com / student123
                </Typography>
              </Box>

              <Typography variant="caption" color="textSecondary" align="center" sx={{ mt: 2, display: 'block' }}>
                After login, you'll be redirected to your role-specific dashboard
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
};

export default Login;