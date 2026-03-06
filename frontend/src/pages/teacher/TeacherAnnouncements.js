// src/pages/teacher/TeacherAnnouncements.js
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
  Menu,
  InputAdornment,
  Fab,
  Zoom,
  Badge,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Refresh as RefreshIcon,
  Announcement as AnnouncementIcon,
  Event as EventIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Close as CloseIcon,
  FilterList as FilterIcon,
  Search as SearchIcon,
  School as SchoolIcon,
  People as PeopleIcon,
  Schedule as ScheduleIcon,
  NotificationsActive as NotificationsActiveIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { formatDate } from '../../utils/formatters';

const TeacherAnnouncements = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterAnchorEl, setFilterAnchorEl] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Fetch announcements for teachers
  const { data: announcements, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['teacher-announcements', filterType],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filterType !== 'all') params.append('type', filterType);
      params.append('audience', 'teachers');
      
      const response = await api.get(`/announcements?${params.toString()}`);
      return response.data.data || response.data;
    }
  });

  // Create announcement mutation
  const createMutation = useMutation({
    mutationFn: async (newAnnouncement) => {
      const response = await api.post('/announcements', newAnnouncement);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-announcements'] });
      setOpenDialog(false);
      resetForm();
    },
    onError: (error) => {
      console.error('Create announcement error:', error);
      alert('Failed to create announcement. Please try again.');
    }
  });

  // Update announcement mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await api.put(`/announcements/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-announcements'] });
      setOpenDialog(false);
      resetForm();
    },
    onError: (error) => {
      console.error('Update announcement error:', error);
      alert('Failed to update announcement. Please try again.');
    }
  });

  // Delete announcement mutation
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const response = await api.delete(`/announcements/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-announcements'] });
      setOpenDeleteDialog(false);
      setDeleteTarget(null);
    },
    onError: (error) => {
      console.error('Delete announcement error:', error);
      alert('Failed to delete announcement. Please try again.');
    }
  });

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: 'news',
    targetAudience: ['teachers'],
    startDate: '',
    endDate: '',
    isActive: true
  });

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      type: 'news',
      targetAudience: ['teachers'],
      startDate: '',
      endDate: '',
      isActive: true
    });
    setSelectedAnnouncement(null);
  };

  const handleOpenDialog = (announcement = null) => {
    if (announcement) {
      setSelectedAnnouncement(announcement);
      setFormData({
        title: announcement.title,
        content: announcement.content,
        type: announcement.type,
        targetAudience: announcement.targetAudience || ['teachers'],
        startDate: announcement.startDate ? announcement.startDate.split('T')[0] : '',
        endDate: announcement.endDate ? announcement.endDate.split('T')[0] : '',
        isActive: announcement.isActive
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

  const handleViewAnnouncement = (announcement) => {
    setSelectedAnnouncement(announcement);
    setOpenViewDialog(true);
  };

  const handleCloseViewDialog = () => {
    setOpenViewDialog(false);
    setSelectedAnnouncement(null);
  };

  const handleDeleteClick = (announcement) => {
    setDeleteTarget(announcement);
    setOpenDeleteDialog(true);
  };

  const handleConfirmDelete = () => {
    if (deleteTarget) {
      deleteMutation.mutate(deleteTarget.id);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (selectedAnnouncement) {
      updateMutation.mutate({
        id: selectedAnnouncement.id,
        data: formData
      });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleFilterClick = (event) => {
    setFilterAnchorEl(event.currentTarget);
  };

  const handleFilterClose = () => {
    setFilterAnchorEl(null);
  };

  const handleTypeFilter = (type) => {
    setFilterType(type);
    handleFilterClose();
  };

  const handleRefresh = () => {
    refetch();
  };

  // Filter announcements based on search
  const filteredAnnouncements = announcements?.filter(announcement => {
    const matchesSearch = 
      announcement.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      announcement.content.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  }) || [];

  const getTypeIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'urgent': return <WarningIcon color="error" />;
      case 'event': return <EventIcon color="info" />;
      case 'news': return <InfoIcon color="primary" />;
      default: return <AnnouncementIcon />;
    }
  };

  const getTypeColor = (type) => {
    switch (type?.toLowerCase()) {
      case 'urgent': return 'error';
      case 'event': return 'info';
      case 'news': return 'primary';
      default: return 'default';
    }
  };

  const isCurrentlyActive = (announcement) => {
    const now = new Date();
    const start = new Date(announcement.startDate);
    const end = new Date(announcement.endDate);
    return announcement.isActive && now >= start && now <= end;
  };

  if (isLoading) {
    return (
      <Box sx={{ width: '100%', mt: 4 }}>
        <LinearProgress />
        <Typography variant="body2" color="textSecondary" align="center" sx={{ mt: 2 }}>
          Loading announcements...
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
          Error loading announcements. Please try again later.
        </Alert>
      </Box>
    );
  }

  const urgentCount = announcements?.filter(a => a.type === 'urgent' && isCurrentlyActive(a)).length || 0;

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Announcements
          </Typography>
          <Typography variant="body2" color="textSecondary">
            View and manage announcements for teachers
          </Typography>
        </Box>
        <Stack direction="row" spacing={2}>
          <Badge badgeContent={urgentCount} color="error">
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={handleRefresh}
              disabled={isFetching}
            >
              {isFetching ? 'Refreshing...' : 'Refresh'}
            </Button>
          </Badge>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Create Announcement
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
                    Total Announcements
                  </Typography>
                  <Typography variant="h4">
                    {announcements?.length || 0}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  <AnnouncementIcon />
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
                    Active Now
                  </Typography>
                  <Typography variant="h4" color="success.main">
                    {announcements?.filter(a => isCurrentlyActive(a)).length || 0}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'success.main' }}>
                  <NotificationsActiveIcon />
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
                    Urgent
                  </Typography>
                  <Typography variant="h4" color="error.main">
                    {urgentCount}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'error.main' }}>
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
                    Upcoming Events
                  </Typography>
                  <Typography variant="h4" color="info.main">
                    {announcements?.filter(a => a.type === 'event' && new Date(a.startDate) > new Date()).length || 0}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'info.main' }}>
                  <EventIcon />
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
              placeholder="Search announcements..."
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
          <Grid item xs={12} md={4}>
            <Button
              variant="outlined"
              startIcon={<FilterIcon />}
              onClick={handleFilterClick}
              fullWidth
            >
              Filter by Type: {filterType}
            </Button>
            <Menu
              anchorEl={filterAnchorEl}
              open={Boolean(filterAnchorEl)}
              onClose={handleFilterClose}
            >
              <MenuItem onClick={() => handleTypeFilter('all')}>All Types</MenuItem>
              <MenuItem onClick={() => handleTypeFilter('news')}>News</MenuItem>
              <MenuItem onClick={() => handleTypeFilter('event')}>Events</MenuItem>
              <MenuItem onClick={() => handleTypeFilter('urgent')}>Urgent</MenuItem>
            </Menu>
          </Grid>
          <Grid item xs={12} md={2}>
            <Chip 
              label={`${filteredAnnouncements.length} announcements`}
              color="primary"
              variant="outlined"
              sx={{ width: '100%' }}
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Announcements Grid */}
      <Grid container spacing={3}>
        {filteredAnnouncements.map((announcement) => {
          const isActive = isCurrentlyActive(announcement);
          const typeColor = getTypeColor(announcement.type);
          
          return (
            <Grid item xs={12} key={announcement.id}>
              <Zoom in={true} style={{ transitionDelay: '100ms' }}>
                <Card sx={{ 
                  position: 'relative',
                  borderLeft: '6px solid',
                  borderLeftColor: `${typeColor}.main`,
                  '&:hover': {
                    boxShadow: 6,
                  }
                }}>
                  {/* Status Badge */}
                  <Chip
                    label={isActive ? 'Active' : 'Inactive'}
                    color={isActive ? 'success' : 'default'}
                    size="small"
                    sx={{
                      position: 'absolute',
                      top: 16,
                      right: 16,
                      zIndex: 1
                    }}
                  />

                  <CardContent>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={8}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <Avatar sx={{ bgcolor: `${typeColor}.main`, mr: 2 }}>
                            {getTypeIcon(announcement.type)}
                          </Avatar>
                          <Box>
                            <Typography variant="h5" component="h2">
                              {announcement.title}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                              <Chip
                                label={announcement.type}
                                color={typeColor}
                                size="small"
                              />
                              <Chip
                                icon={<ScheduleIcon />}
                                label={`${formatDate(announcement.startDate)} - ${formatDate(announcement.endDate)}`}
                                size="small"
                                variant="outlined"
                              />
                            </Box>
                          </Box>
                        </Box>

                        <Typography variant="body1" paragraph>
                          {announcement.content}
                        </Typography>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2 }}>
                          <PeopleIcon fontSize="small" color="action" />
                          <Typography variant="body2" color="textSecondary">
                            Target: {announcement.targetAudience?.join(', ')}
                          </Typography>
                        </Box>
                      </Grid>

                      <Grid item xs={12} md={4}>
                        <Paper variant="outlined" sx={{ p: 2, bgcolor: '#f8f9fa' }}>
                          <Typography variant="subtitle2" gutterBottom>
                            Created By
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                            <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                              {announcement.creator?.firstName?.[0]}{announcement.creator?.lastName?.[0]}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" fontWeight="bold">
                                {announcement.creator?.firstName} {announcement.creator?.lastName}
                              </Typography>
                              <Typography variant="caption" color="textSecondary">
                                {announcement.creator?.role}
                              </Typography>
                            </Box>
                          </Box>
                          
                          <Divider sx={{ my: 2 }} />
                          
                          <Typography variant="subtitle2" gutterBottom>
                            Schedule
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            Starts: {formatDate(announcement.startDate)}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            Ends: {formatDate(announcement.endDate)}
                          </Typography>
                          
                          <Divider sx={{ my: 2 }} />
                          
                          <Typography variant="subtitle2" gutterBottom>
                            Created
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            {formatDate(announcement.createdAt)}
                          </Typography>
                        </Paper>
                      </Grid>
                    </Grid>
                  </CardContent>

                  <Divider />

                  <CardActions sx={{ justifyContent: 'flex-end', p: 2, gap: 1 }}>
                    <Button 
                      size="small" 
                      startIcon={<ViewIcon />}
                      onClick={() => handleViewAnnouncement(announcement)}
                    >
                      View Details
                    </Button>
                    <Button 
                      size="small" 
                      startIcon={<EditIcon />}
                      onClick={() => handleOpenDialog(announcement)}
                    >
                      Edit
                    </Button>
                    <Button 
                      size="small" 
                      color="error"
                      startIcon={<DeleteIcon />}
                      onClick={() => handleDeleteClick(announcement)}
                    >
                      Delete
                    </Button>
                  </CardActions>
                </Card>
              </Zoom>
            </Grid>
          );
        })}

        {filteredAnnouncements.length === 0 && (
          <Grid item xs={12}>
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <AnnouncementIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="textSecondary" gutterBottom>
                No announcements found
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {searchTerm ? 'Try adjusting your search' : 'Create your first announcement to get started'}
              </Typography>
              {!searchTerm && (
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => handleOpenDialog()}
                  sx={{ mt: 2 }}
                >
                  Create Announcement
                </Button>
              )}
            </Paper>
          </Grid>
        )}
      </Grid>

      {/* Create/Edit Announcement Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {selectedAnnouncement ? <EditIcon color="primary" /> : <AddIcon color="primary" />}
            <Typography variant="h6">
              {selectedAnnouncement ? 'Edit Announcement' : 'Create New Announcement'}
            </Typography>
          </Box>
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent dividers>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Title"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Content"
                  multiline
                  rows={4}
                  required
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
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
                    <MenuItem value="news">News</MenuItem>
                    <MenuItem value="event">Event</MenuItem>
                    <MenuItem value="urgent">Urgent</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Target Audience</InputLabel>
                  <Select
                    multiple
                    value={formData.targetAudience}
                    onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                    label="Target Audience"
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((value) => (
                          <Chip key={value} label={value} size="small" />
                        ))}
                      </Box>
                    )}
                  >
                    <MenuItem value="all">All</MenuItem>
                    <MenuItem value="teachers">Teachers</MenuItem>
                    <MenuItem value="students">Students</MenuItem>
                    <MenuItem value="parents">Parents</MenuItem>
                    <MenuItem value="staff">Staff</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Start Date"
                  type="date"
                  required
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="End Date"
                  type="date"
                  required
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
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
                : (selectedAnnouncement ? 'Update' : 'Create')}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* View Announcement Dialog */}
      <Dialog 
        open={openViewDialog} 
        onClose={handleCloseViewDialog} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AnnouncementIcon color="primary" />
            <Typography variant="h6">Announcement Details</Typography>
          </Box>
          <IconButton
            onClick={handleCloseViewDialog}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {selectedAnnouncement && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: `${getTypeColor(selectedAnnouncement.type)}.main`, width: 56, height: 56 }}>
                    {getTypeIcon(selectedAnnouncement.type)}
                  </Avatar>
                  <Box>
                    <Typography variant="h5">{selectedAnnouncement.title}</Typography>
                    <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                      <Chip
                        label={selectedAnnouncement.type}
                        color={getTypeColor(selectedAnnouncement.type)}
                        size="small"
                      />
                      <Chip
                        label={isCurrentlyActive(selectedAnnouncement) ? 'Active' : 'Inactive'}
                        color={isCurrentlyActive(selectedAnnouncement) ? 'success' : 'default'}
                        size="small"
                      />
                    </Box>
                  </Box>
                </Box>
              </Grid>

              <Grid item xs={12}>
                <Divider />
              </Grid>

              <Grid item xs={12}>
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                  Content
                </Typography>
                <Paper variant="outlined" sx={{ p: 3 }}>
                  <Typography variant="body1">{selectedAnnouncement.content}</Typography>
                </Paper>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                  Target Audience
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {selectedAnnouncement.targetAudience?.map((audience) => (
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

              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                  Schedule
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ScheduleIcon fontSize="small" color="action" />
                  <Typography variant="body2">
                    {formatDate(selectedAnnouncement.startDate)} - {formatDate(selectedAnnouncement.endDate)}
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                  Created By
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                    {selectedAnnouncement.creator?.firstName?.[0]}{selectedAnnouncement.creator?.lastName?.[0]}
                  </Avatar>
                  <Box>
                    <Typography variant="body2" fontWeight="bold">
                      {selectedAnnouncement.creator?.firstName} {selectedAnnouncement.creator?.lastName}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {selectedAnnouncement.creator?.role}
                    </Typography>
                  </Box>
                </Box>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                  Created At
                </Typography>
                <Typography variant="body2">
                  {formatDate(selectedAnnouncement.createdAt)}
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
            startIcon={<EditIcon />}
          >
            Edit
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
            Are you sure you want to delete the announcement{' '}
            <strong>"{deleteTarget?.title}"</strong>?
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
            This action cannot be undone.
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

export default TeacherAnnouncements;