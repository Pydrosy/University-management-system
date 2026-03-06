// src/pages/student/StudentAnnouncements.js
import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CardActions,
  Chip,
  Avatar,
  LinearProgress,
  Alert,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Stack,
  Menu,
  MenuItem,
  InputAdornment,
  TextField,
  Badge,
  Tooltip,
} from '@mui/material';
import {
  Announcement as AnnouncementIcon,
  Event as EventIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Close as CloseIcon,
  FilterList as FilterIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { formatDate } from '../../utils/formatters';

// Helper function to safely parse targetAudience
const parseTargetAudience = (targetAudience) => {
  if (!targetAudience) return ['students'];
  
  if (Array.isArray(targetAudience)) return targetAudience;
  
  if (typeof targetAudience === 'string') {
    try {
      const parsed = JSON.parse(targetAudience);
      return Array.isArray(parsed) ? parsed : [targetAudience];
    } catch (e) {
      if (targetAudience.includes(',')) {
        return targetAudience.split(',').map(item => item.trim());
      }
      return [targetAudience];
    }
  }
  
  return ['students'];
};

const StudentAnnouncements = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterAnchorEl, setFilterAnchorEl] = useState(null);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [openViewDialog, setOpenViewDialog] = useState(false);

  // Fetch announcements for students
  const { data: response, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['studentAnnouncements', filterType],
    queryFn: async () => {
      console.log('Fetching announcements for student:', user?.id);
      const params = new URLSearchParams();
      if (filterType !== 'all') params.append('type', filterType);
      params.append('audience', 'students');
      
      const res = await api.get(`/announcements?${params.toString()}`);
      console.log('Announcements response:', res.data);
      return res.data;
    }
  });

  const announcements = response?.data || [];

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

  const handleViewAnnouncement = (announcement) => {
    setSelectedAnnouncement(announcement);
    setOpenViewDialog(true);
  };

  const handleCloseViewDialog = () => {
    setOpenViewDialog(false);
    setSelectedAnnouncement(null);
  };

  // Filter announcements based on search
  const filteredAnnouncements = announcements.filter(announcement => {
    const matchesSearch = 
      announcement.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      announcement.content.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

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

  // Calculate stats
  const urgentCount = announcements.filter(a => a.type === 'urgent' && isCurrentlyActive(a)).length;

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

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Announcements
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Stay updated with the latest news and events
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
        </Stack>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total Announcements
                  </Typography>
                  <Typography variant="h4">
                    {announcements.length}
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
                    {announcements.filter(a => isCurrentlyActive(a)).length}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'success.main' }}>
                  <InfoIcon />
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
                    {announcements.filter(a => a.type === 'event' && new Date(a.startDate) > new Date()).length}
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

      {/* Announcements List */}
      <Stack spacing={2}>
        {filteredAnnouncements.length > 0 ? (
          filteredAnnouncements.map((announcement) => {
            const isActive = isCurrentlyActive(announcement);
            const typeColor = getTypeColor(announcement.type);
            
            return (
              <Card 
                key={announcement.id} 
                sx={{ 
                  borderLeft: 6,
                  borderLeftColor: `${typeColor}.main`,
                  position: 'relative',
                  '&:hover': {
                    boxShadow: 6,
                  }
                }}
              >
                {/* Status Badge for Urgent */}
                {announcement.type === 'urgent' && (
                  <Chip
                    label="URGENT"
                    color="error"
                    size="small"
                    sx={{
                      position: 'absolute',
                      top: 16,
                      right: 16,
                      zIndex: 1
                    }}
                  />
                )}

                <CardContent>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ bgcolor: `${typeColor}.main` }}>
                          {getTypeIcon(announcement.type)}
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="h5" component="h2">
                            {announcement.title}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1, mt: 0.5, flexWrap: 'wrap' }}>
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
                            <Chip
                              label={isActive ? 'Active' : 'Inactive'}
                              color={isActive ? 'success' : 'default'}
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
                      <Typography variant="body1" paragraph>
                        {announcement.content}
                      </Typography>
                    </Grid>

                    <Grid item xs={12}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}>
                        <PersonIcon fontSize="small" />
                        <Typography variant="caption">
                          Posted by: {announcement.creator?.firstName} {announcement.creator?.lastName} ({announcement.creator?.role})
                        </Typography>
                        <Typography variant="caption" sx={{ ml: 'auto' }}>
                          {formatDate(announcement.createdAt)}
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>

                <CardActions sx={{ justifyContent: 'flex-end', p: 2 }}>
                  <Tooltip title="View Details">
                    <Button
                      size="small"
                      startIcon={<ViewIcon />}
                      onClick={() => handleViewAnnouncement(announcement)}
                    >
                      Read More
                    </Button>
                  </Tooltip>
                </CardActions>
              </Card>
            );
          })
        ) : (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <AnnouncementIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="textSecondary" gutterBottom>
              No Announcements Found
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {searchTerm 
                ? 'Try adjusting your search or filter criteria' 
                : 'There are no announcements at this time.'}
            </Typography>
            {searchTerm && (
              <Button
                variant="outlined"
                sx={{ mt: 2 }}
                onClick={() => {
                  setSearchTerm('');
                  setFilterType('all');
                }}
              >
                Clear Filters
              </Button>
            )}
          </Paper>
        )}
      </Stack>

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
                    <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
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
                <Paper variant="outlined" sx={{ p: 3, bgcolor: '#f9f9f9' }}>
                  <Typography variant="body1" style={{ whiteSpace: 'pre-wrap' }}>
                    {selectedAnnouncement.content}
                  </Typography>
                </Paper>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                  Schedule
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ScheduleIcon fontSize="small" color="action" />
                  <Typography variant="body2">
                    From: {formatDate(selectedAnnouncement.startDate)}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                  <ScheduleIcon fontSize="small" color="action" />
                  <Typography variant="body2">
                    To: {formatDate(selectedAnnouncement.endDate)}
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                  Posted By
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
                  Posted On
                </Typography>
                <Typography variant="body2">
                  {formatDate(selectedAnnouncement.createdAt)}
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                  Last Updated
                </Typography>
                <Typography variant="body2">
                  {formatDate(selectedAnnouncement.updatedAt)}
                </Typography>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseViewDialog}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default StudentAnnouncements;