// src/components/common/Sidebar.js
import React from 'react';
import { styled } from '@mui/material/styles';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Box from '@mui/material/Box';
import Avatar from '@mui/material/Avatar';
import Typography from '@mui/material/Typography';
import Badge from '@mui/material/Badge';
import Tooltip from '@mui/material/Tooltip';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import SchoolIcon from '@mui/icons-material/School';
import ScheduleIcon from '@mui/icons-material/Schedule';
import GradeIcon from '@mui/icons-material/Grade';
import PaymentIcon from '@mui/icons-material/Payment';
import AnnouncementIcon from '@mui/icons-material/Announcement';
import ClassIcon from '@mui/icons-material/Class';
import AssignmentIcon from '@mui/icons-material/Assignment';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import SettingsIcon from '@mui/icons-material/Settings';
import HelpIcon from '@mui/icons-material/Help';
import LogoutIcon from '@mui/icons-material/Logout';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import EventNoteIcon from '@mui/icons-material/EventNote';
import ReceiptIcon from '@mui/icons-material/Receipt';

const drawerWidth = 240;

const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(0, 1),
  ...theme.mixins.toolbar,
  justifyContent: 'flex-end',
}));

const Sidebar = ({ open, handleDrawerClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, hasRole, logout } = useAuth();

  // Admin menu items
  const adminMenuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/admin/dashboard' },
    { text: 'Students', icon: <PeopleIcon />, path: '/admin/students' },
    { text: 'Teachers', icon: <SchoolIcon />, path: '/admin/teachers' },
    { text: 'Courses', icon: <ClassIcon />, path: '/admin/courses' },
    { text: 'Schedule', icon: <ScheduleIcon />, path: '/admin/schedule' },
    { text: 'Grades', icon: <GradeIcon />, path: '/admin/grades' },
    { text: 'Fees', icon: <PaymentIcon />, path: '/admin/fees' },
    { text: 'Announcements', icon: <AnnouncementIcon />, path: '/admin/announcements' },
  ];

  // Teacher menu items
  const teacherMenuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/teacher/dashboard' },
    { text: 'My Courses', icon: <ClassIcon />, path: '/teacher/courses' },
    { text: 'Students', icon: <PeopleIcon />, path: '/teacher/students' },
    { text: 'Assignments', icon: <AssignmentIcon />, path: '/teacher/assignments' },
    { text: 'Grades', icon: <GradeIcon />, path: '/teacher/grades' },
    { text: 'Schedule', icon: <ScheduleIcon />, path: '/teacher/schedule' },
    { text: 'Announcements', icon: <AnnouncementIcon />, path: '/teacher/announcements' },
  ];

  // Student menu items
  const studentMenuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/student/dashboard' },
    { text: 'My Courses', icon: <ClassIcon />, path: '/student/courses' },
    { text: 'Assignments', icon: <AssignmentIcon />, path: '/student/assignments' },
    { text: 'Grades', icon: <GradeIcon />, path: '/student/grades' },
    { text: 'Schedule', icon: <ScheduleIcon />, path: '/student/schedule' },
    { text: 'Fees', icon: <PaymentIcon />, path: '/student/fees' },
    { text: 'Announcements', icon: <AnnouncementIcon />, path: '/student/announcements' },
    { text: 'Profile', icon: <AccountCircleIcon />, path: '/student/profile' },
  ];

  // Get menu items based on user role
  const getMenuItems = () => {
    if (hasRole('admin')) return adminMenuItems;
    if (hasRole('teacher')) return teacherMenuItems;
    if (hasRole('student')) return studentMenuItems;
    return [];
  };

  const menuItems = getMenuItems();

  const handleNavigation = (path) => {
    navigate(path);
    if (window.innerWidth < 600) {
      handleDrawerClose();
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Get role-based color
  const getRoleColor = () => {
    if (hasRole('admin')) return 'error';
    if (hasRole('teacher')) return 'success';
    if (hasRole('student')) return 'primary';
    return 'default';
  };

  const roleColor = getRoleColor();

  return (
    <Drawer
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          backgroundColor: '#f8f9fa',
          borderRight: '1px solid',
          borderRightColor: 'divider',
        },
      }}
      variant="persistent"
      anchor="left"
      open={open}
    >
      <DrawerHeader>
        <Typography 
          variant="h6" 
          sx={{ 
            flexGrow: 1, 
            ml: 2,
            fontWeight: 'bold',
            color: `${roleColor}.main`
          }}
        >
          EduManage
        </Typography>
        <IconButton onClick={handleDrawerClose}>
          <ChevronLeftIcon />
        </IconButton>
      </DrawerHeader>
      <Divider />
      
      {/* User Info */}
      {user && (
        <Box sx={{ p: 2, textAlign: 'center' }}>
          <Badge
            overlap="circular"
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            badgeContent={
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  bgcolor: 'success.main',
                  borderRadius: '50%',
                  border: '2px solid white',
                }}
              />
            }
          >
            <Avatar 
              sx={{ 
                width: 80, 
                height: 80, 
                mx: 'auto', 
                mb: 1,
                bgcolor: `${roleColor}.main`,
                fontSize: '2rem',
                cursor: 'pointer',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'scale(1.05)',
                  boxShadow: 3,
                }
              }}
              onClick={() => {
                if (hasRole('student')) {
                  handleNavigation('/student/profile');
                } else if (hasRole('teacher')) {
                  handleNavigation('/teacher/profile');
                } else {
                  handleNavigation('/admin/profile');
                }
              }}
            >
              {user.firstName?.[0]}{user.lastName?.[0]}
            </Avatar>
          </Badge>
          <Typography variant="subtitle1" fontWeight="bold">
            {user.firstName} {user.lastName}
          </Typography>
          <Typography 
            variant="body2" 
            sx={{ 
              textTransform: 'capitalize',
              color: `${roleColor}.main`,
              fontWeight: 500,
              bgcolor: `${roleColor}.lighter`,
              px: 1,
              py: 0.5,
              borderRadius: 1,
              display: 'inline-block'
            }}
          >
            {user.role}
          </Typography>
        </Box>
      )}
      
      <Divider />
      
      {/* Main Menu */}
      <List sx={{ px: 1 }}>
        {menuItems.map((item) => {
          const isSelected = location.pathname === item.path;
          
          return (
            <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
              <Tooltip title={item.text} placement="right" arrow>
                <ListItemButton
                  selected={isSelected}
                  onClick={() => handleNavigation(item.path)}
                  sx={{
                    py: 1.5,
                    px: 2,
                    borderRadius: 2,
                    '&.Mui-selected': {
                      backgroundColor: `${roleColor}.lighter`,
                      color: `${roleColor}.main`,
                      '&:hover': {
                        backgroundColor: `${roleColor}.light`,
                      },
                      '& .MuiListItemIcon-root': {
                        color: `${roleColor}.main`,
                      },
                    },
                    '&:hover': {
                      backgroundColor: 'action.hover',
                    },
                  }}
                >
                  <ListItemIcon sx={{ 
                    color: isSelected ? `${roleColor}.main` : 'text.secondary',
                    minWidth: 40
                  }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText 
                    primary={item.text} 
                    primaryTypographyProps={{
                      fontSize: '0.95rem',
                      fontWeight: isSelected ? 600 : 400
                    }}
                  />
                </ListItemButton>
              </Tooltip>
            </ListItem>
          );
        })}
      </List>
      
      <Divider />
      
      {/* Logout Button */}
      <List sx={{ px: 1, mt: 2 }}>
        <ListItem disablePadding>
          <Tooltip title="Logout" placement="right" arrow>
            <ListItemButton 
              onClick={handleLogout} 
              sx={{ 
                py: 1.5, 
                px: 2, 
                borderRadius: 2,
                color: 'error.main',
                '&:hover': {
                  backgroundColor: 'error.lighter',
                }
              }}
            >
              <ListItemIcon sx={{ minWidth: 40, color: 'error.main' }}>
                <LogoutIcon />
              </ListItemIcon>
              <ListItemText 
                primary="Logout" 
                primaryTypographyProps={{
                  fontSize: '0.95rem',
                }}
              />
            </ListItemButton>
          </Tooltip>
        </ListItem>
      </List>

      {/* App Version */}
      <Box sx={{ mt: 'auto', p: 2, textAlign: 'center' }}>
        <Typography variant="caption" color="textSecondary">
          Version 2.0.0
        </Typography>
        <Typography variant="caption" display="block" color="textSecondary">
          © 2026 EduManage
          <p>Selector</p>
        </Typography>
      </Box>
    </Drawer>
  );
};

export default Sidebar;