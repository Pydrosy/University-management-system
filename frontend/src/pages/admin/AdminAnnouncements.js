// src/pages/admin/AdminAnnouncements.js
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
  Divider,
  Switch,
  FormControlLabel,
  FormHelperText,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
  FileDownload as ExportIcon,
  Announcement as AnnouncementIcon,
  Event as EventIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { toast } from 'react-toastify';
import api from '../../services/api';
import { formatDate } from '../../utils/formatters';

// Helper function to safely parse targetAudience
const parseTargetAudience = (targetAudience) => {
  if (!targetAudience) return ['all'];
  
  // If it's already an array, return it
  if (Array.isArray(targetAudience)) return targetAudience;
  
  // If it's a string, try to parse it as JSON
  if (typeof targetAudience === 'string') {
    try {
      const parsed = JSON.parse(targetAudience);
      return Array.isArray(parsed) ? parsed : [targetAudience];
    } catch (e) {
      // If it's a comma-separated string, split it
      if (targetAudience.includes(',')) {
        return targetAudience.split(',').map(item => item.trim());
      }
      // Otherwise return as single-item array
      return [targetAudience];
    }
  }
  
  return ['all'];
};

const validationSchema = yup.object({
  title: yup.string().required('Title is required'),
  content: yup.string().required('Content is required'),
  type: yup.string().required('Type is required'),
  targetAudience: yup.array().min(1, 'Select at least one audience'),
  startDate: yup.date().required('Start date is required'),
  endDate: yup.date()
    .required('End date is required')
    .min(yup.ref('startDate'), 'End date must be after start date'),
  isActive: yup.boolean(),
});

const AdminAnnouncements = () => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [openDialog, setOpenDialog] = useState(false);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [selectedAnnouncements, setSelectedAnnouncements] = useState([]);
  const queryClient = useQueryClient();

  // Fetch announcements
  const { data: announcements, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-announcements'],
    queryFn: async () => {
      const response = await api.get('/announcements');
      return response.data.data || response.data;
    }
  });

  // Create announcement mutation
  const createMutation = useMutation({
    mutationFn: (newAnnouncement) => api.post('/announcements', newAnnouncement),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-announcements'] });
      toast.success('Announcement created successfully');
      setOpenDialog(false);
      formik.resetForm();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create announcement');
    },
  });

  // Update announcement mutation
  const updateMutation = useMutation({
    mutationFn: (updatedAnnouncement) => api.put(`/announcements/${updatedAnnouncement.id}`, updatedAnnouncement),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-announcements'] });
      toast.success('Announcement updated successfully');
      setOpenDialog(false);
      formik.resetForm();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update announcement');
    },
  });

  // Delete announcement mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/announcements/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-announcements'] });
      toast.success('Announcement deleted successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete announcement');
    },
  });

  // Toggle status mutation
  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, isActive }) => api.put(`/announcements/${id}`, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-announcements'] });
      toast.success('Announcement status updated');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update status');
    },
  });

  // Bulk delete mutation
  const bulkDeleteMutation = useMutation({
    mutationFn: (ids) => api.post('/announcements/bulk-delete', { ids }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-announcements'] });
      setSelectedAnnouncements([]);
      toast.success('Selected announcements deleted successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete selected announcements');
    },
  });

  const formik = useFormik({
    initialValues: {
      title: selectedAnnouncement?.title || '',
      content: selectedAnnouncement?.content || '',
      type: selectedAnnouncement?.type || 'news',
      targetAudience: selectedAnnouncement 
        ? parseTargetAudience(selectedAnnouncement.targetAudience || selectedAnnouncement.target_audience)
        : ['all'],
      startDate: selectedAnnouncement?.startDate || selectedAnnouncement?.start_date || '',
      endDate: selectedAnnouncement?.endDate || selectedAnnouncement?.end_date || '',
      isActive: selectedAnnouncement?.isActive ?? selectedAnnouncement?.is_active ?? true,
    },
    validationSchema,
    enableReinitialize: true,
    onSubmit: (values) => {
      if (selectedAnnouncement) {
        updateMutation.mutate({ id: selectedAnnouncement.id, ...values });
      } else {
        createMutation.mutate(values);
      }
    },
  });

  const handleOpenDialog = (announcement = null) => {
    setSelectedAnnouncement(announcement);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedAnnouncement(null);
    formik.resetForm();
  };

  const handleViewAnnouncement = (announcement) => {
    setSelectedAnnouncement(announcement);
    setOpenViewDialog(true);
  };

  const handleCloseViewDialog = () => {
    setOpenViewDialog(false);
    setSelectedAnnouncement(null);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this announcement?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleToggleStatus = (id, currentStatus) => {
    toggleStatusMutation.mutate({ id, isActive: !currentStatus });
  };

  const handleBulkDelete = () => {
    if (selectedAnnouncements.length === 0) {
      toast.warning('No announcements selected');
      return;
    }
    
    if (window.confirm(`Are you sure you want to delete ${selectedAnnouncements.length} selected announcements?`)) {
      bulkDeleteMutation.mutate(selectedAnnouncements);
    }
  };

  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelectedAnnouncements(filteredAnnouncements.map(a => a.id));
    } else {
      setSelectedAnnouncements([]);
    }
  };

  const handleSelectAnnouncement = (id) => {
    setSelectedAnnouncements(prev => 
      prev.includes(id) ? prev.filter(aId => aId !== id) : [...prev, id]
    );
  };

  const handleExport = () => {
    const csvContent = [
      ['ID', 'Title', 'Type', 'Content', 'Target Audience', 'Start Date', 'End Date', 'Status', 'Created At'],
      ...filteredAnnouncements.map(a => [
        a.id,
        a.title,
        a.type,
        a.content.replace(/,/g, ';'),
        parseTargetAudience(a.targetAudience || a.target_audience).join(';'),
        formatDate(a.startDate || a.start_date),
        formatDate(a.endDate || a.end_date),
        (a.isActive ?? a.is_active) ? 'Active' : 'Inactive',
        formatDate(a.createdAt || a.created_at)
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `announcements_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Get icon based on announcement type
  const getTypeIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'urgent': return <WarningIcon color="error" />;
      case 'event': return <EventIcon color="info" />;
      case 'news': return <InfoIcon color="primary" />;
      default: return <AnnouncementIcon />;
    }
  };

  // Get color based on announcement type
  const getTypeColor = (type) => {
    switch (type?.toLowerCase()) {
      case 'urgent': return 'error';
      case 'event': return 'info';
      case 'news': return 'primary';
      default: return 'default';
    }
  };

  // Check if announcement is currently active
  const isCurrentlyActive = (announcement) => {
    const now = new Date();
    const start = new Date(announcement.startDate || announcement.start_date);
    const end = new Date(announcement.endDate || announcement.end_date);
    return (announcement.isActive ?? announcement.is_active) && now >= start && now <= end;
  };

  // Filter announcements based on search and filters
  const filteredAnnouncements = announcements?.filter((announcement) => {
    const matchesSearch = 
      (announcement.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (announcement.content || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === 'all' || (announcement.type || '').toLowerCase() === filterType.toLowerCase();
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'active' && isCurrentlyActive(announcement)) ||
      (filterStatus === 'inactive' && !isCurrentlyActive(announcement));
    
    return matchesSearch && matchesType && matchesStatus;
  }) || [];

  const paginatedAnnouncements = filteredAnnouncements.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const audienceOptions = ['all', 'students', 'teachers', 'parents', 'staff'];

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
          Error loading announcements. Please try again later.
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Announcements</Typography>
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
          {selectedAnnouncements.length > 0 && (
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={handleBulkDelete}
            >
              Delete Selected ({selectedAnnouncements.length})
            </Button>
          )}
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            New Announcement
          </Button>
        </Stack>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Announcements
              </Typography>
              <Typography variant="h4">
                {announcements?.length || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Active Now
              </Typography>
              <Typography variant="h4" color="success.main">
                {announcements?.filter(a => isCurrentlyActive(a)).length || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Urgent
              </Typography>
              <Typography variant="h4" color="error.main">
                {announcements?.filter(a => a.type === 'urgent').length || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Upcoming Events
              </Typography>
              <Typography variant="h4" color="info.main">
                {announcements?.filter(a => a.type === 'event' && new Date(a.startDate || a.start_date) > new Date()).length || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <TextField
            placeholder="Search announcements..."
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
          
          <Box display="flex" alignItems="center" gap={2}>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Type</InputLabel>
              <Select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                label="Type"
              >
                <MenuItem value="all">All Types</MenuItem>
                <MenuItem value="news">News</MenuItem>
                <MenuItem value="event">Event</MenuItem>
                <MenuItem value="urgent">Urgent</MenuItem>
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
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
              </Select>
            </FormControl>
            
            <Chip 
              label={`${filteredAnnouncements.length} announcements`}
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
                    checked={selectedAnnouncements.length === filteredAnnouncements.length && filteredAnnouncements.length > 0}
                    onChange={handleSelectAll}
                    style={{ cursor: 'pointer' }}
                  />
                </TableCell>
                <TableCell>Title</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Target Audience</TableCell>
                <TableCell>Duration</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Created</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedAnnouncements.map((announcement) => {
                const isActive = isCurrentlyActive(announcement);
                const startDate = new Date(announcement.startDate || announcement.start_date);
                const endDate = new Date(announcement.endDate || announcement.end_date);
                const targetAudience = parseTargetAudience(announcement.targetAudience || announcement.target_audience);
                
                return (
                  <TableRow 
                    hover 
                    key={announcement.id}
                    selected={selectedAnnouncements.includes(announcement.id)}
                    sx={{ 
                      bgcolor: announcement.type === 'urgent' && isActive ? '#ffebee' : 'inherit',
                      cursor: 'pointer' 
                    }}
                  >
                    <TableCell padding="checkbox">
                      <input
                        type="checkbox"
                        checked={selectedAnnouncements.includes(announcement.id)}
                        onChange={() => handleSelectAnnouncement(announcement.id)}
                        style={{ cursor: 'pointer' }}
                      />
                    </TableCell>
                    <TableCell onClick={() => handleViewAnnouncement(announcement)}>
                      <Box display="flex" alignItems="center">
                        <Avatar sx={{ mr: 2, bgcolor: `${getTypeColor(announcement.type)}.light` }}>
                          {getTypeIcon(announcement.type)}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight="bold">
                            {announcement.title}
                          </Typography>
                          <Typography variant="caption" color="textSecondary" noWrap sx={{ maxWidth: 250 }}>
                            {announcement.content?.substring(0, 60)}...
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell onClick={() => handleViewAnnouncement(announcement)}>
                      <Chip
                        icon={getTypeIcon(announcement.type)}
                        label={announcement.type}
                        color={getTypeColor(announcement.type)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell onClick={() => handleViewAnnouncement(announcement)}>
                      <Box display="flex" flexWrap="wrap" gap={0.5}>
                        {targetAudience.map((audience) => (
                          <Chip
                            key={audience}
                            label={audience}
                            size="small"
                            variant="outlined"
                            sx={{ height: 20 }}
                          />
                        ))}
                      </Box>
                    </TableCell>
                    <TableCell onClick={() => handleViewAnnouncement(announcement)}>
                      <Box>
                        <Typography variant="caption" display="block">
                          From: {formatDate(startDate)}
                        </Typography>
                        <Typography variant="caption" display="block">
                          To: {formatDate(endDate)}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell onClick={() => handleViewAnnouncement(announcement)}>
                      <Chip
                        label={isActive ? 'Active' : 'Inactive'}
                        color={isActive ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell onClick={() => handleViewAnnouncement(announcement)}>
                      {formatDate(announcement.createdAt || announcement.created_at)}
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title={isActive ? 'Deactivate' : 'Activate'}>
                        <IconButton 
                          size="small" 
                          onClick={() => handleToggleStatus(announcement.id, isActive)}
                          color={isActive ? 'warning' : 'success'}
                        >
                          {isActive ? <WarningIcon fontSize="small" /> : <InfoIcon fontSize="small" />}
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit">
                        <IconButton size="small" onClick={() => handleOpenDialog(announcement)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton size="small" onClick={() => handleDelete(announcement.id)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}
              {paginatedAnnouncements.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                    <Typography color="textSecondary">
                      No announcements found
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
          count={filteredAnnouncements.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>

      {/* Announcement Form Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedAnnouncement ? 'Edit Announcement' : 'Create New Announcement'}
        </DialogTitle>
        <form onSubmit={formik.handleSubmit}>
          <DialogContent dividers>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  name="title"
                  label="Title"
                  value={formik.values.title}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.title && Boolean(formik.errors.title)}
                  helperText={formik.touched.title && formik.errors.title}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  name="content"
                  label="Content"
                  multiline
                  rows={4}
                  value={formik.values.content}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.content && Boolean(formik.errors.content)}
                  helperText={formik.touched.content && formik.errors.content}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Type</InputLabel>
                  <Select
                    name="type"
                    value={formik.values.type}
                    onChange={formik.handleChange}
                  >
                    <MenuItem value="news">News</MenuItem>
                    <MenuItem value="event">Event</MenuItem>
                    <MenuItem value="urgent">Urgent</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Target Audience</InputLabel>
                  <Select
                    name="targetAudience"
                    value={formik.values.targetAudience}
                    onChange={formik.handleChange}
                    multiple
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((value) => (
                          <Chip key={value} label={value} size="small" />
                        ))}
                      </Box>
                    )}
                  >
                    {audienceOptions.map((audience) => (
                      <MenuItem key={audience} value={audience}>
                        {audience.charAt(0).toUpperCase() + audience.slice(1)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  name="startDate"
                  label="Start Date"
                  type="date"
                  value={formik.values.startDate}
                  onChange={formik.handleChange}
                  InputLabelProps={{ shrink: true }}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  name="endDate"
                  label="End Date"
                  type="date"
                  value={formik.values.endDate}
                  onChange={formik.handleChange}
                  InputLabelProps={{ shrink: true }}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      name="isActive"
                      checked={formik.values.isActive}
                      onChange={formik.handleChange}
                      color="primary"
                    />
                  }
                  label="Active"
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
                : (selectedAnnouncement ? 'Update' : 'Create')}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* View Announcement Dialog */}
      <Dialog open={openViewDialog} onClose={handleCloseViewDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          Announcement Details
          <IconButton
            onClick={handleCloseViewDialog}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <DeleteIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {selectedAnnouncement && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Box display="flex" alignItems="center" gap={2}>
                  <Avatar sx={{ width: 56, height: 56, bgcolor: `${getTypeColor(selectedAnnouncement.type)}.main` }}>
                    {getTypeIcon(selectedAnnouncement.type)}
                  </Avatar>
                  <Box>
                    <Typography variant="h5">{selectedAnnouncement.title}</Typography>
                    <Chip
                      label={selectedAnnouncement.type}
                      color={getTypeColor(selectedAnnouncement.type)}
                      size="small"
                      sx={{ mt: 1 }}
                    />
                  </Box>
                </Box>
              </Grid>

              <Grid item xs={12}>
                <Divider />
              </Grid>

              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                  Content
                </Typography>
                <Paper variant="outlined" sx={{ p: 3 }}>
                  <Typography>{selectedAnnouncement.content}</Typography>
                </Paper>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                  Target Audience
                </Typography>
                <Box display="flex" flexWrap="wrap" gap={1}>
                  {parseTargetAudience(selectedAnnouncement.targetAudience || selectedAnnouncement.target_audience).map((audience) => (
                    <Chip
                      key={audience}
                      label={audience}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  ))}
                </Box>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                  Status
                </Typography>
                <Chip
                  label={isCurrentlyActive(selectedAnnouncement) ? 'Active' : 'Inactive'}
                  color={isCurrentlyActive(selectedAnnouncement) ? 'success' : 'default'}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                  Start Date
                </Typography>
                <Box display="flex" alignItems="center">
                  <ScheduleIcon sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} />
                  <Typography>
                    {formatDate(selectedAnnouncement.startDate || selectedAnnouncement.start_date)}
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                  End Date
                </Typography>
                <Box display="flex" alignItems="center">
                  <ScheduleIcon sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} />
                  <Typography>
                    {formatDate(selectedAnnouncement.endDate || selectedAnnouncement.end_date)}
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                  Created At
                </Typography>
                <Typography>
                  {formatDate(selectedAnnouncement.createdAt || selectedAnnouncement.created_at)}
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                  Last Updated
                </Typography>
                <Typography>
                  {formatDate(selectedAnnouncement.updatedAt || selectedAnnouncement.updated_at)}
                </Typography>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseViewDialog}>Close</Button>
          <Button 
            variant="contained" 
            onClick={() => {
              handleCloseViewDialog();
              handleOpenDialog(selectedAnnouncement);
            }}
          >
            Edit
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminAnnouncements;