// src/components/common/Header.js
import React, { useState, useEffect, useRef } from 'react';
import { styled } from '@mui/material/styles';
import MuiAppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Badge from '@mui/material/Badge';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Avatar from '@mui/material/Avatar';
import Tooltip from '@mui/material/Tooltip';
import Box from '@mui/material/Box';
import InputBase from '@mui/material/InputBase';
import { alpha } from '@mui/material/styles';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import Divider from '@mui/material/Divider';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Paper from '@mui/material/Paper';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Collapse from '@mui/material/Collapse';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';

import MenuIcon from '@mui/icons-material/Menu';
import NotificationsIcon from '@mui/icons-material/Notifications';
import SearchIcon from '@mui/icons-material/Search';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonIcon from '@mui/icons-material/Person';
import AssignmentIcon from '@mui/icons-material/Assignment';
import GradeIcon from '@mui/icons-material/Grade';
import EventIcon from '@mui/icons-material/Event';
import SchoolIcon from '@mui/icons-material/School';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import InfoIcon from '@mui/icons-material/Info';

import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { formatDistanceToNow } from 'date-fns';
import io from 'socket.io-client';

const drawerWidth = 240;

const AppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== 'open',
})(({ theme, open }) => ({
  zIndex: theme.zIndex.drawer + 1,
  transition: theme.transitions.create(['width', 'margin'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  ...(open && {
    marginLeft: drawerWidth,
    width: `calc(100% - ${drawerWidth}px)`,
    transition: theme.transitions.create(['width', 'margin'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
}));

const Search = styled('div')(({ theme }) => ({
  position: 'relative',
  borderRadius: theme.shape.borderRadius,
  backgroundColor: alpha(theme.palette.common.white, 0.15),
  '&:hover': {
    backgroundColor: alpha(theme.palette.common.white, 0.25),
  },
  marginRight: theme.spacing(2),
  marginLeft: 0,
  width: '100%',
  [theme.breakpoints.up('sm')]: {
    marginLeft: theme.spacing(3),
    width: 'auto',
  },
}));

const SearchIconWrapper = styled('div')(({ theme }) => ({
  padding: theme.spacing(0, 2),
  height: '100%',
  position: 'absolute',
  pointerEvents: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  color: 'inherit',
  '& .MuiInputBase-input': {
    padding: theme.spacing(1, 1, 1, 0),
    paddingLeft: `calc(1em + ${theme.spacing(4)})`,
    transition: theme.transitions.create('width'),
    width: '100%',
    [theme.breakpoints.up('md')]: {
      width: '30ch',
    },
  },
}));

const NotificationItem = styled(ListItem)(({ theme, read }) => ({
  backgroundColor: read ? 'transparent' : alpha(theme.palette.primary.main, 0.05),
  '&:hover': {
    backgroundColor: alpha(theme.palette.primary.main, 0.1),
  },
  cursor: 'pointer',
  transition: 'background-color 0.2s',
}));

// Socket connection for real-time notifications
let socket;

const Header = ({ open, handleDrawerOpen }) => {
  const { user, logout, hasRole } = useAuth();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const [notificationAnchor, setNotificationAnchor] = useState(null);
  const [showAllNotifications, setShowAllNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const notificationsEndRef = useRef(null);

  // Helper function to safely format notification time
  const formatNotificationTime = (timeValue) => {
    if (!timeValue) return 'Just now';
    
    try {
      const date = new Date(timeValue);
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return 'Recently';
      }
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (error) {
      console.error('Error formatting notification time:', error);
      return 'Recently';
    }
  };

  // Get notification icon based on type
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'assignment': return <AssignmentIcon fontSize="small" color="primary" />;
      case 'grade': return <GradeIcon fontSize="small" color="success" />;
      case 'event': return <EventIcon fontSize="small" color="info" />;
      case 'urgent': return <WarningIcon fontSize="small" color="error" />;
      case 'payment': return <WarningIcon fontSize="small" color="warning" />;
      default: return <InfoIcon fontSize="small" color="action" />;
    }
  };

  // Initialize socket connection
  useEffect(() => {
    if (user) {
      // Connect to socket server
      const socketUrl = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';
      socket = io(socketUrl, {
        auth: { token: localStorage.getItem('token') }
      });

      socket.on('connect', () => {
        console.log('Socket connected for notifications');
      });

      // Listen for new notifications
      socket.on('new-notification', (notification) => {
        console.log('New notification received:', notification);
        
        // Ensure notification has a valid time
        const enhancedNotification = {
          ...notification,
          time: notification.time || new Date().toISOString(),
          read: notification.read || false
        };
        
        setNotifications(prev => [enhancedNotification, ...prev]);
        setUnreadCount(prev => prev + 1);
        
        // Show snackbar for new notification
        setSnackbar({
          open: true,
          message: notification.title || 'New notification received',
          severity: notification.type === 'urgent' ? 'warning' : 'info'
        });
      });

      socket.on('notifications-read', (data) => {
        if (data.all) {
          setNotifications(prev => prev.map(n => ({ ...n, read: true })));
          setUnreadCount(0);
        }
      });

      return () => {
        if (socket) {
          socket.disconnect();
        }
      };
    }
  }, [user]);

  // Fetch notifications
  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  const fetchNotifications = async (loadMore = false) => {
    if (loadMore) {
      setLoadingMore(true);
    } else {
      setNotificationsLoading(true);
      setPage(1);
    }

    try {
      const currentPage = loadMore ? page + 1 : 1;
      const response = await api.get(`/notifications?page=${currentPage}&limit=10`);
      const data = response.data.data || [];
      
      // Ensure all notifications have valid time
      const processedData = data.map(notification => ({
        ...notification,
        time: notification.time || notification.createdAt || new Date().toISOString()
      }));
      
      if (loadMore) {
        setNotifications(prev => [...prev, ...processedData]);
        setPage(currentPage);
        setHasMore(data.length === 10);
      } else {
        setNotifications(processedData);
        setUnreadCount(response.data.unreadCount || processedData.filter(n => !n.read).length);
        setHasMore(data.length === 10);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      // Fallback to mock data with valid dates
      const mockNotifications = generateMockNotifications();
      if (loadMore) {
        setNotifications(prev => [...prev, ...mockNotifications]);
        setHasMore(false);
      } else {
        setNotifications(mockNotifications);
        setUnreadCount(mockNotifications.filter(n => !n.read).length);
      }
    } finally {
      if (loadMore) {
        setLoadingMore(false);
      } else {
        setNotificationsLoading(false);
      }
    }
  };

  const generateMockNotifications = () => {
    const now = new Date();
    
    return [
      {
        id: 1,
        type: 'assignment',
        title: 'New Assignment Posted',
        description: 'Programming Assignment 2 is now available',
        time: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
        read: false,
        link: hasRole('student') ? '/student/assignments' : '/teacher/assignments'
      },
      {
        id: 2,
        type: 'grade',
        title: 'Grade Published',
        description: 'Your Calculus quiz has been graded',
        time: new Date(now.getTime() - 5 * 60 * 60 * 1000).toISOString(),
        read: false,
        link: hasRole('student') ? '/student/grades' : '/teacher/grades'
      },
      {
        id: 3,
        type: 'event',
        title: 'Upcoming Event',
        description: 'Parent-Teacher Meeting tomorrow',
        time: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        read: true,
        link: '/announcements'
      },
      {
        id: 4,
        type: 'announcement',
        title: 'School Holiday',
        description: 'School will be closed on Monday',
        time: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        read: false,
        link: '/announcements'
      },
      {
        id: 5,
        type: 'payment',
        title: 'Fee Payment Reminder',
        description: 'Tuition fee due in 3 days',
        time: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        read: true,
        link: hasRole('student') ? '/student/fees' : '/admin/fees'
      }
    ];
  };

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleNotificationOpen = (event) => {
    setNotificationAnchor(event.currentTarget);
    setShowAllNotifications(false); // Reset show all when reopening
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setNotificationAnchor(null);
    setShowAllNotifications(false);
  };

  const handleLogout = () => {
    if (socket) {
      socket.disconnect();
    }
    logout();
    navigate('/login');
    handleMenuClose();
  };

  const handleProfile = () => {
    if (hasRole('student')) {
      navigate('/student/profile');
    } else if (hasRole('teacher')) {
      navigate('/teacher/profile');
    } else {
      navigate('/admin/profile');
    }
    handleMenuClose();
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearchLoading(true);
    try {
      const response = await api.get(`/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchResults(response.data.data || []);
    } catch (error) {
      console.error('Search error:', error);
      // Mock search results
      const mockResults = [
        { id: 1, type: 'course', title: 'Computer Science 101', description: 'CS101', link: hasRole('student') ? '/student/courses' : '/teacher/courses' },
        { id: 2, type: 'assignment', title: 'Programming Assignment 1', description: 'Due in 3 days', link: hasRole('student') ? '/student/assignments' : '/teacher/assignments' },
      ].filter(item => 
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setSearchResults(mockResults);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleNotificationClick = async (notification) => {
    try {
      // Mark as read via API
      await api.post(`/notifications/${notification.id}/read`);
      
      // Update local state
      setNotifications(prev => 
        prev.map(n => n.id === notification.id ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
      
      // Emit socket event
      if (socket) {
        socket.emit('notification-read', { id: notification.id });
      }
      
      // Navigate to the link
      if (notification.link) {
        navigate(notification.link);
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
    
    setNotificationAnchor(null);
  };

  const handleMarkAllAsRead = async () => {
    try {
      // Mark all as read via API
      await api.post('/notifications/read-all');
      
      // Update local state
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
      
      // Emit socket event
      if (socket) {
        socket.emit('notifications-read-all');
      }
      
      setSnackbar({
        open: true,
        message: 'All notifications marked as read',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleViewAllNotifications = () => {
    setShowAllNotifications(true);
    // Scroll to bottom after render
    setTimeout(() => {
      if (notificationsEndRef.current) {
        notificationsEndRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  const handleShowLess = () => {
    setShowAllNotifications(false);
  };

  const handleLoadMore = () => {
    fetchNotifications(true);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const displayedNotifications = showAllNotifications ? notifications : notifications.slice(0, 5);

  return (
    <>
      <AppBar position="fixed" open={open}>
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            onClick={handleDrawerOpen}
            edge="start"
            sx={{
              marginRight: 5,
              ...(open && { display: 'none' }),
            }}
          >
            <MenuIcon />
          </IconButton>

          <Typography
            variant="h6"
            noWrap
            component="div"
            sx={{ 
              display: { xs: 'none', sm: 'block' },
              fontWeight: 'bold',
              letterSpacing: 1,
              cursor: 'pointer'
            }}
            onClick={() => {
              if (hasRole('admin')) navigate('/admin/dashboard');
              else if (hasRole('teacher')) navigate('/teacher/dashboard');
              else navigate('/student/dashboard');
            }}
          >
            EduManage
          </Typography>

          <form onSubmit={handleSearch} style={{ position: 'relative' }}>
            <Search>
              <SearchIconWrapper>
                <SearchIcon />
              </SearchIconWrapper>
              <StyledInputBase
                placeholder="Search courses, assignments, people..."
                inputProps={{ 'aria-label': 'search' }}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </Search>
            
            {/* Search Results Dropdown */}
            {searchQuery && (
              <Paper
                sx={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  mt: 1,
                  maxHeight: 400,
                  overflow: 'auto',
                  zIndex: 9999,
                  borderRadius: 1,
                  boxShadow: 3
                }}
              >
                <Box sx={{ p: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="subtitle2" color="textSecondary">
                    {searchLoading ? 'Searching...' : `${searchResults.length} results`}
                  </Typography>
                  <IconButton size="small" onClick={handleClearSearch}>
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Box>
                <Divider />
                
                {searchLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                    <CircularProgress size={30} />
                  </Box>
                ) : (
                  <List>
                    {searchResults.map((result) => (
                      <ListItem
                        key={result.id}
                        button
                        onClick={() => {
                          navigate(result.link);
                          handleClearSearch();
                        }}
                      >
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: 'primary.light', width: 32, height: 32 }}>
                            {result.type === 'course' && <SchoolIcon fontSize="small" />}
                            {result.type === 'assignment' && <AssignmentIcon fontSize="small" />}
                            {result.type === 'student' && <PersonIcon fontSize="small" />}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={result.title}
                          secondary={result.description}
                        />
                      </ListItem>
                    ))}
                    
                    {searchResults.length === 0 && !searchLoading && (
                      <ListItem>
                        <ListItemText
                          primary="No results found"
                          secondary="Try different keywords"
                        />
                      </ListItem>
                    )}
                  </List>
                )}
              </Paper>
            )}
          </form>

          <Box sx={{ flexGrow: 1 }} />

          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {/* Notifications Icon */}
            <Tooltip title="Notifications">
              <IconButton color="inherit" onClick={handleNotificationOpen}>
                <Badge badgeContent={unreadCount} color="error">
                  <NotificationsIcon />
                </Badge>
              </IconButton>
            </Tooltip>

            {/* Profile Icon */}
            <Tooltip title="Profile">
              <IconButton
                onClick={handleProfileMenuOpen}
                size="small"
                sx={{ ml: 2 }}
                aria-controls={Boolean(anchorEl) ? 'account-menu' : undefined}
                aria-haspopup="true"
                aria-expanded={Boolean(anchorEl) ? 'true' : undefined}
              >
                <Avatar 
                  sx={{ 
                    width: 36, 
                    height: 36, 
                    bgcolor: hasRole('admin') ? 'error.main' : 
                             hasRole('teacher') ? 'success.main' : 'primary.main',
                    cursor: 'pointer',
                    transition: 'transform 0.2s',
                    '&:hover': {
                      transform: 'scale(1.1)',
                    }
                  }}
                >
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </Avatar>
              </IconButton>
            </Tooltip>
          </Box>

          {/* Profile Menu */}
          <Menu
            anchorEl={anchorEl}
            id="account-menu"
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            onClick={handleMenuClose}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            PaperProps={{
              elevation: 3,
              sx: {
                mt: 1.5,
                minWidth: 180,
                borderRadius: 2,
              },
            }}
          >
            <Box sx={{ px: 2, py: 1.5, bgcolor: '#f5f5f5' }}>
              <Typography variant="subtitle2" fontWeight="bold">
                {user?.firstName} {user?.lastName}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                {user?.email}
              </Typography>
            </Box>
            <Divider />
            <MenuItem onClick={handleProfile} sx={{ py: 1.5 }}>
              <PersonIcon sx={{ mr: 1.5, fontSize: 20, color: 'primary.main' }} /> 
              <Typography variant="body2">My Profile</Typography>
            </MenuItem>
            <MenuItem onClick={handleLogout} sx={{ py: 1.5, color: 'error.main' }}>
              <LogoutIcon sx={{ mr: 1.5, fontSize: 20 }} /> 
              <Typography variant="body2">Logout</Typography>
            </MenuItem>
          </Menu>

          {/* Notifications Menu */}
          <Menu
            anchorEl={notificationAnchor}
            id="notification-menu"
            open={Boolean(notificationAnchor)}
            onClose={handleMenuClose}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            PaperProps={{
              sx: { 
                width: 400, 
                maxHeight: showAllNotifications ? 600 : 480,
                mt: 1.5,
                borderRadius: 2,
                overflow: 'hidden',
                transition: 'max-height 0.3s ease-in-out'
              }
            }}
          >
            <Box sx={{ p: 2, bgcolor: 'primary.main', color: 'white' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="subtitle1" fontWeight="bold">
                  Notifications
                </Typography>
                {unreadCount > 0 && (
                  <Button 
                    size="small" 
                    variant="text" 
                    onClick={handleMarkAllAsRead}
                    sx={{ 
                      color: 'white', 
                      textTransform: 'none',
                      '&:hover': {
                        backgroundColor: 'rgba(255,255,255,0.1)'
                      }
                    }}
                    startIcon={<CheckCircleIcon />}
                  >
                    Mark all as read
                  </Button>
                )}
              </Box>
            </Box>
            
            <Divider />
            
            {notificationsLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress size={40} />
              </Box>
            ) : (
              <>
                <List sx={{ p: 0, maxHeight: showAllNotifications ? 450 : 300, overflow: 'auto' }}>
                  {displayedNotifications.length > 0 ? (
                    displayedNotifications.map((notification, index) => (
                      <React.Fragment key={notification.id}>
                        <NotificationItem
                          read={notification.read}
                          onClick={() => handleNotificationClick(notification)}
                        >
                          <ListItemAvatar>
                            <Avatar sx={{ bgcolor: 'transparent' }}>
                              {getNotificationIcon(notification.type)}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={
                              <Typography variant="subtitle2" fontWeight={notification.read ? 400 : 600}>
                                {notification.title}
                              </Typography>
                            }
                            secondary={
                              <Box>
                                <Typography variant="caption" color="textSecondary" display="block">
                                  {notification.description}
                                </Typography>
                                <Typography variant="caption" color="textSecondary">
                                  {formatNotificationTime(notification.time)}
                                </Typography>
                              </Box>
                            }
                          />
                          {!notification.read && (
                            <Box
                              sx={{
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                bgcolor: 'primary.main',
                                ml: 1
                              }}
                            />
                          )}
                        </NotificationItem>
                        {index < displayedNotifications.length - 1 && <Divider />}
                      </React.Fragment>
                    ))
                  ) : (
                    <Box sx={{ p: 4, textAlign: 'center' }}>
                      <NotificationsIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                      <Typography color="textSecondary">No notifications</Typography>
                    </Box>
                  )}
                  
                  {/* Loading more indicator */}
                  {loadingMore && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                      <CircularProgress size={30} />
                    </Box>
                  )}
                  
                  {/* Invisible element to scroll to */}
                  <div ref={notificationsEndRef} />
                </List>
                
                {notifications.length > 5 && (
                  <>
                    <Divider />
                    <Box sx={{ p: 1, textAlign: 'center' }}>
                      {!showAllNotifications ? (
                        <Button 
                          size="small" 
                          color="primary"
                          onClick={handleViewAllNotifications}
                          endIcon={<ExpandMoreIcon />}
                          sx={{ textTransform: 'none' }}
                        >
                          View All ({notifications.length}) Notifications
                        </Button>
                      ) : (
                        <Button 
                          size="small" 
                          color="primary"
                          onClick={handleShowLess}
                          endIcon={<ExpandLessIcon />}
                          sx={{ textTransform: 'none' }}
                        >
                          Show Less
                        </Button>
                      )}
                    </Box>
                  </>
                )}
                
                {hasMore && showAllNotifications && (
                  <Box sx={{ p: 1, textAlign: 'center' }}>
                    <Button 
                      size="small" 
                      color="primary"
                      onClick={handleLoadMore}
                      disabled={loadingMore}
                      sx={{ textTransform: 'none' }}
                    >
                      {loadingMore ? 'Loading...' : 'Load More'}
                    </Button>
                  </Box>
                )}
              </>
            )}
          </Menu>
        </Toolbar>
      </AppBar>

      {/* Snackbar for new notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity} 
          sx={{ width: '100%' }}
          action={
            <Button color="inherit" size="small" onClick={() => {
              handleCloseSnackbar();
              handleNotificationOpen(null);
            }}>
              View
            </Button>
          }
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default Header;