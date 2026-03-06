// src/services/socket.js
import { io } from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

class SocketService {
  constructor() {
    this.socket = null;
  }

  connect(token) {
    this.socket = io(SOCKET_URL, {
      auth: {
        token,
      },
    });

    this.socket.on('connect', () => {
      console.log('Socket connected');
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  on(event, callback) {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  off(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  emit(event, data) {
    if (this.socket) {
      this.socket.emit(event, data);
    }
  }

  // Specific events
  onNewAnnouncement(callback) {
    this.on('new-announcement', callback);
  }

  onGradePublished(callback) {
    this.on('grade-published', callback);
  }

  onAttendanceUpdated(callback) {
    this.on('attendance-updated', callback);
  }

  onPaymentReceived(callback) {
    this.on('payment-received', callback);
  }

  // Join rooms
  joinCourseRoom(courseId) {
    this.emit('join-course', courseId);
  }

  leaveCourseRoom(courseId) {
    this.emit('leave-course', courseId);
  }

  joinDepartmentRoom(department) {
    this.emit('join-department', department);
  }

  leaveDepartmentRoom(department) {
    this.emit('leave-department', department);
  }
}

export default new SocketService();