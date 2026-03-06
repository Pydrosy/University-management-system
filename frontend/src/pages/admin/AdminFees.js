// src/pages/admin/AdminFees.js
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
  Refresh as RefreshIcon,
  FileDownload as ExportIcon,
  Payment as PaymentIcon,
  Receipt as ReceiptIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { toast } from 'react-toastify';
import api from '../../services/api';
import { formatDate, formatCurrency } from '../../utils/formatters';

const validationSchema = yup.object({
  studentId: yup.string().required('Student is required'),
  amount: yup.number().required('Amount is required').min(1, 'Amount must be greater than 0'),
  paymentType: yup.string().required('Payment type is required'),
  dueDate: yup.date().required('Due date is required'),
  description: yup.string(),
  status: yup.string().required('Status is required'),
});

const AdminFees = () => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [openDialog, setOpenDialog] = useState(false);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [selectedFee, setSelectedFee] = useState(null);
  const [selectedFees, setSelectedFees] = useState([]);
  const [tabValue, setTabValue] = useState(0);
  const queryClient = useQueryClient();

  // Fetch fees
  const { data: fees, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-fees'],
    queryFn: async () => {
      const response = await api.get('/payments');
      return response.data.data || response.data;
    }
  });

  // Fetch students for dropdown with proper nested user data
  const { data: students } = useQuery({
    queryKey: ['students-list'],
    queryFn: async () => {
      const response = await api.get('/students');
      return response.data.data || response.data;
    }
  });

  // Create fee mutation
  const createMutation = useMutation({
    mutationFn: (newFee) => api.post('/payments', newFee),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-fees'] });
      toast.success('Fee record created successfully');
      setOpenDialog(false);
      formik.resetForm();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create fee record');
    },
  });

  // Update fee mutation
  const updateMutation = useMutation({
    mutationFn: (updatedFee) => api.put(`/payments/${updatedFee.id}`, updatedFee),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-fees'] });
      toast.success('Fee record updated successfully');
      setOpenDialog(false);
      formik.resetForm();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update fee record');
    },
  });

  // Delete fee mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/payments/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-fees'] });
      toast.success('Fee record deleted successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete fee record');
    },
  });

  // Mark as paid mutation
  const markAsPaidMutation = useMutation({
    mutationFn: (id) => api.put(`/payments/${id}/status`, { status: 'completed' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-fees'] });
      toast.success('Payment marked as completed');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update payment status');
    },
  });

  // Bulk delete mutation
  const bulkDeleteMutation = useMutation({
    mutationFn: (ids) => api.post('/payments/bulk-delete', { ids }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-fees'] });
      setSelectedFees([]);
      toast.success('Selected fee records deleted successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete selected records');
    },
  });

  const formik = useFormik({
    initialValues: {
      studentId: selectedFee?.studentId || selectedFee?.student_id || '',
      amount: selectedFee?.amount || '',
      paymentType: selectedFee?.paymentType || selectedFee?.payment_type || 'tuition',
      dueDate: selectedFee?.dueDate || selectedFee?.due_date || '',
      description: selectedFee?.description || '',
      status: selectedFee?.status || 'pending',
    },
    validationSchema,
    enableReinitialize: true,
    onSubmit: (values) => {
      if (selectedFee) {
        updateMutation.mutate({ id: selectedFee.id, ...values });
      } else {
        createMutation.mutate(values);
      }
    },
  });

  const handleOpenDialog = (fee = null) => {
    setSelectedFee(fee);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedFee(null);
    formik.resetForm();
  };

  const handleViewFee = (fee) => {
    setSelectedFee(fee);
    setOpenViewDialog(true);
  };

  const handleCloseViewDialog = () => {
    setOpenViewDialog(false);
    setSelectedFee(null);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this fee record?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleMarkAsPaid = (id) => {
    if (window.confirm('Mark this payment as completed?')) {
      markAsPaidMutation.mutate(id);
    }
  };

  const handleBulkDelete = () => {
    if (selectedFees.length === 0) {
      toast.warning('No records selected');
      return;
    }
    
    if (window.confirm(`Are you sure you want to delete ${selectedFees.length} selected records?`)) {
      bulkDeleteMutation.mutate(selectedFees);
    }
  };

  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelectedFees(filteredFees.map(f => f.id));
    } else {
      setSelectedFees([]);
    }
  };

  const handleSelectFee = (id) => {
    setSelectedFees(prev => 
      prev.includes(id) ? prev.filter(fId => fId !== id) : [...prev, id]
    );
  };

  const handleExport = () => {
    const csvContent = [
      ['ID', 'Student', 'Amount', 'Type', 'Due Date', 'Payment Date', 'Status', 'Transaction ID', 'Description'],
      ...filteredFees.map(f => [
        f.id,
        getStudentName(f.studentId || f.student_id),
        f.amount,
        f.paymentType || f.payment_type,
        formatDate(f.dueDate || f.due_date),
        f.paymentDate ? formatDate(f.paymentDate) : 'N/A',
        f.status,
        f.transactionId || f.transaction_id || 'N/A',
        f.description || ''
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fees_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Get student name by ID - FIXED to handle nested user object
  const getStudentName = (studentId) => {
    const student = students?.find(s => s.id === studentId);
    if (!student) return 'Unknown Student';
    
    // Handle both direct firstName/lastName and nested user object
    if (student.user) {
      // Data comes as { user: { firstName, lastName } }
      return `${student.user.firstName || ''} ${student.user.lastName || ''}`.trim() || 'Unknown Student';
    } else {
      // Data comes as direct fields
      return `${student.firstName || student.first_name || ''} ${student.lastName || student.last_name || ''}`.trim() || 'Unknown Student';
    }
  };

  // Get student details - FIXED to handle nested user object
  const getStudentDetails = (studentId) => {
    const student = students?.find(s => s.id === studentId);
    if (!student) return null;
    
    // Return a normalized student object
    return {
      ...student,
      fullName: getStudentName(studentId),
      studentNumber: student.studentNumber || student.student_number || 'N/A'
    };
  };

  // Filter fees based on search and filters
  const filteredFees = fees?.filter((fee) => {
    const studentName = getStudentName(fee.studentId || fee.student_id).toLowerCase();
    const matchesSearch = studentName.includes(searchTerm.toLowerCase()) ||
      (fee.transactionId || fee.transaction_id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (fee.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    // Apply tab filtering
    if (tabValue === 1) { // Pending tab
      if (fee.status?.toLowerCase() !== 'pending') return false;
    } else if (tabValue === 2) { // Completed tab
      if (fee.status?.toLowerCase() !== 'completed') return false;
    } else if (tabValue === 3) { // Overdue tab
      if (fee.status?.toLowerCase() !== 'pending') return false;
      const dueDate = new Date(fee.dueDate || fee.due_date);
      if (dueDate >= new Date()) return false;
    }
    
    const matchesStatus = filterStatus === 'all' || (fee.status || '').toLowerCase() === filterStatus.toLowerCase();
    const matchesType = filterType === 'all' || (fee.paymentType || fee.payment_type || '').toLowerCase() === filterType.toLowerCase();
    
    return matchesSearch && matchesStatus && matchesType;
  }) || [];

  // Calculate statistics
  const totalCollected = filteredFees
    .filter(f => f.status === 'completed')
    .reduce((sum, f) => sum + parseFloat(f.amount || 0), 0);

  const totalPending = filteredFees
    .filter(f => f.status === 'pending')
    .reduce((sum, f) => sum + parseFloat(f.amount || 0), 0);

  const totalOverdue = filteredFees
    .filter(f => f.status === 'pending' && new Date(f.dueDate || f.due_date) < new Date())
    .reduce((sum, f) => sum + parseFloat(f.amount || 0), 0);

  const paginatedFees = filteredFees.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed': return 'success';
      case 'pending': return 'warning';
      case 'failed': return 'error';
      case 'refunded': return 'info';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed': return <CheckCircleIcon />;
      case 'pending': return <PendingIcon />;
      case 'failed': return <WarningIcon />;
      default: return <PaymentIcon />;
    }
  };

  const getPaymentTypeColor = (type) => {
    switch (type?.toLowerCase()) {
      case 'tuition': return 'primary';
      case 'library': return 'secondary';
      case 'lab': return 'info';
      case 'other': return 'default';
      default: return 'default';
    }
  };

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
          Error loading fee records. Please try again later.
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Fee Management</Typography>
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
          {selectedFees.length > 0 && (
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={handleBulkDelete}
            >
              Delete Selected ({selectedFees.length})
            </Button>
          )}
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Add Fee Record
          </Button>
        </Stack>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total Collected
                  </Typography>
                  <Typography variant="h5" color="success.main" fontWeight="bold">
                    {formatCurrency(totalCollected)}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'success.main', width: 48, height: 48 }}>
                  <CheckCircleIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Pending
                  </Typography>
                  <Typography variant="h5" color="warning.main" fontWeight="bold">
                    {formatCurrency(totalPending)}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'warning.main', width: 48, height: 48 }}>
                  <PendingIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Overdue
                  </Typography>
                  <Typography variant="h5" color="error.main" fontWeight="bold">
                    {formatCurrency(totalOverdue)}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'error.main', width: 48, height: 48 }}>
                  <WarningIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total Records
                  </Typography>
                  <Typography variant="h5" color="primary.main" fontWeight="bold">
                    {filteredFees.length}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'primary.main', width: 48, height: 48 }}>
                  <ReceiptIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs for different views */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} variant="fullWidth">
          <Tab icon={<ReceiptIcon />} label="All Fees" iconPosition="start" />
          <Tab icon={<PendingIcon />} label="Pending" iconPosition="start" />
          <Tab icon={<CheckCircleIcon />} label="Completed" iconPosition="start" />
          <Tab icon={<WarningIcon />} label="Overdue" iconPosition="start" />
        </Tabs>
      </Paper>

      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <TextField
            placeholder="Search by student, transaction ID..."
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
          
          <Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Payment Type</InputLabel>
              <Select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                label="Payment Type"
              >
                <MenuItem value="all">All Types</MenuItem>
                <MenuItem value="tuition">Tuition</MenuItem>
                <MenuItem value="library">Library</MenuItem>
                <MenuItem value="lab">Lab</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </Select>
            </FormControl>
            
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                label="Status"
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="failed">Failed</MenuItem>
                <MenuItem value="refunded">Refunded</MenuItem>
              </Select>
            </FormControl>
            
            <Chip 
              label={`${filteredFees.length} records`}
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
                    checked={selectedFees.length === filteredFees.length && filteredFees.length > 0}
                    onChange={handleSelectAll}
                    style={{ cursor: 'pointer' }}
                  />
                </TableCell>
                <TableCell>Student</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Due Date</TableCell>
                <TableCell>Payment Date</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Transaction ID</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedFees.map((fee) => {
                const studentName = getStudentName(fee.studentId || fee.student_id);
                const student = getStudentDetails(fee.studentId || fee.student_id);
                const isOverdue = fee.status === 'pending' && new Date(fee.dueDate || fee.due_date) < new Date();
                
                return (
                  <TableRow 
                    hover 
                    key={fee.id}
                    selected={selectedFees.includes(fee.id)}
                    sx={{ 
                      bgcolor: isOverdue ? '#fff3e0' : 'inherit',
                      cursor: 'pointer' 
                    }}
                    onClick={() => handleViewFee(fee)}
                  >
                    <TableCell padding="checkbox" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedFees.includes(fee.id)}
                        onChange={() => handleSelectFee(fee.id)}
                        style={{ cursor: 'pointer' }}
                      />
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <Avatar sx={{ mr: 2, width: 32, height: 32, bgcolor: 'primary.main' }}>
                          {studentName !== 'Unknown Student' ? studentName.charAt(0).toUpperCase() : '?'}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight="bold">
                            {studentName}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {student?.studentNumber || 'N/A'}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography fontWeight="bold" color="primary.main">
                        {formatCurrency(fee.amount)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={fee.paymentType || fee.payment_type || 'N/A'}
                        color={getPaymentTypeColor(fee.paymentType || fee.payment_type)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2">
                          {formatDate(fee.dueDate || fee.due_date)}
                        </Typography>
                        {isOverdue && (
                          <Chip
                            label="Overdue"
                            size="small"
                            color="error"
                            sx={{ mt: 0.5, height: 20 }}
                          />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      {fee.paymentDate ? formatDate(fee.paymentDate) : '-'}
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={getStatusIcon(fee.status)}
                        label={fee.status}
                        color={getStatusColor(fee.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" fontFamily="monospace">
                        {fee.transactionId || fee.transaction_id || 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                      {fee.status === 'pending' && (
                        <Tooltip title="Mark as Paid">
                          <IconButton 
                            size="small" 
                            onClick={() => handleMarkAsPaid(fee.id)}
                            color="success"
                          >
                            <CheckCircleIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title="Edit">
                        <IconButton size="small" onClick={() => handleOpenDialog(fee)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton size="small" onClick={() => handleDelete(fee.id)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}
              {paginatedFees.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 3 }}>
                    <Typography color="textSecondary">
                      No fee records found
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
          count={filteredFees.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>

      {/* Fee Form Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedFee ? 'Edit Fee Record' : 'Add New Fee Record'}
        </DialogTitle>
        <form onSubmit={formik.handleSubmit}>
          <DialogContent dividers>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Student</InputLabel>
                  <Select
                    name="studentId"
                    value={formik.values.studentId}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.studentId && Boolean(formik.errors.studentId)}
                  >
                    {students?.map((student) => {
                      const studentName = student.user ? 
                        `${student.user.firstName || ''} ${student.user.lastName || ''}`.trim() :
                        `${student.firstName || student.first_name || ''} ${student.lastName || student.last_name || ''}`.trim();
                      const studentNumber = student.studentNumber || student.student_number || '';
                      
                      return (
                        <MenuItem key={student.id} value={student.id}>
                          {studentName} ({studentNumber})
                        </MenuItem>
                      );
                    })}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  name="amount"
                  label="Amount"
                  type="number"
                  value={formik.values.amount}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.amount && Boolean(formik.errors.amount)}
                  helperText={formik.touched.amount && formik.errors.amount}
                  margin="normal"
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Payment Type</InputLabel>
                  <Select
                    name="paymentType"
                    value={formik.values.paymentType}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                  >
                    <MenuItem value="tuition">Tuition</MenuItem>
                    <MenuItem value="library">Library</MenuItem>
                    <MenuItem value="lab">Lab</MenuItem>
                    <MenuItem value="other">Other</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  name="dueDate"
                  label="Due Date"
                  type="date"
                  value={formik.values.dueDate}
                  onChange={formik.handleChange}
                  InputLabelProps={{ shrink: true }}
                  margin="normal"
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
                    <MenuItem value="pending">Pending</MenuItem>
                    <MenuItem value="completed">Completed</MenuItem>
                    <MenuItem value="failed">Failed</MenuItem>
                    <MenuItem value="refunded">Refunded</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  name="description"
                  label="Description"
                  multiline
                  rows={2}
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
                : (selectedFee ? 'Update' : 'Create')}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* View Fee Dialog */}
      <Dialog open={openViewDialog} onClose={handleCloseViewDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          Fee Record Details
          <IconButton
            onClick={handleCloseViewDialog}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <DeleteIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {selectedFee && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Box display="flex" alignItems="center" gap={2}>
                  <Avatar sx={{ width: 56, height: 56, bgcolor: 'primary.main' }}>
                    {getStudentName(selectedFee.studentId || selectedFee.student_id).charAt(0).toUpperCase()}
                  </Avatar>
                  <Box>
                    <Typography variant="h6">
                      {getStudentName(selectedFee.studentId || selectedFee.student_id)}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Student ID: {getStudentDetails(selectedFee.studentId || selectedFee.student_id)?.studentNumber || 'N/A'}
                    </Typography>
                  </Box>
                </Box>
              </Grid>

              <Grid item xs={12}>
                <Divider />
              </Grid>

              <Grid item xs={6}>
                <Typography variant="subtitle2" color="textSecondary">
                  Amount
                </Typography>
                <Typography variant="h5" color="primary.main" fontWeight="bold">
                  {formatCurrency(selectedFee.amount)}
                </Typography>
              </Grid>

              <Grid item xs={6}>
                <Typography variant="subtitle2" color="textSecondary">
                  Status
                </Typography>
                <Chip
                  icon={getStatusIcon(selectedFee.status)}
                  label={selectedFee.status}
                  color={getStatusColor(selectedFee.status)}
                />
              </Grid>

              <Grid item xs={6}>
                <Typography variant="subtitle2" color="textSecondary">
                  Payment Type
                </Typography>
                <Chip
                  label={selectedFee.paymentType || selectedFee.payment_type}
                  color={getPaymentTypeColor(selectedFee.paymentType || selectedFee.payment_type)}
                />
              </Grid>

              <Grid item xs={6}>
                <Typography variant="subtitle2" color="textSecondary">
                  Transaction ID
                </Typography>
                <Typography variant="body2" fontFamily="monospace">
                  {selectedFee.transactionId || selectedFee.transaction_id || 'N/A'}
                </Typography>
              </Grid>

              <Grid item xs={6}>
                <Typography variant="subtitle2" color="textSecondary">
                  Due Date
                </Typography>
                <Typography variant="body2">
                  {formatDate(selectedFee.dueDate || selectedFee.due_date)}
                </Typography>
              </Grid>

              <Grid item xs={6}>
                <Typography variant="subtitle2" color="textSecondary">
                  Payment Date
                </Typography>
                <Typography variant="body2">
                  {selectedFee.paymentDate ? formatDate(selectedFee.paymentDate) : 'Not paid'}
                </Typography>
              </Grid>

              {selectedFee.description && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                    Description
                  </Typography>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography>{selectedFee.description}</Typography>
                  </Paper>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseViewDialog}>Close</Button>
          {selectedFee?.status === 'pending' && (
            <Button 
              variant="contained" 
              color="success"
              onClick={() => {
                handleCloseViewDialog();
                handleMarkAsPaid(selectedFee.id);
              }}
            >
              Mark as Paid
            </Button>
          )}
          <Button 
            variant="outlined"
            onClick={() => {
              handleCloseViewDialog();
              handleOpenDialog(selectedFee);
            }}
          >
            Edit
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminFees;