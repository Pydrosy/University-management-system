// src/pages/Payments.js
import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Alert,
  LinearProgress,
  IconButton,
  Grid,
  Card,
  CardContent,
  TextField,
  InputAdornment,
} from '@mui/material';
import {
  Receipt as ReceiptIcon,
  GetApp as DownloadIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';

const Payments = () => {
  const [searchTerm, setSearchTerm] = useState('');
  
  const { data: payments, isLoading } = useQuery({
    queryKey: ['payments'],
    queryFn: () => api.get('/payments').then(res => res.data)
  });

  const { data: students } = useQuery({
    queryKey: ['students-payment'],
    queryFn: () => api.get('/students').then(res => res.data)
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'success';
      case 'pending': return 'warning';
      case 'failed': return 'error';
      case 'refunded': return 'info';
      default: return 'default';
    }
  };

  const getPaymentTypeColor = (type) => {
    switch (type) {
      case 'tuition': return 'primary';
      case 'library': return 'secondary';
      case 'lab': return 'info';
      default: return 'default';
    }
  };

  const filteredPayments = payments?.filter(payment => {
    const student = students?.find(s => s.id === payment.student_id);
    const studentName = student ? `${student.first_name} ${student.last_name}`.toLowerCase() : '';
    return studentName.includes(searchTerm.toLowerCase()) ||
           payment.transaction_id?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const totalRevenue = filteredPayments?.reduce((sum, p) => 
    p.status === 'completed' ? sum + p.amount : sum, 0
  ) || 0;

  const pendingAmount = filteredPayments?.reduce((sum, p) => 
    p.status === 'pending' ? sum + p.amount : sum, 0
  ) || 0;

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
        Payment Management
      </Typography>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Revenue
              </Typography>
              <Typography variant="h4" color="primary">
                ${totalRevenue.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Pending Amount
              </Typography>
              <Typography variant="h4" color="warning.main">
                ${pendingAmount.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Transactions
              </Typography>
              <Typography variant="h4">
                {payments?.length || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">Payment History</Typography>
          <TextField
            placeholder="Search by student or transaction ID..."
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
        </Box>
      </Paper>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Student</TableCell>
              <TableCell>Transaction ID</TableCell>
              <TableCell>Payment Type</TableCell>
              <TableCell>Amount</TableCell>
              <TableCell>Due Date</TableCell>
              <TableCell>Payment Date</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredPayments?.map((payment) => {
              const student = students?.find(s => s.id === payment.student_id);
              
              return (
                <TableRow key={payment.id}>
                  <TableCell>
                    {student ? `${student.first_name} ${student.last_name}` : 'Unknown'}
                  </TableCell>
                  <TableCell>
                    <Chip
                      icon={<ReceiptIcon />}
                      label={payment.transaction_id || 'N/A'}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={payment.payment_type}
                      color={getPaymentTypeColor(payment.payment_type)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography fontWeight="bold">
                      ${payment.amount?.toLocaleString()}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {new Date(payment.due_date).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {payment.payment_date ? new Date(payment.payment_date).toLocaleDateString() : '-'}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={payment.status}
                      color={getStatusColor(payment.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <IconButton size="small" color="primary">
                      <ReceiptIcon />
                    </IconButton>
                    <IconButton size="small">
                      <DownloadIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default Payments;