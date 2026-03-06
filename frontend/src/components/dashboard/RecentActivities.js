// src/components/dashboard/RecentActivities.js
import React from 'react';
import {
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider,
  Chip,
  Box,
} from '@mui/material';
import {
  Assignment as AssignmentIcon,
  Grade as GradeIcon,
  Payment as PaymentIcon,
  Event as EventIcon,
} from '@mui/icons-material';
import { formatDistance } from 'date-fns';

const getActivityIcon = (type) => {
  switch (type) {
    case 'assignment':
      return <AssignmentIcon />;
    case 'grade':
      return <GradeIcon />;
    case 'payment':
      return <PaymentIcon />;
    case 'event':
      return <EventIcon />;
    default:
      return <EventIcon />;
  }
};

const getActivityColor = (type) => {
  switch (type) {
    case 'assignment':
      return '#1976d2';
    case 'grade':
      return '#2e7d32';
    case 'payment':
      return '#ed6c02';
    case 'event':
      return '#9c27b0';
    default:
      return '#757575';
  }
};

const RecentActivities = ({ activities = [], loading = false }) => {
  return (
    <Paper sx={{ p: 2, height: '100%' }}>
      <Typography variant="h6" gutterBottom>
        Recent Activities
      </Typography>
      
      {activities.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography color="textSecondary">No recent activities</Typography>
        </Box>
      ) : (
        <List sx={{ width: '100%' }}>
          {activities.map((activity, index) => (
            <React.Fragment key={activity.id}>
              <ListItem alignItems="flex-start" sx={{ px: 0 }}>
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: getActivityColor(activity.type) }}>
                    {getActivityIcon(activity.type)}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="subtitle2">{activity.title}</Typography>
                      <Chip 
                        label={activity.type} 
                        size="small" 
                        sx={{ 
                          backgroundColor: getActivityColor(activity.type),
                          color: 'white',
                          fontSize: '0.7rem'
                        }} 
                      />
                    </Box>
                  }
                  secondary={
                    <>
                      <Typography variant="body2" color="textSecondary">
                        {activity.description}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {formatDistance(new Date(activity.timestamp), new Date(), { addSuffix: true })}
                      </Typography>
                    </>
                  }
                />
              </ListItem>
              {index < activities.length - 1 && <Divider variant="inset" component="li" />}
            </React.Fragment>
          ))}
        </List>
      )}
    </Paper>
  );
};

export default RecentActivities;