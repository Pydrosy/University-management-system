// src/pages/admin/AdminTeachers.js
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
  FormHelperText,
  Alert,
  LinearProgress,
  Tooltip,
  Card,
  CardContent,
  Stack,
  Divider,
  Switch,
  FormControlLabel,
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
  Work as WorkIcon,
  Badge as BadgeIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Close as CloseIcon,
  LocationOn as LocationIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { toast } from 'react-toastify';
import api from '../../services/api';
import { formatDate } from '../../utils/formatters';

// Enhanced validation schema
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
    .max(100, 'Email cannot exceed 100 characters'),
  
  employeeId: yup.string()
    .required('Employee ID is required')
    .min(3, 'Employee ID must be at least 3 characters')
    .max(20, 'Employee ID cannot exceed 20 characters'),
  
  department: yup.string()
    .required('Department is required'),
  
  qualification: yup.string()
    .required('Qualification is required')
    .min(2, 'Qualification must be at least 2 characters')
    .max(100, 'Qualification cannot exceed 100 characters'),
  
  specialization: yup.string()
    .required('Specialization is required')
    .min(2, 'Specialization must be at least 2 characters')
    .max(100, 'Specialization cannot exceed 100 characters'),
  
  phone: yup.string()
    .matches(/^[0-9+\-\s()]{10,20}$/, 'Please enter a valid phone number')
    .nullable(),
  
  address: yup.string()
    .max(200, 'Address cannot exceed 200 characters')
    .nullable(),
  
  joiningDate: yup.date()
    .required('Joining date is required')
    .max(new Date(), 'Joining date cannot be in the future'),
  
  status: yup.string()
    .required('Status is required'),
});

const AdminTeachers = () => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBy, setFilterBy] = useState('all');
  const [openDialog, setOpenDialog] = useState(false);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openBulkDeleteDialog, setOpenBulkDeleteDialog] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [selectedTeachers, setSelectedTeachers] = useState([]);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const queryClient = useQueryClient();

  // Fetch teachers
  const { data: teachers, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['admin-teachers'],
    queryFn: async () => {
      const response = await api.get('/teachers');
      return response.data.data || response.data;
    }
  });

  // Debug: Log teachers data to see structure
  console.log('Teachers data:', teachers);

  // Calculate statistics
  const totalTeachers = teachers?.length || 0;
  const activeTeachers = teachers?.filter(t => t.isActive === true).length || 0;
  const inactiveTeachers = teachers?.filter(t => t.isActive === false).length || 0;
  const uniqueDepartments = new Set(teachers?.map(t => t.department)).size || 0;

  // Calculate average experience
  const averageExperience = teachers?.reduce((acc, t) => {
    if (!t.joiningDate) return acc;
    const years = new Date().getFullYear() - new Date(t.joiningDate).getFullYear();
    return acc + (years > 0 ? years : 0);
  }, 0) / (teachers?.length || 1) || 0;

  // Toggle status mutation
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, isActive }) => {
      const response = await api.put(`/teachers/${id}/toggle-status`, { isActive });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-teachers'] });
      toast.success('Teacher status updated successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update status');
    },
  });

  // Create teacher mutation
  const createMutation = useMutation({
    mutationFn: async (newTeacher) => {
      const response = await api.post('/teachers', newTeacher);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-teachers'] });
      toast.success(`Teacher ${data.data?.firstName} ${data.data?.lastName} created successfully`);
      setOpenDialog(false);
      formik.resetForm();
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.message || 'Failed to create teacher';
      toast.error(errorMessage);
    },
  });

  // Update teacher mutation
  const updateMutation = useMutation({
    mutationFn: async (updatedTeacher) => {
      const response = await api.put(`/teachers/${updatedTeacher.id}`, updatedTeacher);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-teachers'] });
      toast.success('Teacher updated successfully');
      setOpenDialog(false);
      formik.resetForm();
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.message || 'Failed to update teacher';
      toast.error(errorMessage);
    },
  });

  // Delete teacher mutation
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const response = await api.delete(`/teachers/${id}`);
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-teachers'] });
      const teacher = teachers?.find(t => t.id === variables);
      toast.warning(`${teacher?.firstName} ${teacher?.lastName} deleted successfully`);
      setOpenDeleteDialog(false);
      setDeleteTarget(null);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete teacher');
    },
  });

  // Bulk delete mutation
  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids) => {
      const response = await api.post('/teachers/bulk-delete', { ids });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-teachers'] });
      setSelectedTeachers([]);
      toast.success(`${selectedTeachers.length} teachers deleted successfully`);
      setOpenBulkDeleteDialog(false);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete selected teachers');
    },
  });

  const handleToggleStatus = (teacher) => {
    const newStatus = !teacher.isActive;
    toggleStatusMutation.mutate({ id: teacher.id, isActive: newStatus });
  };

  const formik = useFormik({
    initialValues: {
      firstName: selectedTeacher?.firstName || '',
      lastName: selectedTeacher?.lastName || '',
      email: selectedTeacher?.email || '',
      employeeId: selectedTeacher?.employeeId || '',
      department: selectedTeacher?.department || '',
      qualification: selectedTeacher?.qualification || '',
      specialization: selectedTeacher?.specialization || '',
      phone: selectedTeacher?.phone || '',
      address: selectedTeacher?.address || '',
      joiningDate: selectedTeacher?.joiningDate ? selectedTeacher.joiningDate.split('T')[0] : '',
      status: selectedTeacher?.isActive ? 'active' : 'inactive',
    },
    validationSchema,
    enableReinitialize: true,
    onSubmit: async (values, { setSubmitting }) => {
      const teacherData = {
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        employeeId: values.employeeId,
        department: values.department,
        qualification: values.qualification,
        specialization: values.specialization,
        phone: values.phone || null,
        address: values.address || null,
        joiningDate: values.joiningDate,
        isActive: values.status === 'active',
      };
      
      try {
        if (selectedTeacher) {
          await updateMutation.mutateAsync({ id: selectedTeacher.id, ...teacherData });
        } else {
          await createMutation.mutateAsync(teacherData);
        }
      } catch (error) {
        console.error('Form submission error:', error);
      } finally {
        setSubmitting(false);
      }
    },
  });

  const handleOpenDialog = (teacher = null) => {
    setSelectedTeacher(teacher);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    if (formik.dirty && !window.confirm('You have unsaved changes. Are you sure you want to close?')) {
      return;
    }
    setOpenDialog(false);
    setSelectedTeacher(null);
    formik.resetForm();
  };

  const handleViewTeacher = (teacher) => {
    setSelectedTeacher(teacher);
    setOpenViewDialog(true);
  };

  const handleCloseViewDialog = () => {
    setOpenViewDialog(false);
    setSelectedTeacher(null);
  };

  const handleDeleteClick = (teacher) => {
    setDeleteTarget(teacher);
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
    bulkDeleteMutation.mutate(selectedTeachers);
  };

  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelectedTeachers(filteredTeachers.map(t => t.id));
    } else {
      setSelectedTeachers([]);
    }
  };

  const handleSelectTeacher = (id) => {
    setSelectedTeachers(prev => 
      prev.includes(id) ? prev.filter(tId => tId !== id) : [...prev, id]
    );
  };

  const handleExport = () => {
    try {
      const csvContent = [
        ['ID', 'Employee ID', 'First Name', 'Last Name', 'Email', 'Department', 'Qualification', 'Specialization', 'Status', 'Joining Date', 'Phone', 'Address'],
        ...filteredTeachers.map(t => [
          t.id,
          t.employeeId,
          t.firstName,
          t.lastName,
          t.email,
          t.department,
          t.qualification,
          t.specialization,
          t.isActive ? 'Active' : 'Inactive',
          formatDate(t.joiningDate),
          t.phone || '',
          t.address || ''
        ])
      ].map(row => row.join(',')).join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `teachers_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success(`Exported ${filteredTeachers.length} teachers`);
    } catch (error) {
      toast.error('Export failed');
    }
  };

  const handleFilterSelect = (filter) => {
    setFilterBy(filter);
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
    toast.info('Refreshing data...');
  };

  // Filter teachers
  const filteredTeachers = teachers?.filter((teacher) => {
    const matchesSearch = 
      (teacher.firstName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (teacher.lastName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (teacher.employeeId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (teacher.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (teacher.department || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterBy === 'all') return matchesSearch;
    if (filterBy === 'active') return matchesSearch && teacher.isActive === true;
    if (filterBy === 'inactive') return matchesSearch && teacher.isActive === false;
    return matchesSearch;
  }) || [];

  const paginatedTeachers = filteredTeachers.slice(
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

  if (isLoading) {
    return (
      <Box sx={{ width: '100%', mt: 4 }}>
        <LinearProgress />
        <Typography variant="body2" color="textSecondary" align="center" sx={{ mt: 2 }}>
          Loading teachers...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ mt: 4 }}>
        <Alert severity="error" action={<Button color="inherit" size="small" onClick={refetch}>Retry</Button>}>
          Failed to load teachers. Please try again.
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom>Teacher Management</Typography>
          <Typography variant="body2" color="textSecondary">
            Manage all teachers, their profiles, and assignments
          </Typography>
        </Box>
        <Stack direction="row" spacing={2}>
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={handleRefresh} disabled={isFetching}>
            {isFetching ? 'Refreshing...' : 'Refresh'}
          </Button>
          <Button variant="outlined" startIcon={<ExportIcon />} onClick={handleExport} disabled={!filteredTeachers.length}>
            Export
          </Button>
          {selectedTeachers.length > 0 && (
            <Button variant="outlined" color="error" startIcon={<DeleteIcon />} onClick={handleBulkDeleteClick}>
              Delete ({selectedTeachers.length})
            </Button>
          )}
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
            Add Teacher
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
                  <Typography color="textSecondary" gutterBottom>Total Teachers</Typography>
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>{totalTeachers}</Typography>
                  <Typography variant="caption" color="textSecondary">
                    {activeTeachers} active, {inactiveTeachers} inactive
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'primary.main' }}><SchoolIcon /></Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom>Active Teachers</Typography>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'success.main' }}>{activeTeachers}</Typography>
                  <Typography variant="caption" sx={{ color: 'success.main' }}>
                    {((activeTeachers / (totalTeachers || 1)) * 100).toFixed(1)}% of total
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'success.main' }}><CheckCircleIcon /></Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom>Inactive Teachers</Typography>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'error.main' }}>{inactiveTeachers}</Typography>
                  <Typography variant="caption" sx={{ color: 'error.main' }}>Need attention</Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'error.main' }}><WarningIcon /></Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom>Departments</Typography>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'info.main' }}>{uniqueDepartments}</Typography>
                  <Typography variant="caption" color="textSecondary">Unique departments</Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'info.main' }}><WorkIcon /></Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Search and Filter */}
      <Paper sx={{ width: '100%', mb: 2, p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <TextField
            placeholder="Search teachers..."
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment>,
              endAdornment: searchTerm && (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setSearchTerm('')}><CloseIcon fontSize="small" /></IconButton>
                </InputAdornment>
              ),
            }}
            sx={{ width: 300 }}
          />
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Chip label={`${filteredTeachers.length} teachers`} color="primary" variant="outlined" />
            <Button
              variant="outlined"
              size="small"
              startIcon={<FilterIcon />}
              onClick={() => handleFilterSelect(filterBy === 'all' ? 'active' : filterBy === 'active' ? 'inactive' : 'all')}
            >
              Filter: {filterBy}
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Teachers Table */}
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer sx={{ maxHeight: 500 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <input
                    type="checkbox"
                    checked={selectedTeachers.length === filteredTeachers.length && filteredTeachers.length > 0}
                    onChange={handleSelectAll}
                  />
                </TableCell>
                <TableCell>Teacher</TableCell>
                <TableCell>Employee ID</TableCell>
                <TableCell>Department</TableCell>
                <TableCell>Qualification</TableCell>
                <TableCell>Specialization</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedTeachers.map((teacher) => (
                <TableRow hover key={teacher.id} selected={selectedTeachers.includes(teacher.id)}>
                  <TableCell padding="checkbox">
                    <input
                      type="checkbox"
                      checked={selectedTeachers.includes(teacher.id)}
                      onChange={() => handleSelectTeacher(teacher.id)}
                    />
                  </TableCell>
                  <TableCell onClick={() => handleViewTeacher(teacher)}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar sx={{ mr: 2, bgcolor: teacher.isActive ? 'secondary.main' : 'grey.400' }}>
                        {teacher.firstName?.[0]}{teacher.lastName?.[0]}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight="bold">
                          {teacher.firstName} {teacher.lastName}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">{teacher.qualification}</Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>{teacher.employeeId}</TableCell>
                  <TableCell>{teacher.department}</TableCell>
                  <TableCell>{teacher.qualification}</TableCell>
                  <TableCell>{teacher.specialization}</TableCell>
                  <TableCell>{teacher.email}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip
                        label={teacher.isActive ? 'Active' : 'Inactive'}
                        color={teacher.isActive ? 'success' : 'default'}
                        size="small"
                        sx={{ 
                          bgcolor: teacher.isActive ? 'success.main' : 'action.disabledBackground',
                          color: teacher.isActive ? 'white' : 'text.secondary'
                        }}
                      />
                      <Tooltip title={teacher.isActive ? 'Deactivate' : 'Activate'}>
                        <Switch
                          checked={teacher.isActive}
                          onChange={() => handleToggleStatus(teacher)}
                          color="success"
                          size="small"
                        />
                      </Tooltip>
                    </Box>
                  </TableCell>
                  <TableCell align="center">
                    <IconButton size="small" onClick={() => handleViewTeacher(teacher)}><ViewIcon fontSize="small" /></IconButton>
                    <IconButton size="small" onClick={() => handleOpenDialog(teacher)}><EditIcon fontSize="small" /></IconButton>
                    <IconButton size="small" onClick={() => handleDeleteClick(teacher)}><DeleteIcon fontSize="small" /></IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {!paginatedTeachers.length && (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 5 }}>
                    <SearchIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                    <Typography color="textSecondary">No teachers found</Typography>
                    <Button variant="outlined" sx={{ mt: 2 }} onClick={() => { setSearchTerm(''); setFilterBy('all'); }}>
                      Clear Filters
                    </Button>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredTeachers.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>

      {/* Teacher Form Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>{selectedTeacher ? 'Edit Teacher' : 'Add New Teacher'}</DialogTitle>
        <form onSubmit={formik.handleSubmit}>
          <DialogContent>
            {Object.keys(formik.errors).length > 0 && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                Please fix the following errors:
                <ul>
                  {Object.entries(formik.errors).map(([field, error]) => (
                    <li key={field}><strong>{field}:</strong> {error}</li>
                  ))}
                </ul>
              </Alert>
            )}
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth name="firstName" label="First Name" value={formik.values.firstName}
                  onChange={formik.handleChange} onBlur={formik.handleBlur}
                  error={formik.touched.firstName && Boolean(formik.errors.firstName)}
                  helperText={formik.touched.firstName && formik.errors.firstName} required />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth name="lastName" label="Last Name" value={formik.values.lastName}
                  onChange={formik.handleChange} onBlur={formik.handleBlur}
                  error={formik.touched.lastName && Boolean(formik.errors.lastName)}
                  helperText={formik.touched.lastName && formik.errors.lastName} required />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth name="email" label="Email" type="email" value={formik.values.email}
                  onChange={formik.handleChange} onBlur={formik.handleBlur}
                  error={formik.touched.email && Boolean(formik.errors.email)}
                  helperText={formik.touched.email && formik.errors.email} required />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth name="employeeId" label="Employee ID" value={formik.values.employeeId}
                  onChange={formik.handleChange} onBlur={formik.handleBlur}
                  error={formik.touched.employeeId && Boolean(formik.errors.employeeId)}
                  helperText={formik.touched.employeeId && formik.errors.employeeId} required />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required error={formik.touched.department && Boolean(formik.errors.department)}>
                  <InputLabel>Department</InputLabel>
                  <Select name="department" value={formik.values.department} onChange={formik.handleChange}>
                    {departments.map((dept) => <MenuItem key={dept} value={dept}>{dept}</MenuItem>)}
                  </Select>
                  {formik.touched.department && formik.errors.department && (
                    <FormHelperText>{formik.errors.department}</FormHelperText>
                  )}
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth name="qualification" label="Qualification" value={formik.values.qualification}
                  onChange={formik.handleChange} onBlur={formik.handleBlur}
                  error={formik.touched.qualification && Boolean(formik.errors.qualification)}
                  helperText={formik.touched.qualification && formik.errors.qualification} required />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth name="specialization" label="Specialization" value={formik.values.specialization}
                  onChange={formik.handleChange} onBlur={formik.handleBlur}
                  error={formik.touched.specialization && Boolean(formik.errors.specialization)}
                  helperText={formik.touched.specialization && formik.errors.specialization} required />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth name="phone" label="Phone" value={formik.values.phone}
                  onChange={formik.handleChange} onBlur={formik.handleBlur}
                  error={formik.touched.phone && Boolean(formik.errors.phone)}
                  helperText={formik.touched.phone && formik.errors.phone} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth name="joiningDate" label="Joining Date" type="date"
                  value={formik.values.joiningDate} onChange={formik.handleChange}
                  onBlur={formik.handleBlur} error={formik.touched.joiningDate && Boolean(formik.errors.joiningDate)}
                  helperText={formik.touched.joiningDate && formik.errors.joiningDate}
                  InputLabelProps={{ shrink: true }} required />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select name="status" value={formik.values.status} onChange={formik.handleChange}>
                    <MenuItem value="active">Active</MenuItem>
                    <MenuItem value="inactive">Inactive</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth name="address" label="Address" multiline rows={2}
                  value={formik.values.address} onChange={formik.handleChange}
                  onBlur={formik.handleBlur} error={formik.touched.address && Boolean(formik.errors.address)}
                  helperText={formik.touched.address && formik.errors.address} />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={createMutation.isPending || updateMutation.isPending}>
              {createMutation.isPending || updateMutation.isPending ? 'Saving...' : (selectedTeacher ? 'Update' : 'Create')}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* View Teacher Dialog */}
      <Dialog open={openViewDialog} onClose={handleCloseViewDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          Teacher Profile
          <IconButton onClick={handleCloseViewDialog} sx={{ position: 'absolute', right: 8, top: 8 }}><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {selectedTeacher && (
            <Grid container spacing={3}>
              <Grid item xs={12} sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <Avatar sx={{ width: 80, height: 80, bgcolor: selectedTeacher.isActive ? 'secondary.main' : 'grey.400', fontSize: '2rem' }}>
                  {selectedTeacher.firstName?.[0]}{selectedTeacher.lastName?.[0]}
                </Avatar>
                <Box>
                  <Typography variant="h5">{selectedTeacher.firstName} {selectedTeacher.lastName}</Typography>
                  <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                    <Chip label={selectedTeacher.employeeId} size="small" color="primary" variant="outlined" />
                    <Chip label={selectedTeacher.isActive ? 'Active' : 'Inactive'}
                      color={selectedTeacher.isActive ? 'success' : 'default'} size="small" />
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12}><Divider /></Grid>
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Personal Information</Typography>
                    <Stack spacing={1}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <EmailIcon fontSize="small" color="action" />
                        <Typography>{selectedTeacher.email}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PhoneIcon fontSize="small" color="action" />
                        <Typography>{selectedTeacher.phone || 'Not provided'}</Typography>
                      </Box>
                      {selectedTeacher.address && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <LocationIcon fontSize="small" color="action" />
                          <Typography>{selectedTeacher.address}</Typography>
                        </Box>
                      )}
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Professional Information</Typography>
                    <Stack spacing={1}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography color="textSecondary">Department:</Typography>
                        <Typography fontWeight="bold">{selectedTeacher.department}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography color="textSecondary">Qualification:</Typography>
                        <Typography>{selectedTeacher.qualification}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography color="textSecondary">Specialization:</Typography>
                        <Typography>{selectedTeacher.specialization}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography color="textSecondary">Joining Date:</Typography>
                        <Typography>{formatDate(selectedTeacher.joiningDate)}</Typography>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseViewDialog}>Close</Button>
          <Button variant="contained" onClick={() => { handleCloseViewDialog(); handleOpenDialog(selectedTeacher); }}>Edit</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
        <DialogTitle sx={{ color: 'error.main' }}>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>Delete <strong>{deleteTarget?.firstName} {deleteTarget?.lastName}</strong>?</Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>This action cannot be undone.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)}>Cancel</Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained" disabled={deleteMutation.isPending}>
            {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Delete Dialog */}
      <Dialog open={openBulkDeleteDialog} onClose={() => setOpenBulkDeleteDialog(false)}>
        <DialogTitle sx={{ color: 'error.main' }}>Confirm Bulk Delete</DialogTitle>
        <DialogContent>
          <Typography>Delete {selectedTeachers.length} selected teachers?</Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>This action cannot be undone.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenBulkDeleteDialog(false)}>Cancel</Button>
          <Button onClick={handleConfirmBulkDelete} color="error" variant="contained" disabled={bulkDeleteMutation.isPending}>
            {bulkDeleteMutation.isPending ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminTeachers;