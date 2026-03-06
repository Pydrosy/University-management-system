// src/pages/student/StudentFees.js
import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  LinearProgress,
  MenuItem,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Avatar,
  Stack,
  Divider,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Payment as PaymentIcon,
  Receipt as ReceiptIcon,
  History as HistoryIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  AccountBalance as AccountBalanceIcon,
  CreditCard as CreditCardIcon,
  ReceiptLong as ReceiptLongIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { toast } from 'react-toastify';
import api from '../../services/api';
import { formatDate } from '../../utils/formatters';

const paymentSchema = yup.object({
  amount: yup.number()
    .required('Amount is required')
    .min(1, 'Amount must be greater than 0')
    .typeError('Please enter a valid amount'),
  paymentMethod: yup.string().required('Payment method is required'),
});

const StudentFees = () => {
  const { user } = useAuth();
  const [openPaymentDialog, setOpenPaymentDialog] = useState(false);
  const [selectedFee, setSelectedFee] = useState(null);
  const queryClient = useQueryClient();

  // Fetch due fees
  const { data: feesResponse, isLoading: feesLoading, error: feesError, refetch: refetchFees } = useQuery({
    queryKey: ['studentFees'],
    queryFn: async () => {
      console.log('Fetching fees for student:', user?.id);
      const res = await api.get('/students/fees');
      console.log('Fees response:', res.data);
      return res.data;
    }
  });

  // Fetch payment history
  const { data: historyResponse, isLoading: historyLoading, error: historyError, refetch: refetchHistory } = useQuery({
    queryKey: ['paymentHistory'],
    queryFn: async () => {
      console.log('Fetching payment history for student:', user?.id);
      const res = await api.get('/students/payments');
      console.log('Payment history response:', res.data);
      return res.data;
    }
  });

  const feesData = feesResponse?.data || {};
  const historyData = historyResponse?.data || [];

  const dueFees = feesData.dueFees || [];
  const totalDue = feesData.totalDue || 0;

  // Make payment mutation
  const paymentMutation = useMutation({
    mutationFn: (paymentData) => api.post('/students/pay', paymentData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['studentFees'] });
      queryClient.invalidateQueries({ queryKey: ['paymentHistory'] });
      toast.success('Payment successful');
      setOpenPaymentDialog(false);
      formik.resetForm();
    },
    onError: (error) => {
      console.error('Payment error:', error);
      toast.error(error.response?.data?.message || 'Payment failed. Please try again.');
    },
  });

  const formik = useFormik({
    initialValues: {
      amount: selectedFee?.amount || '',
      paymentMethod: '',
    },
    validationSchema: paymentSchema,
    enableReinitialize: true,
    onSubmit: (values) => {
      paymentMutation.mutate({
        feeId: selectedFee?.id,
        amount: parseFloat(values.amount),
        paymentMethod: values.paymentMethod,
      });
    },
  });

  const handlePayFee = (fee) => {
    setSelectedFee(fee);
    formik.setFieldValue('amount', fee.amount);
    setOpenPaymentDialog(true);
  };

  const handleClosePaymentDialog = () => {
    setOpenPaymentDialog(false);
    setSelectedFee(null);
    formik.resetForm();
  };

  const handleRefresh = () => {
    refetchFees();
    refetchHistory();
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed': return 'success';
      case 'pending': return 'warning';
      case 'overdue': return 'error';
      case 'failed': return 'error';
      case 'refunded': return 'info';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed': return <CheckCircleIcon />;
      case 'pending': return <WarningIcon />;
      case 'overdue': return <ErrorIcon />;
      case 'failed': return <ErrorIcon />;
      default: return <PaymentIcon />;
    }
  };

  const isLoading = feesLoading || historyLoading;
  const error = feesError || historyError;

  if (isLoading) {
    return (
      <Box sx={{ width: '100%', mt: 4 }}>
        <LinearProgress />
        <Typography variant="body2" color="textSecondary" align="center" sx={{ mt: 2 }}>
          Loading your fee information...
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
          Error loading fee information. Please try again later.
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
            Fees & Payments
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Manage your fee payments and view payment history
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={handleRefresh}
        >
          Refresh
        </Button>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%', bgcolor: totalDue > 0 ? 'error.light' : 'success.light', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="subtitle2" sx={{ color: 'rgba(255,255,255,0.8)' }} gutterBottom>
                    Total Due
                  </Typography>
                  <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
                    ${totalDue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}>
                  <WarningIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%', bgcolor: 'success.light', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="subtitle2" sx={{ color: 'rgba(255,255,255,0.8)' }} gutterBottom>
                    Total Paid
                  </Typography>
                  <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
                    ${historyData.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}>
                  <CheckCircleIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%', bgcolor: 'info.light', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="subtitle2" sx={{ color: 'rgba(255,255,255,0.8)' }} gutterBottom>
                    Payment Status
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
                      {totalDue === 0 ? 'Clear' : 'Pending'}
                    </Typography>
                    <Chip
                      label={totalDue === 0 ? 'Clear' : 'Pending'}
                      color={totalDue === 0 ? 'success' : 'warning'}
                      size="small"
                      sx={{ height: 24 }}
                    />
                  </Box>
                </Box>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}>
                  <AccountBalanceIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Due Fees Section */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <PaymentIcon sx={{ mr: 1, color: 'warning.main' }} />
          <Typography variant="h6">Due Fees</Typography>
          {dueFees.length > 0 && (
            <Chip 
              label={`${dueFees.length} pending`}
              color="warning"
              size="small"
              sx={{ ml: 2 }}
            />
          )}
        </Box>

        {dueFees.length > 0 ? (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                  <TableCell>Description</TableCell>
                  <TableCell>Due Date</TableCell>
                  <TableCell align="right">Amount</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="center">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {dueFees.map((fee) => {
                  const isOverdue = new Date(fee.dueDate) < new Date();
                  const amount = parseFloat(fee.amount || 0);
                  
                  return (
                    <TableRow key={fee.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {fee.description}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Typography variant="body2">
                            {formatDate(fee.dueDate)}
                          </Typography>
                          {isOverdue && (
                            <Chip
                              label="Overdue"
                              color="error"
                              size="small"
                              sx={{ height: 20 }}
                            />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body1" fontWeight="bold" color={isOverdue ? 'error' : 'inherit'}>
                          ${amount.toFixed(2)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={getStatusIcon(isOverdue ? 'overdue' : fee.status)}
                          label={isOverdue ? 'Overdue' : fee.status}
                          color={isOverdue ? 'error' : getStatusColor(fee.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Button
                          variant="contained"
                          size="small"
                          startIcon={<PaymentIcon />}
                          onClick={() => handlePayFee(fee)}
                          color={isOverdue ? 'error' : 'primary'}
                        >
                          Pay Now
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <CheckCircleIcon sx={{ fontSize: 48, color: 'success.main', mb: 2 }} />
            <Typography variant="h6" color="textSecondary" gutterBottom>
              No Due Fees
            </Typography>
            <Typography variant="body2" color="textSecondary">
              You have no pending fee payments. All your fees are up to date!
            </Typography>
          </Box>
        )}
      </Paper>

      {/* Payment History Section */}
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <HistoryIcon sx={{ mr: 1, color: 'info.main' }} />
          <Typography variant="h6">Payment History</Typography>
          {historyData.length > 0 && (
            <Chip 
              label={`${historyData.length} payments`}
              color="info"
              size="small"
              sx={{ ml: 2 }}
            />
          )}
        </Box>

        {historyData.length > 0 ? (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                  <TableCell>Date</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Transaction ID</TableCell>
                  <TableCell>Method</TableCell>
                  <TableCell align="right">Amount</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="center">Receipt</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {historyData.map((payment) => {
                  const amount = parseFloat(payment.amount || 0);
                  
                  return (
                    <TableRow key={payment.id} hover>
                      <TableCell>
                        <Typography variant="body2">
                          {formatDate(payment.paymentDate || payment.createdAt)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {payment.description || 'Fee Payment'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={payment.transactionId || 'N/A'}
                          size="small"
                          variant="outlined"
                          sx={{ fontFamily: 'monospace' }}
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          {payment.paymentMethod === 'credit' && <CreditCardIcon fontSize="small" color="primary" />}
                          {payment.paymentMethod === 'debit' && <CreditCardIcon fontSize="small" color="secondary" />}
                          {payment.paymentMethod === 'bank' && <AccountBalanceIcon fontSize="small" color="info" />}
                          <Typography variant="caption">
                            {payment.paymentMethod || 'N/A'}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body1" fontWeight="bold" color="success.main">
                          ${amount.toFixed(2)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={getStatusIcon(payment.status)}
                          label={payment.status}
                          color={getStatusColor(payment.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="View Receipt">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => payment.receiptUrl && window.open(payment.receiptUrl, '_blank')}
                            disabled={!payment.receiptUrl}
                          >
                            <ReceiptIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <ReceiptLongIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="textSecondary" gutterBottom>
              No Payment History
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Your payment history will appear here once you make your first payment.
            </Typography>
          </Box>
        )}
      </Paper>

      {/* Payment Dialog */}
      <Dialog 
        open={openPaymentDialog} 
        onClose={handleClosePaymentDialog} 
        maxWidth="sm" 
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PaymentIcon color="primary" />
            <Typography variant="h6">Make Payment</Typography>
          </Box>
        </DialogTitle>
        <form onSubmit={formik.handleSubmit}>
          <DialogContent dividers>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  name="amount"
                  label="Amount ($)"
                  type="number"
                  value={formik.values.amount}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.amount && Boolean(formik.errors.amount)}
                  helperText={formik.touched.amount && formik.errors.amount}
                  disabled
                  InputProps={{
                    startAdornment: <Typography sx={{ mr: 1 }}>$</Typography>,
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  select
                  name="paymentMethod"
                  label="Payment Method"
                  value={formik.values.paymentMethod}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.paymentMethod && Boolean(formik.errors.paymentMethod)}
                  helperText={formik.touched.paymentMethod && formik.errors.paymentMethod}
                >
                  <MenuItem value="credit">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CreditCardIcon fontSize="small" />
                      <span>Credit Card</span>
                    </Box>
                  </MenuItem>
                  <MenuItem value="debit">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CreditCardIcon fontSize="small" />
                      <span>Debit Card</span>
                    </Box>
                  </MenuItem>
                  <MenuItem value="bank">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <AccountBalanceIcon fontSize="small" />
                      <span>Bank Transfer</span>
                    </Box>
                  </MenuItem>
                  <MenuItem value="cash">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PaymentIcon fontSize="small" />
                      <span>Cash</span>
                    </Box>
                  </MenuItem>
                </TextField>
              </Grid>
              {selectedFee && (
                <Grid item xs={12}>
                  <Alert severity="info" sx={{ mt: 1 }}>
                    <Typography variant="body2">
                      Paying for: <strong>{selectedFee.description}</strong>
                    </Typography>
                  </Alert>
                </Grid>
              )}
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClosePaymentDialog}>Cancel</Button>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={paymentMutation.isPending}
              startIcon={<PaymentIcon />}
            >
              {paymentMutation.isPending ? 'Processing...' : 'Pay Now'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default StudentFees;