// src/pages/teacher/TeacherAssignments.js
import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Grid,
  Card,
  CardContent,
  CardActions,
  Chip,
  Avatar,
  LinearProgress,
  Alert,
  Tooltip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Stack,
  TablePagination,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Menu,
  InputAdornment,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Refresh as RefreshIcon,
  FileDownload as ExportIcon,
  Assignment as AssignmentIcon,
  School as SchoolIcon,
  People as PeopleIcon,
  Grade as GradeIcon,
  AccessTime as TimeIcon,
  ExpandMore as ExpandMoreIcon,
  Close as CloseIcon,
  CloudUpload as UploadIcon,
  Link as LinkIcon,
  FilterList as FilterIcon,
  Search as SearchIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { formatDate } from '../../utils/formatters';

const TeacherAssignments = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [openDialog, setOpenDialog] = useState(false);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [filterAnchorEl, setFilterAnchorEl] = useState(null);

  // Fetch teacher's courses
  const { data: courses } = useQuery({
    queryKey: ['teacher-courses', user?.id],
    queryFn: async () => {
      const response = await api.get('/teachers/courses');
      return response.data.data || response.data;
    }
  });

  // Fetch assignments
  const { data: assignments, isLoading, error, refetch } = useQuery({
    queryKey: ['teacher-assignments', selectedCourse],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedCourse !== 'all') params.append('courseId', selectedCourse);
      
      const response = await api.get(`/assignments/teacher?${params.toString()}`);
      return response.data.data || response.data;
    }
  });

  // Create assignment mutation
  const createMutation = useMutation({
    mutationFn: async (newAssignment) => {
      const formData = new FormData();
      Object.keys(newAssignment).forEach(key => {
        if (key === 'file' && newAssignment[key]) {
          formData.append('assignment', newAssignment[key]);
        } else {
          formData.append(key, newAssignment[key]);
        }
      });
      
      const response = await api.post('/assignments', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-assignments'] });
      setOpenDialog(false);
      resetForm();
    },
    onError: (error) => {
      console.error('Create assignment error:', error);
      alert('Failed to create assignment. Please try again.');
    }
  });

  // Update assignment mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await api.put(`/assignments/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-assignments'] });
      setOpenDialog(false);
      resetForm();
    },
    onError: (error) => {
      console.error('Update assignment error:', error);
      alert('Failed to update assignment. Please try again.');
    }
  });

  // Delete assignment mutation
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const response = await api.delete(`/assignments/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-assignments'] });
      setOpenDeleteDialog(false);
      setDeleteTarget(null);
    },
    onError: (error) => {
      console.error('Delete assignment error:', error);
      alert('Failed to delete assignment. Please try again.');
    }
  });

  const [formData, setFormData] = useState({
    courseId: '',
    title: '',
    description: '',
    type: 'assignment',
    maxScore: 100,
    dueDate: '',
    instructions: '',
    file: null
  });

  const resetForm = () => {
    setFormData({
      courseId: '',
      title: '',
      description: '',
      type: 'assignment',
      maxScore: 100,
      dueDate: '',
      instructions: '',
      file: null
    });
    setSelectedAssignment(null);
  };

  const handleOpenDialog = (assignment = null) => {
    if (assignment) {
      setSelectedAssignment(assignment);
      setFormData({
        courseId: assignment.courseId,
        title: assignment.title,
        description: assignment.description || '',
        type: assignment.type,
        maxScore: assignment.maxScore,
        dueDate: assignment.dueDate ? assignment.dueDate.split('T')[0] : '',
        instructions: assignment.instructions || '',
        file: null
      });
    } else {
      resetForm();
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    resetForm();
  };

  const handleViewAssignment = (assignment) => {
    setSelectedAssignment(assignment);
    setOpenViewDialog(true);
  };

  const handleCloseViewDialog = () => {
    setOpenViewDialog(false);
    setSelectedAssignment(null);
  };

  const handleDeleteClick = (assignment) => {
    setDeleteTarget(assignment);
    setOpenDeleteDialog(true);
  };

  const handleConfirmDelete = () => {
    if (deleteTarget) {
      deleteMutation.mutate(deleteTarget.id);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (selectedAssignment) {
      updateMutation.mutate({
        id: selectedAssignment.id,
        data: formData
      });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      console.log('Selected file:', file.name, 'Size:', file.size, 'Type:', file.type);
      setFormData({ ...formData, file: file });
    }
  };

  const handleFilterClick = (event) => {
    setFilterAnchorEl(event.currentTarget);
  };

  const handleFilterClose = () => {
    setFilterAnchorEl(null);
  };

  const handleStatusFilter = (status) => {
    setSelectedStatus(status);
    setPage(0);
    handleFilterClose();
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Fixed file download function
  const handleDownloadFile = (fileUrl, fileName) => {
    try {
      // Get the base URL from the API configuration
      const baseURL = api.defaults.baseURL || 'http://localhost:5000/api';
      const baseApiUrl = baseURL.replace('/api', '');
      
      // Ensure the fileUrl starts with a slash
      const cleanFileUrl = fileUrl.startsWith('/') ? fileUrl : `/${fileUrl}`;
      
      // Construct the full URL
      const fullUrl = `${baseApiUrl}${cleanFileUrl}`;
      
      console.log('Opening file URL:', fullUrl);
      
      // Open in new tab
      window.open(fullUrl, '_blank');
    } catch (error) {
      console.error('Error opening file:', error);
      alert('Could not open file. Please try again.');
    }
  };

  // Filter assignments
  const filteredAssignments = assignments?.filter(assignment => {
    const matchesSearch = 
      assignment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (assignment.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (assignment.course?.courseName || '').toLowerCase().includes(searchTerm.toLowerCase());

    const isActive = new Date(assignment.dueDate) > new Date();
    const status = isActive ? 'active' : 'expired';
    
    const matchesStatus = selectedStatus === 'all' || status === selectedStatus;

    return matchesSearch && matchesStatus;
  }) || [];

  const paginatedAssignments = filteredAssignments.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const getStatusColor = (dueDate) => {
    const now = new Date();
    const due = new Date(dueDate);
    const diffDays = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'error';
    if (diffDays <= 3) return 'warning';
    return 'success';
  };

  const getStatusText = (dueDate) => {
    const now = new Date();
    const due = new Date(dueDate);
    const diffDays = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'Expired';
    if (diffDays === 0) return 'Due Today';
    if (diffDays === 1) return 'Due Tomorrow';
    return `${diffDays} days left`;
  };

  if (isLoading) {
    return (
      <Box sx={{ width: '100%', mt: 4 }}>
        <LinearProgress />
        <Typography variant="body2" color="textSecondary" align="center" sx={{ mt: 2 }}>
          Loading assignments...
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
            Assignments
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Create and manage assignments for your courses
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
            onClick={() => {}}
          >
            Export
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Create Assignment
          </Button>
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
                    Total Assignments
                  </Typography>
                  <Typography variant="h4">
                    {assignments?.length || 0}
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
                    Active
                  </Typography>
                  <Typography variant="h4" color="success.main">
                    {assignments?.filter(a => new Date(a.dueDate) > new Date()).length || 0}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'success.main' }}>
                  <GradeIcon />
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
                    Expired
                  </Typography>
                  <Typography variant="h4" color="error.main">
                    {assignments?.filter(a => new Date(a.dueDate) <= new Date()).length || 0}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'error.main' }}>
                  <TimeIcon />
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
                    Total Submissions
                  </Typography>
                  <Typography variant="h4" color="info.main">
                    {assignments?.reduce((sum, a) => sum + (a.submissionCount || 0), 0) || 0}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'info.main' }}>
                  <PeopleIcon />
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
              placeholder="Search assignments..."
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
            <Button
              variant="outlined"
              startIcon={<FilterIcon />}
              onClick={handleFilterClick}
              fullWidth
            >
              Status: {selectedStatus}
            </Button>
            <Menu
              anchorEl={filterAnchorEl}
              open={Boolean(filterAnchorEl)}
              onClose={handleFilterClose}
            >
              <MenuItem onClick={() => handleStatusFilter('all')}>All</MenuItem>
              <MenuItem onClick={() => handleStatusFilter('active')}>Active</MenuItem>
              <MenuItem onClick={() => handleStatusFilter('expired')}>Expired</MenuItem>
            </Menu>
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

      {/* Assignments Grid */}
      <Grid container spacing={3}>
        {paginatedAssignments.map((assignment) => {
          const statusColor = getStatusColor(assignment.dueDate);
          const isActive = new Date(assignment.dueDate) > new Date();
          
          return (
            <Grid item xs={12} md={6} lg={4} key={assignment.id}>
              <Card sx={{ 
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                border: isActive ? 'none' : '1px solid',
                borderColor: 'error.light',
                opacity: isActive ? 1 : 0.8
              }}>
                {/* Status Badge */}
                <Chip
                  label={getStatusText(assignment.dueDate)}
                  color={statusColor}
                  size="small"
                  sx={{
                    position: 'absolute',
                    top: 12,
                    right: 12,
                    zIndex: 1
                  }}
                />

                <CardContent sx={{ flexGrow: 1 }}>
                  {/* Header */}
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                      <AssignmentIcon />
                    </Avatar>
                    <Box>
                      <Typography variant="h6" component="h2">
                        {assignment.title}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {assignment.course?.courseName} ({assignment.course?.courseCode})
                      </Typography>
                    </Box>
                  </Box>

                  {/* Description */}
                  <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                    {assignment.description || 'No description provided'}
                  </Typography>

                  {/* Details */}
                  <Stack spacing={1} sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <GradeIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body2">
                        Max Score: {assignment.maxScore}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <TimeIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body2">
                        Due: {formatDate(assignment.dueDate)}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <PeopleIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body2">
                        {assignment.submissionCount || 0} Submissions
                      </Typography>
                    </Box>
                  </Stack>

                  {/* Instructions Preview */}
                  {assignment.instructions && (
                    <Typography variant="caption" color="textSecondary">
                      <strong>Instructions:</strong> {assignment.instructions.substring(0, 100)}...
                    </Typography>
                  )}
                </CardContent>

                <Divider />

                {/* Actions */}
                <CardActions sx={{ justifyContent: 'space-between', p: 2 }}>
                  <Button 
                    size="small" 
                    startIcon={<ViewIcon />}
                    onClick={() => handleViewAssignment(assignment)}
                  >
                    View
                  </Button>
                  <Button 
                    size="small" 
                    startIcon={<EditIcon />}
                    onClick={() => handleOpenDialog(assignment)}
                  >
                    Edit
                  </Button>
                  <Button 
                    size="small" 
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={() => handleDeleteClick(assignment)}
                  >
                    Delete
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          );
        })}

        {paginatedAssignments.length === 0 && (
          <Grid item xs={12}>
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <AssignmentIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="textSecondary" gutterBottom>
                No assignments found
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {searchTerm ? 'Try adjusting your search' : 'Create your first assignment to get started'}
              </Typography>
              {!searchTerm && (
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => handleOpenDialog()}
                  sx={{ mt: 2 }}
                >
                  Create Assignment
                </Button>
              )}
            </Paper>
          </Grid>
        )}
      </Grid>

      {/* Pagination */}
      {filteredAssignments.length > rowsPerPage && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <TablePagination
            component="div"
            count={filteredAssignments.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[5, 10, 25]}
          />
        </Box>
      )}

      {/* Create/Edit Assignment Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {selectedAssignment ? <EditIcon color="primary" /> : <AddIcon color="primary" />}
            <Typography variant="h6">
              {selectedAssignment ? 'Edit Assignment' : 'Create New Assignment'}
            </Typography>
          </Box>
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent dividers>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControl fullWidth required>
                  <InputLabel>Course</InputLabel>
                  <Select
                    value={formData.courseId}
                    onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
                    label="Course"
                  >
                    {courses?.map((course) => (
                      <MenuItem key={course.id} value={course.id}>
                        {course.courseName} ({course.courseCode})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Assignment Title"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  multiline
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Type</InputLabel>
                  <Select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    label="Type"
                  >
                    <MenuItem value="assignment">Assignment</MenuItem>
                    <MenuItem value="quiz">Quiz</MenuItem>
                    <MenuItem value="exam">Exam</MenuItem>
                    <MenuItem value="project">Project</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Max Score"
                  type="number"
                  required
                  value={formData.maxScore}
                  onChange={(e) => setFormData({ ...formData, maxScore: parseInt(e.target.value) })}
                  inputProps={{ min: 1, max: 1000 }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Due Date"
                  type="datetime-local"
                  required
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Instructions"
                  multiline
                  rows={3}
                  value={formData.instructions}
                  onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                  placeholder="Provide detailed instructions for students..."
                />
              </Grid>
              <Grid item xs={12}>
                <Button
                  variant="outlined"
                  component="label"
                  startIcon={<UploadIcon />}
                  fullWidth
                  sx={{ py: 1.5 }}
                >
                  {formData.file ? formData.file.name : 'Upload Assignment File (Optional)'}
                  <input
                    type="file"
                    hidden
                    onChange={handleFileChange}
                    accept=".pdf,.doc,.docx,.txt,.zip,.rar,.7z,.jpg,.jpeg,.png"
                  />
                </Button>
                {formData.file && (
                  <Typography variant="caption" color="success.main" sx={{ mt: 1, display: 'block' }}>
                    File selected: {formData.file.name} ({(formData.file.size / 1024).toFixed(2)} KB)
                  </Typography>
                )}
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button 
              type="submit" 
              variant="contained"
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {createMutation.isPending || updateMutation.isPending 
                ? 'Saving...' 
                : (selectedAssignment ? 'Update' : 'Create')}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* View Assignment Dialog */}
      <Dialog 
        open={openViewDialog} 
        onClose={handleCloseViewDialog} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AssignmentIcon color="primary" />
            <Typography variant="h6">Assignment Details</Typography>
          </Box>
          <IconButton
            onClick={handleCloseViewDialog}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {selectedAssignment && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56 }}>
                    <AssignmentIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h5">{selectedAssignment.title}</Typography>
                    <Typography variant="subtitle1" color="textSecondary">
                      {selectedAssignment.course?.courseName} ({selectedAssignment.course?.courseCode})
                    </Typography>
                  </Box>
                </Box>
              </Grid>

              <Grid item xs={12}>
                <Divider />
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                  Type
                </Typography>
                <Chip 
                  label={selectedAssignment.type} 
                  color="primary"
                  size="small"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                  Max Score
                </Typography>
                <Typography variant="body1" fontWeight="bold">
                  {selectedAssignment.maxScore}
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                  Due Date
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <TimeIcon fontSize="small" color="action" />
                  <Typography variant="body1">
                    {formatDate(selectedAssignment.dueDate)}
                  </Typography>
                  <Chip
                    label={getStatusText(selectedAssignment.dueDate)}
                    color={getStatusColor(selectedAssignment.dueDate)}
                    size="small"
                  />
                </Box>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                  Submissions
                </Typography>
                <Typography variant="body1">
                  {selectedAssignment.submissionCount || 0} / {selectedAssignment.course?.enrolledStudents || 0} students
                </Typography>
              </Grid>

              {selectedAssignment.description && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                    Description
                  </Typography>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="body2">{selectedAssignment.description}</Typography>
                  </Paper>
                </Grid>
              )}

              {selectedAssignment.instructions && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                    Instructions
                  </Typography>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="body2">{selectedAssignment.instructions}</Typography>
                  </Paper>
                </Grid>
              )}

              {selectedAssignment.fileUrl && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                    Assignment File
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<DownloadIcon />}
                    onClick={() => handleDownloadFile(selectedAssignment.fileUrl, selectedAssignment.title)}
                    sx={{ mt: 1 }}
                  >
                    Download Assignment File
                  </Button>
                  <Typography variant="caption" display="block" sx={{ mt: 1, color: 'text.secondary' }}>
                    Click to download the assignment file
                  </Typography>
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
              handleOpenDialog(selectedAssignment);
            }}
            startIcon={<EditIcon />}
          >
            Edit
          </Button>
          <Button 
            variant="outlined"
            onClick={() => navigate(`/teacher/grades?assignmentId=${selectedAssignment?.id}`)}
            startIcon={<GradeIcon />}
          >
            View Grades
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
            Are you sure you want to delete the assignment{' '}
            <strong>"{deleteTarget?.title}"</strong>?
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
            This action cannot be undone. All student submissions for this assignment will also be deleted.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleConfirmDelete} 
            color="error" 
            variant="contained"
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TeacherAssignments;