// src/pages/student/StudentGrades.js
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Card,
  CardContent,
  Grid,
  LinearProgress,
  Alert,
  Chip,
  Avatar,
  Divider,
  Stack,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Button,
  Tooltip,
  IconButton,
} from '@mui/material';
import {
  Grade as GradeIcon,
  School as SchoolIcon,
  TrendingUp as TrendingUpIcon,
  ExpandMore as ExpandMoreIcon,
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const StudentGrades = () => {
  const { user } = useAuth();
  const [expandedCourse, setExpandedCourse] = useState(null);

  // Fetch grades using the correct endpoint
  const { data: response, isLoading, error, refetch } = useQuery({
    queryKey: ['studentGrades'],
    queryFn: async () => {
      console.log('Fetching grades for student:', user?.id);
      const res = await api.get('/students/grades');
      console.log('Grades response:', res.data);
      return res.data;
    }
  });

  // Extract data with safe defaults
  const gradesData = response?.data || {};
  
  // Handle different possible data structures
  const courses = Array.isArray(gradesData.courses) ? gradesData.courses : [];
  const allGrades = Array.isArray(gradesData.allGrades) ? gradesData.allGrades : [];
  
  // Calculate GPA from courses data if not provided directly
  const calculateOverallGPA = () => {
    if (courses.length === 0) return '0.00';
    
    let totalPoints = 0;
    let totalCourses = 0;
    
    courses.forEach(course => {
      const assignments = course.assignments || [];
      let coursePoints = 0;
      let gradedCount = 0;
      
      assignments.forEach(assignment => {
        if (assignment.grade) {
          const gradePoints = { 'A': 4.0, 'B': 3.0, 'C': 2.0, 'D': 1.0, 'F': 0.0 };
          coursePoints += gradePoints[assignment.grade] || 0;
          gradedCount++;
        } else if (assignment.score) {
          const score = parseFloat(assignment.score);
          if (!isNaN(score)) {
            if (score >= 90) coursePoints += 4.0;
            else if (score >= 80) coursePoints += 3.0;
            else if (score >= 70) coursePoints += 2.0;
            else if (score >= 60) coursePoints += 1.0;
            else coursePoints += 0.0;
            gradedCount++;
          }
        }
      });
      
      if (gradedCount > 0) {
        totalPoints += (coursePoints / gradedCount);
        totalCourses++;
      }
    });
    
    return totalCourses > 0 ? (totalPoints / totalCourses).toFixed(2) : '0.00';
  };

  // Calculate total credits from courses
  const calculateTotalCredits = () => {
    return courses.reduce((sum, course) => sum + (course.credits || 0), 0);
  };

  const gpa = gradesData.gpa ? parseFloat(gradesData.gpa).toFixed(2) : calculateOverallGPA();
  const totalCredits = gradesData.totalCredits || calculateTotalCredits();

  // Debug logging
  useEffect(() => {
    console.log('Processed grades data:', { 
      courses: courses.map(c => ({
        name: c.courseName,
        code: c.courseCode,
        credits: c.credits,
        assignments: c.assignments?.length || 0
      })),
      allGradesCount: allGrades.length,
      gpa,
      totalCredits 
    });
  }, [courses, allGrades, gpa, totalCredits]);

  // Helper function to calculate letter grade from score
  const getLetterGrade = (score) => {
    if (score === null || score === undefined) return 'N/A';
    const numScore = parseFloat(score);
    if (isNaN(numScore)) return 'N/A';
    if (numScore >= 90) return 'A';
    if (numScore >= 80) return 'B';
    if (numScore >= 70) return 'C';
    if (numScore >= 60) return 'D';
    return 'F';
  };

  // Get grade color
  const getGradeColor = (grade) => {
    if (!grade) return 'default';
    const gradeStr = String(grade).toUpperCase();
    if (gradeStr === 'A') return 'success';
    if (gradeStr === 'B') return 'info';
    if (gradeStr === 'C') return 'warning';
    if (gradeStr === 'D' || gradeStr === 'F') return 'error';
    return 'default';
  };

  // Get score color
  const getScoreColor = (score) => {
    if (score === null || score === undefined) return 'default';
    const numScore = parseFloat(score);
    if (isNaN(numScore)) return 'default';
    if (numScore >= 90) return 'success';
    if (numScore >= 80) return 'info';
    if (numScore >= 70) return 'warning';
    return 'error';
  };

  // Calculate course GPA
  const calculateCourseGPA = (assignments) => {
    if (!assignments || assignments.length === 0) return '0.00';
    
    const gradePoints = { 'A': 4.0, 'B': 3.0, 'C': 2.0, 'D': 1.0, 'F': 0.0 };
    let totalPoints = 0;
    let validAssignments = 0;

    assignments.forEach(assignment => {
      if (assignment.grade) {
        const points = gradePoints[assignment.grade] || 0;
        totalPoints += points;
        validAssignments++;
      } else if (assignment.score) {
        const score = parseFloat(assignment.score);
        if (!isNaN(score)) {
          if (score >= 90) totalPoints += 4.0;
          else if (score >= 80) totalPoints += 3.0;
          else if (score >= 70) totalPoints += 2.0;
          else if (score >= 60) totalPoints += 1.0;
          else totalPoints += 0.0;
          validAssignments++;
        }
      }
    });

    return validAssignments > 0 ? (totalPoints / validAssignments).toFixed(2) : '0.00';
  };

  // Calculate statistics safely
  const calculateStats = () => {
    if (!allGrades || allGrades.length === 0) {
      return {
        totalAssignments: 0,
        highestScore: 0,
        lowestScore: 0,
        averageScore: 0
      };
    }

    const scores = allGrades
      .map(g => parseFloat(g.score))
      .filter(s => !isNaN(s) && s !== null);

    if (scores.length === 0) {
      return {
        totalAssignments: allGrades.length,
        highestScore: 0,
        lowestScore: 0,
        averageScore: 0
      };
    }

    const highest = Math.max(...scores);
    const lowest = Math.min(...scores);
    const average = scores.reduce((sum, s) => sum + s, 0) / scores.length;

    return {
      totalAssignments: allGrades.length,
      highestScore: highest.toFixed(2),
      lowestScore: lowest.toFixed(2),
      averageScore: average.toFixed(2)
    };
  };

  const stats = calculateStats();

  const handleRefresh = () => {
    refetch();
  };

  const handleCourseChange = (courseId) => (event, isExpanded) => {
    setExpandedCourse(isExpanded ? courseId : null);
  };

  if (isLoading) {
    return (
      <Box sx={{ width: '100%', mt: 4 }}>
        <LinearProgress />
        <Typography variant="body2" color="textSecondary" align="center" sx={{ mt: 2 }}>
          Loading your grades...
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
          Error loading grades. Please try again later.
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
            My Grades
          </Typography>
          <Typography variant="body2" color="textSecondary">
            View your academic performance across all courses
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

      {/* GPA Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%', bgcolor: 'primary.main', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="subtitle2" sx={{ color: 'rgba(255,255,255,0.8)' }} gutterBottom>
                    Overall GPA
                  </Typography>
                  <Typography variant="h2" sx={{ fontWeight: 'bold' }}>
                    {gpa}
                  </Typography>
                  {gpa === '0.00' && courses.length > 0 && (
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                      No graded assignments yet
                    </Typography>
                  )}
                </Box>
                <Avatar sx={{ bgcolor: 'primary.dark', width: 56, height: 56 }}>
                  <GradeIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%', bgcolor: 'success.main', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="subtitle2" sx={{ color: 'rgba(255,255,255,0.8)' }} gutterBottom>
                    Credits Enrolled
                  </Typography>
                  <Typography variant="h2" sx={{ fontWeight: 'bold' }}>
                    {totalCredits}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'success.dark', width: 56, height: 56 }}>
                  <SchoolIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%', bgcolor: 'info.main', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="subtitle2" sx={{ color: 'rgba(255,255,255,0.8)' }} gutterBottom>
                    Courses Taken
                  </Typography>
                  <Typography variant="h2" sx={{ fontWeight: 'bold' }}>
                    {courses.length}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'info.dark', width: 56, height: 56 }}>
                  <AssignmentIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Grades by Course */}
      {courses.length > 0 ? (
        courses.map((course) => {
          // Ensure course has required properties
          const courseId = course.courseId || course.id || Math.random();
          const courseName = course.courseName || 'Unknown Course';
          const courseCode = course.courseCode || 'N/A';
          const credits = course.credits || 0;
          const assignments = Array.isArray(course.assignments) ? course.assignments : [];
          const hasGradedAssignments = assignments.some(a => a.grade || a.score);
          const courseGPA = calculateCourseGPA(assignments);
          
          return (
            <Accordion 
              key={courseId}
              expanded={expandedCourse === courseId}
              onChange={handleCourseChange(courseId)}
              sx={{ mb: 2 }}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Grid container alignItems="center" spacing={2}>
                  <Grid item xs={12} md={4}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <SchoolIcon color="primary" />
                      <Box>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {courseName}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {courseCode}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Typography variant="body2" color="textSecondary">
                      Credits: {credits}
                    </Typography>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Typography variant="body2" color="textSecondary">
                      Assignments: {assignments.length}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={2}>
                    {hasGradedAssignments ? (
                      <Chip
                        label={`GPA: ${courseGPA}`}
                        color={parseFloat(courseGPA) >= 3.5 ? 'success' : 
                               parseFloat(courseGPA) >= 2.5 ? 'warning' : 'error'}
                        size="small"
                      />
                    ) : (
                      <Chip
                        label="No grades yet"
                        variant="outlined"
                        size="small"
                      />
                    )}
                  </Grid>
                </Grid>
              </AccordionSummary>
              <AccordionDetails>
                {assignments.length > 0 ? (
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                          <TableCell>Assignment</TableCell>
                          <TableCell>Submitted</TableCell>
                          <TableCell align="center">Score</TableCell>
                          <TableCell align="center">Grade</TableCell>
                          <TableCell>Feedback</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {assignments.map((assignment) => {
                          const assignmentId = assignment.id || assignment.assignmentId || Math.random();
                          const assignmentName = assignment.assignmentName || assignment.title || 'Unknown';
                          const score = assignment.score;
                          const grade = assignment.grade || (score ? getLetterGrade(score) : null);
                          const submittedAt = assignment.submittedAt || assignment.submissionDate;
                          const feedback = assignment.feedback || '';
                          
                          return (
                            <TableRow key={assignmentId} hover>
                              <TableCell>
                                <Typography variant="body2" fontWeight="bold">
                                  {assignmentName}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                {submittedAt ? new Date(submittedAt).toLocaleDateString() : 'Not submitted'}
                              </TableCell>
                              <TableCell align="center">
                                {score !== null && score !== undefined ? (
                                  <Chip
                                    label={score}
                                    size="small"
                                    color={getScoreColor(score)}
                                    sx={{ minWidth: 60 }}
                                  />
                                ) : (
                                  <Typography variant="caption" color="textSecondary">—</Typography>
                                )}
                              </TableCell>
                              <TableCell align="center">
                                {grade ? (
                                  <Chip
                                    label={grade}
                                    size="small"
                                    color={getGradeColor(grade)}
                                    sx={{ minWidth: 40 }}
                                  />
                                ) : (
                                  <Typography variant="caption" color="textSecondary">—</Typography>
                                )}
                              </TableCell>
                              <TableCell>
                                <Tooltip title={feedback || 'No feedback'}>
                                  <Typography 
                                    variant="caption" 
                                    color="textSecondary"
                                    sx={{
                                      maxWidth: 200,
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap',
                                      display: 'block'
                                    }}
                                  >
                                    {feedback || '—'}
                                  </Typography>
                                </Tooltip>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Typography color="textSecondary" align="center" sx={{ py: 2 }}>
                    No assignments found for this course.
                  </Typography>
                )}
              </AccordionDetails>
            </Accordion>
          );
        })
      ) : (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <GradeIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="textSecondary" gutterBottom>
            No Courses Enrolled
          </Typography>
          <Typography variant="body2" color="textSecondary">
            You are not enrolled in any courses yet.
          </Typography>
        </Paper>
      )}

      {/* All Grades Summary */}
      {allGrades.length > 0 && (
        <Paper sx={{ p: 2, mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            Grade Summary
          </Typography>
          <Divider sx={{ mb: 2 }} />
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={3}>
              <Card variant="outlined">
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Total Assignments
                  </Typography>
                  <Typography variant="h4">
                    {stats.totalAssignments}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card variant="outlined">
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Highest Score
                  </Typography>
                  <Typography variant="h4" color="success.main">
                    {stats.highestScore}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card variant="outlined">
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Lowest Score
                  </Typography>
                  <Typography variant="h4" color="error.main">
                    {stats.lowestScore}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card variant="outlined">
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Average Score
                  </Typography>
                  <Typography variant="h4" color="info.main">
                    {stats.averageScore}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Paper>
      )}
    </Box>
  );
};

export default StudentGrades;