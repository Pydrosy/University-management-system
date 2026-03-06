// src/pages/admin/AdminGrades.js
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
  Edit as EditIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  FileDownload as DownloadIcon,
  Assessment as AssessmentIcon,
  TrendingUp as TrendingUpIcon,
  BarChart as BarChartIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { toast } from 'react-toastify';
import api from '../../services/api';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#FF4567', '#8884D8'];

const validationSchema = yup.object({
  score: yup.number()
    .required('Score is required')
    .min(0, 'Score cannot be negative')
    .max(100, 'Score cannot exceed 100')
    .typeError('Please enter a valid number'),
  feedback: yup.string(),
});

const AdminGrades = () => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCourse, setFilterCourse] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [openGradeDialog, setOpenGradeDialog] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const queryClient = useQueryClient();

  // Fetch courses for filter
  const { data: courses, isLoading: coursesLoading } = useQuery({
    queryKey: ['courses-list'],
    queryFn: async () => {
      const response = await api.get('/courses');
      return response.data.data || response.data;
    }
  });

  // Fetch grades data
  const { data: gradesData, isLoading: gradesLoading, error, refetch } = useQuery({
    queryKey: ['admin-grades', filterCourse, filterStatus, dateRange],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filterCourse !== 'all') params.append('courseId', filterCourse);
      if (filterStatus !== 'all') params.append('status', filterStatus);
      if (dateRange.from) params.append('fromDate', dateRange.from);
      if (dateRange.to) params.append('toDate', dateRange.to);
      
      const response = await api.get(`/grades/admin/all?${params.toString()}`);
      return response.data.data;
    }
  });

  // Fetch statistics
  const { data: statistics, isLoading: statsLoading } = useQuery({
    queryKey: ['grade-statistics', filterCourse],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filterCourse !== 'all') params.append('courseId', filterCourse);
      
      const response = await api.get(`/grades/admin/statistics?${params.toString()}`);
      return response.data.data;
    }
  });

  // Update grade mutation
  const updateGradeMutation = useMutation({
    mutationFn: ({ submissionId, data }) => 
      api.put(`/grades/${submissionId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-grades'] });
      queryClient.invalidateQueries({ queryKey: ['grade-statistics'] });
      toast.success('Grade updated successfully');
      setOpenGradeDialog(false);
      setSelectedSubmission(null);
      formik.resetForm();
    },
    onError: (error) => {
      console.error('Update error:', error);
      toast.error(error.response?.data?.message || 'Failed to update grade');
    },
  });

  // Export grades mutation
  const exportMutation = useMutation({
    mutationFn: () => {
      const params = new URLSearchParams();
      if (filterCourse !== 'all') params.append('courseId', filterCourse);
      return api.get(`/grades/admin/export?${params.toString()}`);
    },
    onSuccess: (response) => {
      const data = response.data.data;
      
      if (!data || data.length === 0) {
        toast.warning('No data to export');
        return;
      }
      
      // Convert to CSV
      const headers = Object.keys(data[0]).join(',');
      const rows = data.map(item => Object.values(item).map(val => 
        typeof val === 'string' && val.includes(',') ? `"${val}"` : val
      ).join(',')).join('\n');
      const csv = `${headers}\n${rows}`;
      
      // Download CSV
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `grades_export_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success(`${data.length} grades exported successfully`);
    },
    onError: (error) => {
      console.error('Export error:', error);
      toast.error(error.response?.data?.message || 'Failed to export grades');
    },
  });

  const formik = useFormik({
    initialValues: {
      score: selectedSubmission?.score || '',
      feedback: selectedSubmission?.feedback || '',
    },
    validationSchema,
    enableReinitialize: true,
    onSubmit: (values) => {
      if (!selectedSubmission) return;
      
      // Calculate grade based on score percentage
      const maxScore = selectedSubmission.assignment?.maxScore || 100;
      const percentage = (parseFloat(values.score) / maxScore) * 100;
      let grade = '';
      
      if (percentage >= 90) grade = 'A';
      else if (percentage >= 80) grade = 'B';
      else if (percentage >= 70) grade = 'C';
      else if (percentage >= 60) grade = 'D';
      else grade = 'F';
      
      updateGradeMutation.mutate({
        submissionId: selectedSubmission.id,
        data: {
          score: parseFloat(values.score),
          grade: grade,
          feedback: values.feedback
        }
      });
    },
  });

  const handleOpenGradeDialog = (submission) => {
    setSelectedSubmission(submission);
    formik.setValues({
      score: submission.score || '',
      feedback: submission.feedback || '',
    });
    setOpenGradeDialog(true);
  };

  const handleCloseGradeDialog = () => {
    setOpenGradeDialog(false);
    setSelectedSubmission(null);
    formik.resetForm();
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleExport = () => {
    exportMutation.mutate();
  };

  const handleRefresh = () => {
    refetch();
  };

  const handleClearFilters = () => {
    setFilterCourse('all');
    setFilterStatus('all');
    setDateRange({ from: '', to: '' });
    setSearchTerm('');
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Filter submissions based on search
  const filteredSubmissions = gradesData?.submissions?.filter((sub) => {
    if (!searchTerm) return true;
    
    // Fix: Use lowercase property names to match backend
    const studentName = sub.student?.user ? 
      `${sub.student.user.firstName || ''} ${sub.student.user.lastName || ''}`.toLowerCase() : '';
    const courseName = sub.assignment?.course?.courseName?.toLowerCase() || '';
    const assignmentTitle = sub.assignment?.title?.toLowerCase() || '';
    const searchLower = searchTerm.toLowerCase();
    
    return studentName.includes(searchLower) ||
           courseName.includes(searchLower) ||
           assignmentTitle.includes(searchLower);
  }) || [];

  const paginatedSubmissions = filteredSubmissions.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'graded': return 'success';
      case 'submitted': return 'info';
      case 'late': return 'warning';
      default: return 'default';
    }
  };

  const getGradeColor = (grade) => {
    switch (grade) {
      case 'A': return 'success';
      case 'B': return 'info';
      case 'C': return 'warning';
      case 'D': return 'error';
      case 'F': return 'error';
      default: return 'default';
    }
  };

  const calculatePassRate = (course) => {
    if (!course.gradedCount || course.totalSubmissions === 0) return 0;
    return ((course.gradedCount / course.totalSubmissions) * 100).toFixed(1);
  };

  const isLoading = gradesLoading || coursesLoading || statsLoading;

  if (isLoading) {
    return (
      <Box sx={{ width: '100%', mt: 4 }}>
        <LinearProgress />
        <Typography variant="body2" color="textSecondary" align="center" sx={{ mt: 2 }}>
          Loading grades data...
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
          Error loading grades. Please try again later.
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Grade Management
          </Typography>
          <Typography variant="body2" color="textSecondary">
            View and manage all student grades across courses
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
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={handleExport}
            disabled={exportMutation.isPending || filteredSubmissions.length === 0}
          >
            {exportMutation.isPending ? 'Exporting...' : 'Export CSV'}
          </Button>
        </Stack>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total Submissions
                  </Typography>
                  <Typography variant="h4">
                    {gradesData?.stats?.totalSubmissions || 0}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  <AssessmentIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Graded
                  </Typography>
                  <Typography variant="h4" color="success.main">
                    {gradesData?.stats?.gradedCount || 0}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'success.main' }}>
                  <AssessmentIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Pending
                  </Typography>
                  <Typography variant="h4" color="warning.main">
                    {gradesData?.stats?.pendingCount || 0}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'warning.main' }}>
                  <AssessmentIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Average Score
                  </Typography>
                  <Typography variant="h4" color="info.main">
                    {gradesData?.stats?.averageScore || 0}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'info.main' }}>
                  <TrendingUpIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs for different views */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} variant="fullWidth">
          <Tab icon={<AssessmentIcon />} label="Grade List" iconPosition="start" />
          <Tab icon={<BarChartIcon />} label="Analytics" iconPosition="start" />
        </Tabs>
      </Paper>

      {tabValue === 0 ? (
        // Grade List View
        <Paper sx={{ width: '100%', overflow: 'hidden' }}>
          <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            <TextField
              placeholder="Search by student, course, assignment..."
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
              sx={{ width: 350 }}
            />
            
            <Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Course</InputLabel>
                <Select
                  value={filterCourse}
                  onChange={(e) => setFilterCourse(e.target.value)}
                  label="Course"
                >
                  <MenuItem value="all">All Courses</MenuItem>
                  {courses?.map((course) => (
                    <MenuItem key={course.id} value={course.id}>
                      {course.courseCode} - {course.courseName}
                    </MenuItem>
                  ))}
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
                  <MenuItem value="graded">Graded</MenuItem>
                  <MenuItem value="submitted">Submitted</MenuItem>
                  <MenuItem value="late">Late</MenuItem>
                </Select>
              </FormControl>
              
              <TextField
                size="small"
                type="date"
                label="From"
                value={dateRange.from}
                onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                InputLabelProps={{ shrink: true }}
                sx={{ width: 140 }}
              />
              
              <TextField
                size="small"
                type="date"
                label="To"
                value={dateRange.to}
                onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                InputLabelProps={{ shrink: true }}
                sx={{ width: 140 }}
              />
              
              {(filterCourse !== 'all' || filterStatus !== 'all' || dateRange.from || dateRange.to || searchTerm) && (
                <Button
                  size="small"
                  variant="outlined"
                  onClick={handleClearFilters}
                  startIcon={<CloseIcon />}
                >
                  Clear Filters
                </Button>
              )}
              
              <Chip 
                label={`${filteredSubmissions.length} results`}
                color="primary"
                variant="outlined"
              />
            </Box>
          </Box>

          <TableContainer sx={{ maxHeight: 500 }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Student</TableCell>
                  <TableCell>Course</TableCell>
                  <TableCell>Assignment</TableCell>
                  <TableCell>Submission Date</TableCell>
                  <TableCell align="center">Score</TableCell>
                  <TableCell align="center">Grade</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedSubmissions.map((submission) => {
                  // Fix: Use lowercase property names to match backend
                  const studentFirstName = submission.student?.user?.firstName || '';
                  const studentLastName = submission.student?.user?.lastName || '';
                  const studentName = studentFirstName || studentLastName ? 
                    `${studentFirstName} ${studentLastName}`.trim() : 'Unknown Student';
                  const studentNumber = submission.student?.studentNumber || 'N/A';
                  const maxScore = submission.assignment?.maxScore || 100;
                  const courseName = submission.assignment?.course?.courseName || 'N/A';
                  const assignmentTitle = submission.assignment?.title || 'N/A';
                  const submissionDate = submission.submissionDate ? 
                    new Date(submission.submissionDate).toLocaleDateString() : 'N/A';
                  
                  return (
                    <TableRow hover key={submission.id}>
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
                              {studentNumber}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>{courseName}</TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {assignmentTitle}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          Max: {maxScore}
                        </Typography>
                      </TableCell>
                      <TableCell>{submissionDate}</TableCell>
                      <TableCell align="center">
                        {submission.score !== null && submission.score !== undefined ? (
                          <Chip
                            label={`${submission.score}/${maxScore}`}
                            size="small"
                            color={submission.score >= 90 ? 'success' :
                                   submission.score >= 80 ? 'info' :
                                   submission.score >= 70 ? 'warning' : 'error'}
                            sx={{ minWidth: 70 }}
                          />
                        ) : (
                          <Typography variant="caption" color="textSecondary">—</Typography>
                        )}
                      </TableCell>
                      <TableCell align="center">
                        {submission.grade ? (
                          <Chip
                            label={submission.grade}
                            color={getGradeColor(submission.grade)}
                            size="small"
                            sx={{ minWidth: 40 }}
                          />
                        ) : (
                          <Typography variant="caption" color="textSecondary">—</Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={submission.status || 'N/A'}
                          color={getStatusColor(submission.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="Edit Grade">
                          <IconButton 
                            size="small" 
                            onClick={() => handleOpenGradeDialog(submission)}
                            color="primary"
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {paginatedSubmissions.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                      <Typography color="textSecondary">
                        No grades found matching your criteria
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
            count={filteredSubmissions.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </Paper>
      ) : (
        // Analytics View
        <Grid container spacing={3}>
          {/* Grade Distribution Chart */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" gutterBottom>
                Grade Distribution
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Box sx={{ height: 300 }}>
                {statistics?.gradeDistribution && Object.values(statistics.gradeDistribution).some(v => v > 0) ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={Object.entries(statistics.gradeDistribution)
                          .filter(([_, value]) => value > 0)
                          .map(([name, value]) => ({
                            name,
                            value
                          }))}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(entry) => `${entry.name}: ${entry.value}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {Object.entries(statistics.gradeDistribution)
                          .filter(([_, value]) => value > 0)
                          .map(([name], index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                      </Pie>
                      <RechartsTooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                    <Typography color="textSecondary">No grade data available</Typography>
                  </Box>
                )}
              </Box>
            </Paper>
          </Grid>

          {/* Monthly Trend Chart */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" gutterBottom>
                Submission Trend (Last 6 Months)
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Box sx={{ height: 300 }}>
                {statistics?.monthlyTrend && statistics.monthlyTrend.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={statistics.monthlyTrend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <RechartsTooltip />
                      <Legend />
                      <Line type="monotone" dataKey="count" stroke="#8884d8" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                    <Typography color="textSecondary">No trend data available</Typography>
                  </Box>
                )}
              </Box>
            </Paper>
          </Grid>

          {/* Course Performance */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Course Performance
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              {gradesData?.courseStats && gradesData.courseStats.length > 0 ? (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Course</TableCell>
                        <TableCell align="right">Submissions</TableCell>
                        <TableCell align="right">Graded</TableCell>
                        <TableCell align="right">Average Score</TableCell>
                        <TableCell align="right">Pass Rate</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {gradesData.courseStats.map((course) => (
                        <TableRow key={course.courseId} hover>
                          <TableCell>
                            <Typography variant="body2" fontWeight="bold">
                              {course.courseName}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              {course.courseCode}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">{course.totalSubmissions}</TableCell>
                          <TableCell align="right">{course.gradedCount}</TableCell>
                          <TableCell align="right">{course.averageScore}</TableCell>
                          <TableCell align="right">
                            <Chip
                              label={`${calculatePassRate(course)}%`}
                              size="small"
                              color={calculatePassRate(course) >= 70 ? 'success' : 
                                     calculatePassRate(course) >= 50 ? 'warning' : 'error'}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Box textAlign="center" py={3}>
                  <Typography color="textSecondary">No course statistics available</Typography>
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* Edit Grade Dialog */}
      <Dialog open={openGradeDialog} onClose={handleCloseGradeDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <EditIcon color="primary" />
            <Typography variant="h6">Edit Grade</Typography>
          </Box>
          {selectedSubmission && (
            <Typography variant="subtitle2" color="textSecondary" sx={{ mt: 1 }}>
              {selectedSubmission.assignment?.title} - {
                selectedSubmission.student?.user ? 
                `${selectedSubmission.student.user.firstName || ''} ${selectedSubmission.student.user.lastName || ''}`.trim() : 
                'Unknown Student'
              }
            </Typography>
          )}
        </DialogTitle>
        <form onSubmit={formik.handleSubmit}>
          <DialogContent dividers>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  name="score"
                  label={`Score (Max: ${selectedSubmission?.assignment?.maxScore || 100})`}
                  type="number"
                  value={formik.values.score}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.score && Boolean(formik.errors.score)}
                  helperText={formik.touched.score && formik.errors.score}
                  margin="normal"
                  inputProps={{ 
                    min: 0, 
                    max: selectedSubmission?.assignment?.maxScore || 100,
                    step: 0.5
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  name="feedback"
                  label="Feedback"
                  multiline
                  rows={3}
                  value={formik.values.feedback}
                  onChange={formik.handleChange}
                  margin="normal"
                  placeholder="Provide feedback to the student..."
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseGradeDialog}>Cancel</Button>
            <Button 
              type="submit" 
              variant="contained" 
              color="primary"
              disabled={updateGradeMutation.isPending}
            >
              {updateGradeMutation.isPending ? 'Saving...' : 'Save Grade'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default AdminGrades;