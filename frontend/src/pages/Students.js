// src/pages/Students.js
import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Alert,
  LinearProgress,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import api from '../services/api';
import StudentList from '../components/students/StudentList';
import StudentForm from '../components/students/StudentForm';
import StudentDetails from '../components/students/StudentDetails';

const Students = () => {
  const [openForm, setOpenForm] = useState(false);
  const [openDetails, setOpenDetails] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const queryClient = useQueryClient();

  const { data: students, isLoading, error } = useQuery({
    queryKey: ['students'],
    queryFn: () => api.get('/students').then(res => res.data)
  });

  const createMutation = useMutation({
    mutationFn: (newStudent) => api.post('/students', newStudent),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      toast.success('Student created successfully');
      setOpenForm(false);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create student');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (updatedStudent) => api.put(`/students/${updatedStudent.id}`, updatedStudent),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      toast.success('Student updated successfully');
      setOpenForm(false);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update student');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/students/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      toast.success('Student deleted successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete student');
    },
  });

  const handleAdd = () => {
    setSelectedStudent(null);
    setOpenForm(true);
  };

  const handleEdit = (student) => {
    setSelectedStudent(student);
    setOpenForm(true);
  };

  const handleView = (student) => {
    setSelectedStudent(student);
    setOpenDetails(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this student?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleSubmit = (values) => {
    if (selectedStudent) {
      updateMutation.mutate({ id: selectedStudent.id, ...values });
    } else {
      createMutation.mutate(values);
    }
  };

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
        <Alert severity="error">
          Error loading students. Please try again later.
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Students</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAdd}
        >
          Add Student
        </Button>
      </Box>

      <StudentList
        students={students}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onView={handleView}
      />

      <StudentForm
        open={openForm}
        onClose={() => setOpenForm(false)}
        onSubmit={handleSubmit}
        student={selectedStudent}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      />

      <StudentDetails
        open={openDetails}
        onClose={() => setOpenDetails(false)}
        student={selectedStudent}
      />
    </Box>
  );
};

export default Students;