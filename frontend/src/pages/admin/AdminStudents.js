// src/pages/admin/AdminStudents.js
import React, { useState, useEffect } from 'react';
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText, // Added missing import
  Alert,
  LinearProgress,
  Tooltip,
  Card,
  CardContent,
  Stack,
  Switch,
  FormControlLabel,
  Slide,
  Fade,
  Zoom,
  Grow,
  Divider,
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
  Email as EmailIcon,
  Phone as PhoneIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Close as CloseIcon,
  Badge as BadgeIcon,
  CalendarToday as CalendarIcon,
  LocationOn as LocationIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { toast } from 'react-toastify';
import api from '../../services/api';
import { formatDate } from '../../utils/formatters';

// Enhanced validation schema with custom validations
const validationSchema = yup.object({
  firstName: yup.string()
    .required('First name is required')
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name cannot exceed 50 characters')
    .matches(/^[A-Za-z\s]+$/, 'First name can only contain letters and spaces'),
  
  lastName: yup.string()
    .required('Last name is required')
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name cannot exceed 50 characters')
    .matches(/^[A-Za-z\s]+$/, 'Last name can only contain letters and spaces'),
  
  email: yup.string()
    .email('Please enter a valid email address')
    .required('Email is required')
    .max(100, 'Email cannot exceed 100 characters')
    .matches(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, 'Please enter a valid email format'),
  
  studentNumber: yup.string()
    .required('Student number is required')
    .min(5, 'Student number must be at least 5 characters')
    .max(20, 'Student number cannot exceed 20 characters')
    .matches(/^[A-Z0-9-]+$/, 'Student number can only contain uppercase letters, numbers, and hyphens'),
  
  major: yup.string()
    .required('Major is required'),
  
  phone: yup.string()
    .matches(/^[0-9+\-\s()]{10,20}$/, 'Please enter a valid phone number')
    .nullable(),
  
  dateOfBirth: yup.date()
    .max(new Date(), 'Date of birth cannot be in the future')
    .min(new Date(1900, 0, 1), 'Date of birth must be after 1900')
    .nullable(),
  
  address: yup.string()
    .max(200, 'Address cannot exceed 200 characters')
    .nullable(),
  
  enrollmentDate: yup.date()
    .required('Enrollment date is required')
    .max(new Date(), 'Enrollment date cannot be in the future')
    .min(new Date(2000, 0, 1), 'Enrollment date must be after 2000'),
  
  status: yup.string()
    .required('Status is required'),
  
  currentSemester: yup.number()
    .min(1, 'Semester must be at least 1')
    .max(12, 'Semester cannot exceed 12')
    .required('Current semester is required'),
});

// Slide transition for dialogs
const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const AdminStudents = () => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAnchorEl, setFilterAnchorEl] = useState(null);
  const [filterBy, setFilterBy] = useState('all');
  const [openDialog, setOpenDialog] = useState(false);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openBulkDeleteDialog, setOpenBulkDeleteDialog] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const queryClient = useQueryClient();

  // Fetch students
  const { data: students, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['admin-students'],
    queryFn: async () => {
      const response = await api.get('/students');
      return response.data.data || response.data;
    }
  });

  // Toggle student status mutation
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, isActive }) => {
      const loadingToast = toast.loading('Updating status...');
      try {
        const response = await api.put(`/students/${id}`, { isActive });
        toast.dismiss(loadingToast);
        return response.data;
      } catch (error) {
        toast.dismiss(loadingToast);
        throw error;
      }
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-students'] });
      toast.success(`Student ${variables.isActive ? 'activated' : 'deactivated'} successfully`);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update status');
    },
  });

  // Create student mutation with enhanced error handling
  const createMutation = useMutation({
    mutationFn: async (newStudent) => {
      const loadingToast = toast.loading('Creating student...');
      try {
        const response = await api.post('/students', newStudent);
        toast.dismiss(loadingToast);
        return response.data;
      } catch (error) {
        toast.dismiss(loadingToast);
        throw error;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-students'] });
      toast.success('Student created successfully');
      setOpenDialog(false);
      formik.resetForm();
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.message || 'Failed to create student';
      toast.error(errorMessage);
    },
  });

  // Update student mutation
  const updateMutation = useMutation({
    mutationFn: async (updatedStudent) => {
      const loadingToast = toast.loading('Updating student...');
      try {
        const response = await api.put(`/students/${updatedStudent.id}`, updatedStudent);
        toast.dismiss(loadingToast);
        return response.data;
      } catch (error) {
        toast.dismiss(loadingToast);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-students'] });
      toast.success('Student updated successfully');
      setOpenDialog(false);
      formik.resetForm();
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.message || 'Failed to update student';
      toast.error(errorMessage);
    },
  });

  // Delete student mutation
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const loadingToast = toast.loading('Deleting student...');
      try {
        const response = await api.delete(`/students/${id}`);
        toast.dismiss(loadingToast);
        return response.data;
      } catch (error) {
        toast.dismiss(loadingToast);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-students'] });
      toast.warning('Student deleted successfully');
      setOpenDeleteDialog(false);
      setDeleteTarget(null);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete student');
    },
  });

  // Bulk delete mutation
  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids) => {
      const loadingToast = toast.loading(`Deleting ${ids.length} students...`);
      try {
        const response = await api.post('/students/bulk-delete', { ids });
        toast.dismiss(loadingToast);
        return response.data;
      } catch (error) {
        toast.dismiss(loadingToast);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-students'] });
      setSelectedStudents([]);
      toast.success('Selected students deleted successfully');
      setOpenBulkDeleteDialog(false);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete selected students');
    },
  });

  const handleToggleStatus = (student) => {
    const newStatus = !(student.isActive || student.is_active);
    toggleStatusMutation.mutate({ 
      id: student.id, 
      isActive: newStatus 
    });
  };

  const formik = useFormik({
    initialValues: {
      firstName: selectedStudent?.firstName || selectedStudent?.first_name || '',
      lastName: selectedStudent?.lastName || selectedStudent?.last_name || '',
      email: selectedStudent?.email || '',
      studentNumber: selectedStudent?.studentNumber || selectedStudent?.student_number || '',
      major: selectedStudent?.major || '',
      phone: selectedStudent?.phone || '',
      dateOfBirth: selectedStudent?.dateOfBirth || selectedStudent?.date_of_birth || '',
      address: selectedStudent?.address || '',
      enrollmentDate: selectedStudent?.enrollmentDate || selectedStudent?.enrollment_date || '',
      status: selectedStudent?.isActive || selectedStudent?.is_active ? 'active' : 'inactive',
      currentSemester: selectedStudent?.currentSemester || selectedStudent?.current_semester || 1,
    },
    validationSchema,
    enableReinitialize: true,
    validateOnChange: true,
    validateOnBlur: true,
    onSubmit: async (values, { setSubmitting }) => {
      const studentData = {
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        studentNumber: values.studentNumber,
        major: values.major,
        phone: values.phone || null,
        dateOfBirth: values.dateOfBirth || null,
        address: values.address || null,
        enrollmentDate: values.enrollmentDate,
        currentSemester: parseInt(values.currentSemester),
        isActive: values.status === 'active',
      };
      
      try {
        if (selectedStudent) {
          await updateMutation.mutateAsync({ id: selectedStudent.id, ...studentData });
        } else {
          await createMutation.mutateAsync(studentData);
        }
      } catch (error) {
        console.error('Form submission error:', error);
      } finally {
        setSubmitting(false);
      }
    },
  });

  // Real-time validation feedback
  useEffect(() => {
    const errors = {};
    if (formik.values.firstName && formik.values.firstName.length < 2) {
      errors.firstName = 'First name is too short';
    }
    if (formik.values.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formik.values.email)) {
      errors.email = 'Invalid email format';
    }
    setFormErrors(errors);
  }, [formik.values]);

  const handleOpenDialog = (student = null) => {
    setSelectedStudent(student);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    if (formik.dirty) {
      if (window.confirm('You have unsaved changes. Are you sure you want to close?')) {
        setOpenDialog(false);
        setSelectedStudent(null);
        formik.resetForm();
      }
      return;
    }
    setOpenDialog(false);
    setSelectedStudent(null);
    formik.resetForm();
  };

  const handleViewStudent = (student) => {
    setSelectedStudent(student);
    setOpenViewDialog(true);
  };

  const handleCloseViewDialog = () => {
    setOpenViewDialog(false);
    setSelectedStudent(null);
  };

  const handleDeleteClick = (student) => {
    setDeleteTarget(student);
    setOpenDeleteDialog(true);
  };

  const handleConfirmDelete = () => {
    if (deleteTarget) {
      deleteMutation.mutate(deleteTarget.id);
    }
  };

  const handleBulkDeleteClick = () => {
    setOpenBulkDeleteDialog(true);
  };

  const handleConfirmBulkDelete = () => {
    bulkDeleteMutation.mutate(selectedStudents);
  };

  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelectedStudents(filteredStudents.map(s => s.id));
    } else {
      setSelectedStudents([]);
    }
  };

  const handleSelectStudent = (id) => {
    setSelectedStudents(prev => 
      prev.includes(id) ? prev.filter(sId => sId !== id) : [...prev, id]
    );
  };

  const handleExport = () => {
    try {
      const csvContent = [
        ['ID', 'Student Number', 'First Name', 'Last Name', 'Email', 'Major', 'Semester', 'GPA', 'Status', 'Enrollment Date', 'Phone', 'Address'],
        ...filteredStudents.map(s => [
          s.id,
          s.studentNumber || s.student_number,
          s.firstName || s.first_name,
          s.lastName || s.last_name,
          s.email,
          s.major,
          s.currentSemester || s.current_semester || 1,
          s.gpa || '0.0',
          s.isActive || s.is_active ? 'Active' : 'Inactive',
          formatDate(s.enrollmentDate || s.enrollment_date),
          s.phone || '',
          s.address || ''
        ])
      ].map(row => row.join(',')).join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `students_export_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(`Exported ${filteredStudents.length} students successfully`);
    } catch (error) {
      toast.error('Failed to export students');
    }
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
    toast.info(`Filtered by: ${filter}`);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleRefresh = () => {
    refetch();
    toast.info('Refreshing student data...');
  };

  // Filter students based on search and filter
  const filteredStudents = students?.filter((student) => {
    const matchesSearch = 
      (student.firstName || student.first_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (student.lastName || student.last_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (student.studentNumber || student.student_number || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (student.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (student.major || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterBy === 'all') return matchesSearch;
    if (filterBy === 'active') return matchesSearch && (student.isActive || student.is_active);
    if (filterBy === 'inactive') return matchesSearch && !(student.isActive || student.is_active);
    return matchesSearch;
  }) || [];

  const paginatedStudents = filteredStudents.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const majors = [
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

  // Calculate statistics with fallbacks
  const totalStudents = students?.length || 0;
  const activeStudents = students?.filter(s => s.isActive || s.is_active).length || 0;
  const averageGPA = students?.reduce((acc, s) => acc + (parseFloat(s.gpa) || 0), 0) / (students?.length || 1) || 0;

  if (isLoading) {
    return (
      <Box sx={{ width: '100%', mt: 4 }}>
        <LinearProgress />
        <Typography variant="body2" color="textSecondary" align="center" sx={{ mt: 2 }}>
          Loading students...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ mt: 4 }}>
        <Alert 
          severity="error"
          variant="filled"
          action={
            <Button color="inherit" size="small" onClick={() => refetch()}>
              Retry
            </Button>
          }
        >
          Failed to load students. Please check your connection and try again.
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
            Student Management
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Manage all students, their profiles, and academic records
          </Typography>
        </Box>
        <Stack direction="row" spacing={2}>
          <Tooltip title="Refresh data">
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={handleRefresh}
              disabled={isFetching}
            >
              {isFetching ? 'Refreshing...' : 'Refresh'}
            </Button>
          </Tooltip>
          
          <Tooltip title="Export to CSV">
            <Button
              variant="outlined"
              startIcon={<ExportIcon />}
              onClick={handleExport}
              disabled={filteredStudents.length === 0}
            >
              Export
            </Button>
          </Tooltip>
          
          {selectedStudents.length > 0 && (
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={handleBulkDeleteClick}
            >
              {`Delete Selected (${selectedStudents.length})`}
            </Button>
          )}
          
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Add Student
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
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    {totalStudents}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    {activeStudents} active
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'primary.main' }}>
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
                    Active Students
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                    {activeStudents}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'success.main' }}>
                    {((activeStudents / (totalStudents || 1)) * 100).toFixed(1)}% of total
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'success.main' }}>
                  <CheckCircleIcon />
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
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'info.main' }}>
                    {averageGPA.toFixed(2)}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    Across all students
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'info.main' }}>
                  <BadgeIcon />
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
                    Inactive Students
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'error.main' }}>
                    {students?.filter(s => !(s.isActive || s.is_active)).length || 0}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'error.main' }}>
                    Need attention
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'error.main' }}>
                  <WarningIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Main Table */}
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <TextField
            placeholder="Search students by name, ID, email, major..."
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
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
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
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
              color={filterBy !== 'all' ? 'primary' : 'inherit'}
            >
              {`Filter: ${filterBy.charAt(0).toUpperCase() + filterBy.slice(1)}`}
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
                    checked={selectedStudents.length === filteredStudents.length && filteredStudents.length > 0}
                    onChange={handleSelectAll}
                    style={{ cursor: 'pointer', width: 18, height: 18 }}
                  />
                </TableCell>
                <TableCell>Student</TableCell>
                <TableCell>Student ID</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Major</TableCell>
                <TableCell>Semester</TableCell>
                <TableCell>GPA</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedStudents.map((student) => (
                <TableRow 
                  hover 
                  key={student.id}
                  selected={selectedStudents.includes(student.id)}
                  sx={{ cursor: 'pointer' }}
                >
                  <TableCell padding="checkbox">
                    <input
                      type="checkbox"
                      checked={selectedStudents.includes(student.id)}
                      onChange={() => handleSelectStudent(student.id)}
                      style={{ cursor: 'pointer', width: 18, height: 18 }}
                    />
                  </TableCell>
                  <TableCell onClick={() => handleViewStudent(student)}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar 
                        sx={{ 
                          mr: 2, 
                          bgcolor: student.isActive || student.is_active ? 'primary.main' : 'grey.400',
                          width: 40,
                          height: 40
                        }}
                      >
                        {(student.firstName || student.first_name || '')[0]}
                        {(student.lastName || student.last_name || '')[0]}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight="bold">
                          {student.firstName || student.first_name} {student.lastName || student.last_name}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {student.major}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell onClick={() => handleViewStudent(student)}>
                    {student.studentNumber || student.student_number}
                  </TableCell>
                  <TableCell onClick={() => handleViewStudent(student)}>
                    {student.email}
                  </TableCell>
                  <TableCell onClick={() => handleViewStudent(student)}>
                    {student.major}
                  </TableCell>
                  <TableCell onClick={() => handleViewStudent(student)}>
                    {`Semester ${student.currentSemester || student.current_semester || 1}`}
                  </TableCell>
                  <TableCell onClick={() => handleViewStudent(student)}>
                    <Chip
                      label={student.gpa || '0.0'}
                      size="small"
                      color={student.gpa >= 3.5 ? 'success' : student.gpa >= 2.5 ? 'warning' : 'error'}
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip
                        label={(student.isActive || student.is_active) ? 'Active' : 'Inactive'}
                        color={(student.isActive || student.is_active) ? 'success' : 'default'}
                        size="small"
                      />
                      <Tooltip title={student.isActive || student.is_active ? 'Deactivate' : 'Activate'}>
                        <Switch
                          checked={student.isActive || student.is_active}
                          onChange={() => handleToggleStatus(student)}
                          color="success"
                          size="small"
                        />
                      </Tooltip>
                    </Box>
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="View Details">
                      <IconButton 
                        size="small" 
                        onClick={() => handleViewStudent(student)}
                      >
                        <ViewIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit Student">
                      <IconButton 
                        size="small" 
                        onClick={() => handleOpenDialog(student)}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete Student">
                      <IconButton 
                        size="small" 
                        onClick={() => handleDeleteClick(student)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
              {paginatedStudents.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 5 }}>
                    <Box>
                      <SearchIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                      <Typography color="textSecondary" variant="h6">
                        No students found
                      </Typography>
                      <Typography color="textSecondary" variant="body2">
                        Try adjusting your search or filter criteria
                      </Typography>
                      <Button 
                        variant="outlined" 
                        sx={{ mt: 2 }}
                        onClick={() => {
                          setSearchTerm('');
                          setFilterBy('all');
                        }}
                      >
                        Clear Filters
                      </Button>
                    </Box>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50, 100]}
          component="div"
          count={filteredStudents.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>

      {/* Student Form Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>
          {selectedStudent ? 'Edit Student' : 'Add New Student'}
        </DialogTitle>
        <form onSubmit={formik.handleSubmit}>
          <DialogContent>
            {/* Form validation summary */}
            {Object.keys(formik.errors).length > 0 && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                Please fix the following errors before submitting:
                <ul style={{ margin: '4px 0 0 20px' }}>
                  {Object.entries(formik.errors).map(([field, error]) => (
                    <li key={field}>
                      <Typography variant="body2">
                        <strong>{field}:</strong> {error}
                      </Typography>
                    </li>
                  ))}
                </ul>
              </Alert>
            )}

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
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
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
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
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  name="email"
                  label="Email Address"
                  type="email"
                  value={formik.values.email}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.email && Boolean(formik.errors.email)}
                  helperText={formik.touched.email && formik.errors.email}
                  margin="normal"
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  name="studentNumber"
                  label="Student Number"
                  value={formik.values.studentNumber}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.studentNumber && Boolean(formik.errors.studentNumber)}
                  helperText={formik.touched.studentNumber && formik.errors.studentNumber}
                  margin="normal"
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth margin="normal" required>
                  <InputLabel>Major</InputLabel>
                  <Select
                    name="major"
                    value={formik.values.major}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.major && Boolean(formik.errors.major)}
                  >
                    {majors.map((major) => (
                      <MenuItem key={major} value={major}>
                        {major}
                      </MenuItem>
                    ))}
                  </Select>
                  {formik.touched.major && formik.errors.major && (
                    <FormHelperText error>{formik.errors.major}</FormHelperText>
                  )}
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  name="currentSemester"
                  label="Current Semester"
                  type="number"
                  value={formik.values.currentSemester}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.currentSemester && Boolean(formik.errors.currentSemester)}
                  helperText={formik.touched.currentSemester && formik.errors.currentSemester}
                  margin="normal"
                  required
                  inputProps={{ min: 1, max: 12 }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
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
              </Grid>
              <Grid item xs={12} sm={6}>
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
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  name="enrollmentDate"
                  label="Enrollment Date"
                  type="date"
                  value={formik.values.enrollmentDate}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.enrollmentDate && Boolean(formik.errors.enrollmentDate)}
                  helperText={formik.touched.enrollmentDate && formik.errors.enrollmentDate}
                  InputLabelProps={{ shrink: true }}
                  margin="normal"
                  required
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
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
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
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="contained" 
              color="primary"
              disabled={createMutation.isPending || updateMutation.isPending || formik.isSubmitting}
            >
              {createMutation.isPending || updateMutation.isPending || formik.isSubmitting
                ? 'Saving...' 
                : (selectedStudent ? 'Update Student' : 'Create Student')}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* View Student Dialog */}
      <Dialog 
        open={openViewDialog} 
        onClose={handleCloseViewDialog} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>
          Student Profile
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
              {/* Header with Avatar */}
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                  <Avatar 
                    sx={{ 
                      width: 100, 
                      height: 100, 
                      bgcolor: 'primary.main',
                      fontSize: '2.5rem'
                    }}
                  >
                    {(selectedStudent.firstName || selectedStudent.first_name || '')[0]}
                    {(selectedStudent.lastName || selectedStudent.last_name || '')[0]}
                  </Avatar>
                  <Box>
                    <Typography variant="h5">
                      {selectedStudent.firstName || selectedStudent.first_name} {selectedStudent.lastName || selectedStudent.last_name}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                      <Chip 
                        label={selectedStudent.studentNumber || selectedStudent.student_number} 
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                      <Chip 
                        label={(selectedStudent.isActive || selectedStudent.is_active) ? 'Active' : 'Inactive'}
                        color={(selectedStudent.isActive || selectedStudent.is_active) ? 'success' : 'default'}
                        size="small"
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
                    <Typography variant="h6" gutterBottom color="primary">
                      Personal Information
                    </Typography>
                    <Stack spacing={2}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <EmailIcon fontSize="small" color="action" />
                        <Typography variant="body2">{selectedStudent.email}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PhoneIcon fontSize="small" color="action" />
                        <Typography variant="body2">{selectedStudent.phone || 'Not provided'}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CalendarIcon fontSize="small" color="action" />
                        <Typography variant="body2">
                          DOB: {formatDate(selectedStudent.dateOfBirth || selectedStudent.date_of_birth) || 'Not provided'}
                        </Typography>
                      </Box>
                      {selectedStudent.address && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <LocationIcon fontSize="small" color="action" />
                          <Typography variant="body2">{selectedStudent.address}</Typography>
                        </Box>
                      )}
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>

              {/* Academic Information */}
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom color="secondary">
                      Academic Information
                    </Typography>
                    <Stack spacing={2}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="textSecondary">Student Number:</Typography>
                        <Typography variant="body2" fontWeight="bold">{selectedStudent.studentNumber || selectedStudent.student_number}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="textSecondary">Major:</Typography>
                        <Typography variant="body2">{selectedStudent.major}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="textSecondary">Current Semester:</Typography>
                        <Typography variant="body2" fontWeight="bold">{selectedStudent.currentSemester || selectedStudent.current_semester || 1}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="textSecondary">GPA:</Typography>
                        <Chip 
                          label={selectedStudent.gpa || '0.0'}
                          size="small"
                          color={selectedStudent.gpa >= 3.5 ? 'success' : selectedStudent.gpa >= 2.5 ? 'warning' : 'error'}
                        />
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="textSecondary">Enrollment Date:</Typography>
                        <Typography variant="body2">{formatDate(selectedStudent.enrollmentDate || selectedStudent.enrollment_date)}</Typography>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>

              {/* Enrolled Courses (if any) */}
              {selectedStudent.enrollments && selectedStudent.enrollments.length > 0 && (
                <Grid item xs={12}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom color="info.main">
                        Enrolled Courses
                      </Typography>
                      <Grid container spacing={1}>
                        {selectedStudent.enrollments.map((enrollment) => (
                          <Grid item xs={12} sm={6} md={4} key={enrollment.id}>
                            <Paper variant="outlined" sx={{ p: 1.5 }}>
                              <Typography variant="subtitle2" fontWeight="bold">
                                {enrollment.course?.courseCode}
                              </Typography>
                              <Typography variant="body2" color="textSecondary">
                                {enrollment.course?.courseName}
                              </Typography>
                              {enrollment.grade && (
                                <Chip 
                                  label={`Grade: ${enrollment.grade}`}
                                  size="small"
                                  sx={{ mt: 1 }}
                                />
                              )}
                            </Paper>
                          </Grid>
                        ))}
                      </Grid>
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
              handleOpenDialog(selectedStudent);
            }}
          >
            Edit Profile
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={openDeleteDialog}
        onClose={() => setOpenDeleteDialog(false)}
      >
        <DialogTitle sx={{ color: 'error.main' }}>
          Confirm Delete
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete{' '}
            <strong>
              {deleteTarget?.firstName || deleteTarget?.first_name} {deleteTarget?.lastName || deleteTarget?.last_name}
            </strong>
            ?
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
            This action cannot be undone. The student will be permanently removed from the system.
          </Typography>
          {deleteTarget?.enrollments?.length > 0 && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              This student is enrolled in {deleteTarget.enrollments.length} course(s). 
              Please unenroll before deleting.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleConfirmDelete} 
            color="error" 
            variant="contained"
            disabled={deleteMutation.isPending || deleteTarget?.enrollments?.length > 0}
          >
            {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Delete Confirmation Dialog */}
      <Dialog
        open={openBulkDeleteDialog}
        onClose={() => setOpenBulkDeleteDialog(false)}
      >
        <DialogTitle sx={{ color: 'error.main' }}>
          Confirm Bulk Delete
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete <strong>{selectedStudents.length}</strong> selected students?
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
            This action cannot be undone. All selected students will be permanently removed from the system.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenBulkDeleteDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleConfirmBulkDelete} 
            color="error" 
            variant="contained"
            disabled={bulkDeleteMutation.isPending}
          >
            {bulkDeleteMutation.isPending ? 'Deleting...' : `Delete ${selectedStudents.length} Students`}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};  

export default AdminStudents;