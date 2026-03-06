// src/pages/student/StudentAssignments.js
import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  LinearProgress,
  Alert,
  Avatar,
  Divider,
  Stack,
  Tooltip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';
import {
  Assignment as AssignmentIcon,
  School as SchoolIcon,
  Grade as GradeIcon,
  AccessTime as TimeIcon,
  CloudUpload as UploadIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Description as DescriptionIcon,
  AttachFile as AttachFileIcon,
  ExpandMore as ExpandMoreIcon,
  FilterList as FilterIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { formatDate } from '../../utils/formatters';

const StudentAssignments = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [openSubmitDialog, setOpenSubmitDialog] = useState(false);
  const [submissionText, setSubmissionText] = useState('');
  const [submissionFile, setSubmissionFile] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Get courseId from URL if present
  const params = new URLSearchParams(location.search);
  const courseId = params.get('courseId');

  // Fetch assignments for the student
  const { data: response, isLoading, error, refetch } = useQuery({
    queryKey: ['studentAssignments', courseId, filterStatus],
    queryFn: async () => {
      console.log('Fetching assignments for student:', user?.id);
      // Use the correct endpoint: /api/students/assignments
      const url = courseId 
        ? `/students/assignments?courseId=${courseId}` 
        : '/students/assignments';
      const res = await api.get(url);
      console.log('Assignments response:', res.data);
      return res.data;
    }
  });

  const assignmentsData = response?.data || {};
  const allAssignments = assignmentsData.assignments || [];
  const pendingAssignments = assignmentsData.pending || [];
  const submittedAssignments = assignmentsData.submitted || [];

  // Submit assignment mutation
  const submitMutation = useMutation({
    mutationFn: async ({ assignmentId, data }) => {
      const formData = new FormData();
      formData.append('submissionText', data.submissionText || '');
      if (data.file) {
        formData.append('submission', data.file);
      }
      
      const res = await api.post(`/assignments/${assignmentId}/submit`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['studentAssignments'] });
      setOpenSubmitDialog(false);
      setSubmissionText('');
      setSubmissionFile(null);
    },
    onError: (error) => {
      console.error('Submit error:', error);
      alert('Failed to submit assignment. Please try again.');
    }
  });

  const handleViewAssignment = (assignment) => {
    setSelectedAssignment(assignment);
    setOpenViewDialog(true);
  };

  const handleCloseViewDialog = () => {
    setOpenViewDialog(false);
    setSelectedAssignment(null);
  };

  const handleOpenSubmitDialog = (assignment) => {
    setSelectedAssignment(assignment);
    setOpenSubmitDialog(true);
  };

  const handleCloseSubmitDialog = () => {
    setOpenSubmitDialog(false);
    setSelectedAssignment(null);
    setSubmissionText('');
    setSubmissionFile(null);
  };

  const handleFileChange = (e) => {
    setSubmissionFile(e.target.files[0]);
  };

  const handleSubmit = () => {
    if (!submissionText && !submissionFile) {
      alert('Please provide either submission text or upload a file.');
      return;
    }

    submitMutation.mutate({
      assignmentId: selectedAssignment.id,
      data: {
        submissionText,
        file: submissionFile
      }
    });
  };

  const handleRefresh = () => {
    refetch();
  };

  // Filter assignments based on search
  const filteredAssignments = allAssignments.filter(assignment => {
    const matchesSearch = 
      assignment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assignment.courseName.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterStatus === 'all') return matchesSearch;
    if (filterStatus === 'pending') return matchesSearch && assignment.status === 'pending';
    if (filterStatus === 'submitted') return matchesSearch && assignment.status === 'submitted';
    if (filterStatus === 'graded') return matchesSearch && assignment.status === 'graded';
    return matchesSearch;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'submitted': return 'info';
      case 'graded': return 'success';
      case 'late': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <WarningIcon />;
      case 'submitted': return <InfoIcon />;
      case 'graded': return <CheckCircleIcon />;
      case 'late': return <WarningIcon color="error" />;
      default: return <AssignmentIcon />;
    }
  };

  const isOverdue = (dueDate) => {
    return new Date(dueDate) < new Date();
  };

  if (isLoading) {
    return (
      <Box sx={{ width: '100%', mt: 4 }}>
        <LinearProgress />
        <Typography variant="body2" color="textSecondary" align="center" sx={{ mt: 2 }}>
          Loading your assignments...
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
          Error loading assignments. Please try again later.
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
            My Assignments
          </Typography>
          <Typography variant="body2" color="textSecondary">
            View and submit your course assignments
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

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total Assignments
                  </Typography>
                  <Typography variant="h4">
                    {allAssignments.length}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  <AssignmentIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Pending
                  </Typography>
                  <Typography variant="h4" color="warning.main">
                    {pendingAssignments.length}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'warning.main' }}>
                  <WarningIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Graded
                  </Typography>
                  <Typography variant="h4" color="success.main">
                    {submittedAssignments.filter(a => a.status === 'graded').length}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'success.main' }}>
                  <CheckCircleIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Search assignments..."
              size="small"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
              }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Filter by Status</InputLabel>
              <Select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                label="Filter by Status"
              >
                <MenuItem value="all">All Assignments</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="submitted">Submitted</MenuItem>
                <MenuItem value="graded">Graded</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <Chip 
              label={`${filteredAssignments.length} assignments`}
              color="primary"
              variant="outlined"
              sx={{ width: '100%' }}
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Pending Assignments Section */}
      {pendingAssignments.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <WarningIcon color="warning" />
            Pending Assignments ({pendingAssignments.length})
          </Typography>
          <Grid container spacing={2}>
            {pendingAssignments.map((assignment) => (
              <Grid item xs={12} key={assignment.id}>
                <Card variant="outlined" sx={{ 
                  borderLeft: 6, 
                  borderLeftColor: isOverdue(assignment.dueDate) ? 'error.main' : 'warning.main'
                }}>
                  <CardContent>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={8}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <AssignmentIcon color="primary" />
                          <Typography variant="h6">{assignment.title}</Typography>
                        </Box>
                        
                        <Typography variant="body2" color="textSecondary" paragraph>
                          {assignment.description || 'No description provided'}
                        </Typography>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                          <Chip
                            icon={<SchoolIcon />}
                            label={assignment.courseName}
                            size="small"
                            variant="outlined"
                          />
                          <Chip
                            icon={<TimeIcon />}
                            label={`Due: ${formatDate(assignment.dueDate)}`}
                            size="small"
                            color={isOverdue(assignment.dueDate) ? 'error' : 'default'}
                          />
                          <Chip
                            label={`Max Score: ${assignment.maxScore}`}
                            size="small"
                            variant="outlined"
                          />
                        </Box>
                      </Grid>
                      
                      <Grid item xs={12} md={4} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                        <Button
                          variant="contained"
                          color="primary"
                          startIcon={<UploadIcon />}
                          onClick={() => handleOpenSubmitDialog(assignment)}
                        >
                          Submit Assignment
                        </Button>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Submitted Assignments Section */}
      {submittedAssignments.length > 0 && (
        <Box>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CheckCircleIcon color="success" />
            Submitted Assignments ({submittedAssignments.length})
          </Typography>
          <Grid container spacing={2}>
            {submittedAssignments.map((assignment) => (
              <Grid item xs={12} md={6} key={assignment.id}>
                <Card variant="outlined">
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {getStatusIcon(assignment.status)}
                        <Typography variant="h6">{assignment.title}</Typography>
                      </Box>
                      <Chip
                        label={assignment.status}
                        color={getStatusColor(assignment.status)}
                        size="small"
                      />
                    </Box>

                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      {assignment.courseName}
                    </Typography>

                    <Divider sx={{ my: 1.5 }} />

                    <Grid container spacing={1}>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="textSecondary">
                          Submitted
                        </Typography>
                        <Typography variant="body2">
                          {formatDate(assignment.submission?.submissionDate)}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="textSecondary">
                          Score
                        </Typography>
                        <Typography variant="body2">
                          {assignment.submission?.score ? `${assignment.submission.score}/${assignment.maxScore}` : 'Not graded'}
                        </Typography>
                      </Grid>
                    </Grid>

                    {assignment.submission?.feedback && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="caption" color="textSecondary">
                          Feedback
                        </Typography>
                        <Paper variant="outlined" sx={{ p: 1, mt: 0.5, bgcolor: '#f5f5f5' }}>
                          <Typography variant="body2">{assignment.submission.feedback}</Typography>
                        </Paper>
                      </Box>
                    )}

                    <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                      <Button
                        size="small"
                        startIcon={<InfoIcon />}
                        onClick={() => handleViewAssignment(assignment)}
                      >
                        View Details
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Empty State */}
      {allAssignments.length === 0 && (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <AssignmentIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="textSecondary" gutterBottom>
            No Assignments Found
          </Typography>
          <Typography variant="body2" color="textSecondary">
            There are no assignments available at the moment.
          </Typography>
        </Paper>
      )}

      {/* View Assignment Dialog */}
      <Dialog open={openViewDialog} onClose={handleCloseViewDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          Assignment Details
        </DialogTitle>
        <DialogContent dividers>
          {selectedAssignment && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h5">{selectedAssignment.title}</Typography>
                <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                  <Chip label={selectedAssignment.courseName} size="small" />
                  <Chip 
                    label={`Due: ${formatDate(selectedAssignment.dueDate)}`}
                    color={isOverdue(selectedAssignment.dueDate) ? 'error' : 'default'}
                    size="small"
                  />
                  <Chip label={`Max Score: ${selectedAssignment.maxScore}`} size="small" variant="outlined" />
                </Box>
              </Grid>

              <Grid item xs={12}>
                <Divider />
              </Grid>

              {selectedAssignment.description && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>Description</Typography>
                  <Typography variant="body2" paragraph>{selectedAssignment.description}</Typography>
                </Grid>
              )}

              {selectedAssignment.instructions && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>Instructions</Typography>
                  <Paper variant="outlined" sx={{ p: 2, bgcolor: '#f5f5f5' }}>
                    <Typography variant="body2">{selectedAssignment.instructions}</Typography>
                  </Paper>
                </Grid>
              )}

              {selectedAssignment.submission && (
                <>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" gutterBottom>Your Submission</Typography>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <Typography variant="body2">{selectedAssignment.submission.submissionText}</Typography>
                      {selectedAssignment.submission.fileUrl && (
                        <Button
                          size="small"
                          startIcon={<AttachFileIcon />}
                          sx={{ mt: 1 }}
                          href={selectedAssignment.submission.fileUrl}
                          target="_blank"
                        >
                          View Attached File
                        </Button>
                      )}
                    </Paper>
                  </Grid>

                  <Grid item xs={12}>
                    <Typography variant="subtitle2" gutterBottom>Feedback</Typography>
                    <Paper variant="outlined" sx={{ p: 2, bgcolor: '#f5f5f5' }}>
                      <Typography variant="body2">
                        {selectedAssignment.submission.feedback || 'No feedback yet'}
                      </Typography>
                    </Paper>
                  </Grid>

                  <Grid item xs={6}>
                    <Typography variant="subtitle2" gutterBottom>Score</Typography>
                    <Typography variant="h4" color="primary">
                      {selectedAssignment.submission.score || '—'}/{selectedAssignment.maxScore}
                    </Typography>
                  </Grid>

                  <Grid item xs={6}>
                    <Typography variant="subtitle2" gutterBottom>Submitted</Typography>
                    <Typography variant="body1">
                      {formatDate(selectedAssignment.submission.submissionDate)}
                    </Typography>
                  </Grid>
                </>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseViewDialog}>Close</Button>
          {selectedAssignment?.status === 'pending' && (
            <Button 
              variant="contained" 
              onClick={() => {
                handleCloseViewDialog();
                handleOpenSubmitDialog(selectedAssignment);
              }}
            >
              Submit Assignment
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Submit Assignment Dialog */}
      <Dialog open={openSubmitDialog} onClose={handleCloseSubmitDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          Submit Assignment: {selectedAssignment?.title}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Your Answer / Submission Text"
                value={submissionText}
                onChange={(e) => setSubmissionText(e.target.value)}
                placeholder="Type your answer here..."
              />
            </Grid>
            <Grid item xs={12}>
              <Button
                variant="outlined"
                component="label"
                startIcon={<UploadIcon />}
                fullWidth
              >
                {submissionFile ? submissionFile.name : 'Upload File (Optional)'}
                <input
                  type="file"
                  hidden
                  onChange={handleFileChange}
                />
              </Button>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="caption" color="textSecondary">
                You can either type your answer in the text field or upload a file, or both.
              </Typography>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseSubmitDialog}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={handleSubmit}
            disabled={submitMutation.isPending}
          >
            {submitMutation.isPending ? 'Submitting...' : 'Submit'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default StudentAssignments;