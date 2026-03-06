// src/pages/teacher/TeacherGrades.js
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
  Alert,
  LinearProgress,
  Tooltip,
  Card,
  CardContent,
  Stack,
  Divider,
  Tabs,
  Tab,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Badge,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
  FileDownload as ExportIcon,
  Grade as GradeIcon,
  Assignment as AssignmentIcon,
  Person as PersonIcon,
  School as SchoolIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Close as CloseIcon,
  ExpandMore as ExpandMoreIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { formatDate } from '../../utils/formatters';

const TeacherGrades = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('all');
  const [selectedAssignment, setSelectedAssignment] = useState('all');
  const [selectedTab, setSelectedTab] = useState(0);
  const [openGradeDialog, setOpenGradeDialog] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [gradeForm, setGradeForm] = useState({ score: '', feedback: '' });

  // Parse URL params
  const params = new URLSearchParams(location.search);
  const courseIdFromUrl = params.get('courseId');
  const assignmentIdFromUrl = params.get('assignmentId');
  const studentIdFromUrl = params.get('studentId');

  // Fetch teacher's courses
  const { data: courses } = useQuery({
    queryKey: ['teacher-courses', user?.id],
    queryFn: async () => {
      const response = await api.get('/teachers/courses');
      return response.data.data || response.data;
    }
  });

  // Fetch pending submissions
  const { data: pendingSubmissions, isLoading: pendingLoading } = useQuery({
    queryKey: ['teacher-pending-submissions'],
    queryFn: async () => {
      const response = await api.get('/teachers/submissions/pending');
      return response.data.data || response.data;
    }
  });

  // Fetch all grades (you'll need to create this endpoint)
  const { data: grades, isLoading, error, refetch } = useQuery({
    queryKey: ['teacher-grades', selectedCourse, selectedAssignment],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedCourse !== 'all') params.append('courseId', selectedCourse);
      if (selectedAssignment !== 'all') params.append('assignmentId', selectedAssignment);
      
      const response = await api.get(`/grades/teacher?${params.toString()}`);
      return response.data.data || response.data;
    }
  });

  // Grade submission mutation
  const gradeMutation = useMutation({
    mutationFn: async ({ submissionId, data }) => {
      const response = await api.post(`/grades/submission/${submissionId}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-grades'] });
      queryClient.invalidateQueries({ queryKey: ['teacher-pending-submissions'] });
      setOpenGradeDialog(false);
      setGradeForm({ score: '', feedback: '' });
    },
  });

  // Bulk grade mutation
  const bulkGradeMutation = useMutation({
    mutationFn: async (grades) => {
      const response = await api.post('/grades/bulk', { grades });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-grades'] });
      queryClient.invalidateQueries({ queryKey: ['teacher-pending-submissions'] });
    },
  });

  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
  };

  const handleOpenGradeDialog = (submission) => {
    setSelectedSubmission(submission);
    setGradeForm({
      score: submission.score || '',
      feedback: submission.feedback || ''
    });
    setOpenGradeDialog(true);
  };

  const handleCloseGradeDialog = () => {
    setOpenGradeDialog(false);
    setSelectedSubmission(null);
    setGradeForm({ score: '', feedback: '' });
  };

  const handleGradeSubmit = () => {
    if (!gradeForm.score) {
      alert('Please enter a score');
      return;
    }

    const maxScore = selectedSubmission?.assignment?.maxScore || 100;
    if (gradeForm.score < 0 || gradeForm.score > maxScore) {
      alert(`Score must be between 0 and ${maxScore}`);
      return;
    }

    gradeMutation.mutate({
      submissionId: selectedSubmission.id,
      data: {
        score: parseFloat(gradeForm.score),
        feedback: gradeForm.feedback
      }
    });
  };

  const handleExport = () => {
    try {
      const csvContent = [
        ['Student', 'Student ID', 'Assignment', 'Course', 'Score', 'Feedback', 'Status', 'Submission Date'],
        ...(grades?.submissions || []).map(s => [
          `${s.student?.user?.firstName || ''} ${s.student?.user?.lastName || ''}`,
          s.student?.studentNumber || '',
          s.assignment?.title || '',
          s.assignment?.course?.courseName || '',
          s.score || 'Not graded',
          s.feedback || '',
          s.status || '',
          formatDate(s.submissionDate)
        ])
      ].map(row => row.join(',')).join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `grades_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const handleGradeAll = () => {
    if (!pendingSubmissions?.length) return;
    
    if (window.confirm(`Grade all ${pendingSubmissions.length} pending submissions?`)) {
      // Implement bulk grading logic
    }
  };

  // Filter submissions
  const filteredSubmissions = (selectedTab === 0 ? grades?.submissions : pendingSubmissions)?.filter(s => {
    const studentName = `${s.student?.user?.firstName || ''} ${s.student?.user?.lastName || ''}`.toLowerCase();
    const assignmentTitle = (s.assignment?.title || '').toLowerCase();
    const searchLower = searchTerm.toLowerCase();

    return studentName.includes(searchLower) || assignmentTitle.includes(searchLower);
  }) || [];

  const paginatedSubmissions = filteredSubmissions.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getScoreColor = (score, maxScore) => {
    if (!score) return 'default';
    const percentage = (score / maxScore) * 100;
    if (percentage >= 90) return 'success';
    if (percentage >= 70) return 'info';
    if (percentage >= 50) return 'warning';
    return 'error';
  };

  if (isLoading || pendingLoading) {
    return (
      <Box sx={{ width: '100%', mt: 4 }}>
        <LinearProgress />
        <Typography variant="body2" color="textSecondary" align="center" sx={{ mt: 2 }}>
          Loading grades...
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
            <Button color="inherit" size="small" onClick={() => refetch()}>
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Grade Management
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Grade student submissions and track performance
          </Typography>
        </Box>
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
          {selectedTab === 0 && (
            <Button
              variant="contained"
              color="warning"
              startIcon={<GradeIcon />}
              onClick={handleGradeAll}
              disabled={!pendingSubmissions?.length}
            >
              Grade All Pending ({pendingSubmissions?.length || 0})
            </Button>
          )}
        </Stack>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total Submissions
                  </Typography>
                  <Typography variant="h4">
                    {grades?.submissions?.length || 0}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  <AssignmentIcon />
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
                    Graded
                  </Typography>
                  <Typography variant="h4" color="success.main">
                    {grades?.submissions?.filter(s => s.status === 'graded').length || 0}
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
                    Pending
                  </Typography>
                  <Typography variant="h4" color="warning.main">
                    {pendingSubmissions?.length || 0}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'warning.main' }}>
                  <WarningIcon />
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
                    Average Score
                  </Typography>
                  <Typography variant="h4" color="info.main">
                    {grades?.averageScore || '0'}%
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

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="Search by student or assignment..."
              size="small"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment>,
                endAdornment: searchTerm && (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setSearchTerm('')}>
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Course</InputLabel>
              <Select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                label="Course"
              >
                <MenuItem value="all">All Courses</MenuItem>
                {courses?.map((course) => (
                  <MenuItem key={course.id} value={course.id}>
                    {course.courseName} ({course.courseCode})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Assignment</InputLabel>
              <Select
                value={selectedAssignment}
                onChange={(e) => setSelectedAssignment(e.target.value)}
                label="Assignment"
              >
                <MenuItem value="all">All Assignments</MenuItem>
                {courses?.flatMap(c => c.assignments || []).map((assignment) => (
                  <MenuItem key={assignment.id} value={assignment.id}>
                    {assignment.title}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <Chip 
              label={`${filteredSubmissions.length} results`}
              color="primary"
              variant="outlined"
              sx={{ width: '100%' }}
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={selectedTab} onChange={handleTabChange}>
          <Tab 
            icon={<AssignmentIcon />} 
            label="All Submissions" 
            iconPosition="start"
          />
          <Tab 
            icon={
              <Badge badgeContent={pendingSubmissions?.length} color="error">
                <WarningIcon />
              </Badge>
            } 
            label="Pending Grading" 
            iconPosition="start"
          />
        </Tabs>
      </Paper>

      {/* Submissions Table */}
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer sx={{ maxHeight: 500 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Student</TableCell>
                <TableCell>Assignment</TableCell>
                <TableCell>Course</TableCell>
                <TableCell>Submission Date</TableCell>
                <TableCell>Score</TableCell>
                <TableCell>Feedback</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedSubmissions.map((submission) => {
                const maxScore = submission.assignment?.maxScore || 100;
                const isGraded = submission.status === 'graded';
                
                return (
                  <TableRow key={submission.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
                          {submission.student?.user?.firstName?.[0]}
                          {submission.student?.user?.lastName?.[0]}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight="bold">
                            {submission.student?.user?.firstName} {submission.student?.user?.lastName}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {submission.student?.studentNumber}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {submission.assignment?.title}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        Max Score: {maxScore}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={submission.assignment?.course?.courseCode}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      {formatDate(submission.submissionDate)}
                      {submission.status === 'late' && (
                        <Chip
                          label="Late"
                          color="error"
                          size="small"
                          sx={{ ml: 1 }}
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      {isGraded ? (
                        <Chip
                          label={`${submission.score}/${maxScore}`}
                          color={getScoreColor(submission.score, maxScore)}
                          size="small"
                        />
                      ) : (
                        <Chip
                          label="Not graded"
                          variant="outlined"
                          size="small"
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography 
                        variant="body2" 
                        color="textSecondary"
                        sx={{ 
                          maxWidth: 200,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {submission.feedback || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={submission.status}
                        size="small"
                        color={submission.status === 'graded' ? 'success' : 'warning'}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Grade">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleOpenGradeDialog(submission)}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="View Submission">
                        <IconButton size="small">
                          <AssignmentIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}
              {paginatedSubmissions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 5 }}>
                    <Typography color="textSecondary">
                      No submissions found
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredSubmissions.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>

      {/* Grade Dialog */}
      <Dialog 
        open={openGradeDialog} 
        onClose={handleCloseGradeDialog} 
        maxWidth="sm" 
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <GradeIcon color="primary" />
            <Typography variant="h6">Grade Submission</Typography>
          </Box>
          <IconButton
            onClick={handleCloseGradeDialog}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {selectedSubmission && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Avatar sx={{ bgcolor: 'secondary.main' }}>
                    {selectedSubmission.student?.user?.firstName?.[0]}
                    {selectedSubmission.student?.user?.lastName?.[0]}
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle1" fontWeight="bold">
                      {selectedSubmission.student?.user?.firstName} {selectedSubmission.student?.user?.lastName}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {selectedSubmission.student?.studentNumber}
                    </Typography>
                  </Box>
                </Box>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle2" gutterBottom>
                  Assignment: {selectedSubmission.assignment?.title}
                </Typography>
                <Typography variant="body2" color="textSecondary" paragraph>
                  {selectedSubmission.assignment?.description}
                </Typography>
                <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Student Submission:
                  </Typography>
                  <Typography variant="body2">
                    {selectedSubmission.submissionText || 'No text submission'}
                  </Typography>
                  {selectedSubmission.fileUrl && (
                    <Button
                      size="small"
                      variant="outlined"
                      sx={{ mt: 1 }}
                      href={selectedSubmission.fileUrl}
                      target="_blank"
                    >
                      View Attached File
                    </Button>
                  )}
                </Paper>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label={`Score (Max: ${selectedSubmission.assignment?.maxScore || 100})`}
                  type="number"
                  value={gradeForm.score}
                  onChange={(e) => setGradeForm({ ...gradeForm, score: e.target.value })}
                  InputProps={{
                    inputProps: { 
                      min: 0, 
                      max: selectedSubmission.assignment?.maxScore || 100,
                      step: 0.5
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Feedback"
                  multiline
                  rows={3}
                  value={gradeForm.feedback}
                  onChange={(e) => setGradeForm({ ...gradeForm, feedback: e.target.value })}
                  placeholder="Provide feedback to the student..."
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseGradeDialog}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleGradeSubmit}
            disabled={gradeMutation.isPending}
            startIcon={<SaveIcon />}
          >
            {gradeMutation.isPending ? 'Saving...' : 'Save Grade'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TeacherGrades;