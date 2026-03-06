// backend/controllers/paymentController.js
const { Payment, Student, User, Course, Enrollment } = require('../models');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const { Op } = require('sequelize');
const sequelize = require('../config/database');

// Get all payments with filters
exports.getAllPayments = catchAsync(async (req, res, next) => {
  try {
    const { status, studentId, fromDate, toDate, type } = req.query;

    // Build where clause
    const whereClause = {};
    if (status) whereClause.status = status;
    if (studentId) whereClause.studentId = studentId;
    if (type) whereClause.paymentType = type;
    
    // Date range filter
    if (fromDate || toDate) {
      whereClause.createdAt = {};
      if (fromDate) whereClause.createdAt[Op.gte] = new Date(fromDate);
      if (toDate) whereClause.createdAt[Op.lte] = new Date(toDate);
    }

    // Get all payments
    const payments = await Payment.findAll({
      where: whereClause,
      order: [['createdAt', 'DESC']]
    });

    // Get all students for reference
    const students = await Student.findAll({
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email', 'phone']
        }
      ]
    });
    const studentMap = {};
    students.forEach(s => {
      studentMap[s.id] = s.toJSON();
    });

    // Add student details to payments
    const paymentsWithDetails = payments.map(payment => {
      const paymentJson = payment.toJSON();
      paymentJson.Student = studentMap[payment.studentId] || null;
      return paymentJson;
    });

    // Calculate statistics
    const totalCollected = paymentsWithDetails
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

    const totalPending = paymentsWithDetails
      .filter(p => p.status === 'pending')
      .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

    const totalOverdue = paymentsWithDetails
      .filter(p => p.status === 'pending' && new Date(p.dueDate) < new Date())
      .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

    res.json({
      success: true,
      data: paymentsWithDetails,
      stats: {
        totalCollected,
        totalPending,
        totalOverdue,
        totalRecords: paymentsWithDetails.length
      }
    });

  } catch (error) {
    console.error('Error in getAllPayments:', error);
    // Return empty data instead of error
    res.json({
      success: true,
      data: [],
      stats: {
        totalCollected: 0,
        totalPending: 0,
        totalOverdue: 0,
        totalRecords: 0
      }
    });
  }
});

// Get single payment by ID
exports.getPaymentById = catchAsync(async (req, res, next) => {
  try {
    const { id } = req.params;

    const payment = await Payment.findByPk(id);

    if (!payment) {
      return next(new AppError('Payment not found', 404));
    }

    // Get student details
    let student = null;
    if (payment.studentId) {
      student = await Student.findByPk(payment.studentId, {
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'firstName', 'lastName', 'email', 'phone']
          }
        ]
      });
    }

    const paymentJson = payment.toJSON();
    paymentJson.Student = student ? student.toJSON() : null;

    res.json({
      success: true,
      data: paymentJson
    });

  } catch (error) {
    console.error('Error in getPaymentById:', error);
    return next(new AppError(error.message, 500));
  }
});

// Create new payment record
exports.createPayment = catchAsync(async (req, res, next) => {
  try {
    const { studentId, amount, paymentType, dueDate, description, status } = req.body;

    // Check if student exists
    const student = await Student.findByPk(studentId);
    if (!student) {
      return next(new AppError('Student not found', 404));
    }

    const payment = await Payment.create({
      studentId,
      amount,
      paymentType: paymentType || 'tuition',
      dueDate,
      description,
      status: status || 'pending'
    });

    // Get created payment with student details
    const createdPayment = payment.toJSON();
    createdPayment.Student = student.toJSON();

    res.status(201).json({
      success: true,
      data: createdPayment
    });

  } catch (error) {
    console.error('Error in createPayment:', error);
    return next(new AppError(error.message, 500));
  }
});

// Update payment
exports.updatePayment = catchAsync(async (req, res, next) => {
  try {
    const { id } = req.params;
    const { amount, paymentType, dueDate, description, status } = req.body;

    const payment = await Payment.findByPk(id);

    if (!payment) {
      return next(new AppError('Payment not found', 404));
    }

    await payment.update({
      amount: amount !== undefined ? amount : payment.amount,
      paymentType: paymentType || payment.paymentType,
      dueDate: dueDate || payment.dueDate,
      description: description !== undefined ? description : payment.description,
      status: status || payment.status
    });

    // Get updated payment with student details
    let student = null;
    if (payment.studentId) {
      student = await Student.findByPk(payment.studentId, {
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['firstName', 'lastName', 'email']
          }
        ]
      });
    }

    const paymentJson = payment.toJSON();
    paymentJson.Student = student ? student.toJSON() : null;

    res.json({
      success: true,
      data: paymentJson
    });

  } catch (error) {
    console.error('Error in updatePayment:', error);
    return next(new AppError(error.message, 500));
  }
});

// Delete payment
exports.deletePayment = catchAsync(async (req, res, next) => {
  try {
    const { id } = req.params;

    const payment = await Payment.findByPk(id);

    if (!payment) {
      return next(new AppError('Payment not found', 404));
    }

    await payment.destroy();

    res.json({
      success: true,
      message: 'Payment deleted successfully'
    });

  } catch (error) {
    console.error('Error in deletePayment:', error);
    return next(new AppError(error.message, 500));
  }
});

// Update payment status
exports.updatePaymentStatus = catchAsync(async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const payment = await Payment.findByPk(id);

    if (!payment) {
      return next(new AppError('Payment not found', 404));
    }

    const updateData = { status };
    
    // If marking as completed, set payment date
    if (status === 'completed' && payment.status !== 'completed') {
      updateData.paymentDate = new Date();
      // Generate transaction ID if not exists
      if (!payment.transactionId) {
        updateData.transactionId = 'TXN' + Date.now() + Math.floor(Math.random() * 1000);
      }
    }

    await payment.update(updateData);

    res.json({
      success: true,
      data: payment
    });

  } catch (error) {
    console.error('Error in updatePaymentStatus:', error);
    return next(new AppError(error.message, 500));
  }
});

// Make payment (student payment)
exports.makePayment = catchAsync(async (req, res, next) => {
  try {
    const studentId = req.user?.student?.id;
    const { feeId, amount, paymentMethod } = req.body;

    if (!studentId) {
      return next(new AppError('Student ID not found', 404));
    }

    const payment = await Payment.findByPk(feeId, {
      include: [
        {
          model: Student,
          as: 'student',
          include: [
            {
              model: User,
              as: 'user'
            }
          ]
        }
      ]
    });

    if (!payment || payment.studentId !== studentId) {
      return next(new AppError('Payment record not found', 404));
    }

    if (payment.status === 'completed') {
      return next(new AppError('Payment already completed', 400));
    }

    payment.status = 'completed';
    payment.paymentDate = new Date();
    payment.transactionId = 'TXN' + Date.now() + Math.floor(Math.random() * 1000);
    payment.paymentMethod = paymentMethod;
    await payment.save();

    // Get io instance and notification controller
    const io = req.app.get('io');
    const notificationController = require('./notificationController');

    // Get student details
    const student = await Student.findByPk(studentId, {
      include: [{ model: User, as: 'user' }]
    });

    // Find all admin users
    const admins = await User.findAll({ where: { role: 'admin' } });

    // Send notifications to admins
    for (const admin of admins) {
      await notificationController.createNotification(
        admin.id,
        'payment',
        'Payment Received',
        `${student?.user?.firstName} ${student?.user?.lastName} made a payment of $${amount}.`,
        '/admin/fees',
        { paymentId: payment.id, studentId, amount }
      );
      
      if (io) {
        io.to(`user-${admin.id}`).emit('new-notification', {
          id: Date.now(),
          type: 'payment',
          title: 'Payment Received',
          description: `Payment of $${amount} received from ${student?.user?.firstName} ${student?.user?.lastName}.`,
          time: new Date(),
          read: false,
          link: '/admin/fees'
        });
      }
    }

    // Send notification to student
    await notificationController.createNotification(
      studentId,
      'payment',
      'Payment Successful',
      `Your payment of $${amount} has been processed successfully.`,
      '/student/fees',
      { paymentId: payment.id, amount }
    );

    if (io) {
      io.to(`user-${studentId}`).emit('new-notification', {
        id: Date.now(),
        type: 'payment',
        title: 'Payment Successful',
        description: `Your payment of $${amount} has been processed.`,
        time: new Date(),
        read: false,
        link: '/student/fees'
      });
    }

    res.json({
      success: true,
      data: payment
    });

  } catch (error) {
    console.error('Error in makePayment:', error);
    return next(new AppError(error.message, 500));
  }
});

// Bulk delete payments
exports.bulkDeletePayments = catchAsync(async (req, res, next) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return next(new AppError('Please provide an array of payment IDs', 400));
    }

    await Payment.destroy({
      where: {
        id: {
          [Op.in]: ids
        }
      }
    });

    res.json({
      success: true,
      message: `${ids.length} payments deleted successfully`
    });

  } catch (error) {
    console.error('Error in bulkDeletePayments:', error);
    return next(new AppError(error.message, 500));
  }
});

// Get payment statistics
exports.getPaymentStats = catchAsync(async (req, res, next) => {
  try {
    // Monthly revenue for last 6 months
    let monthlyRevenue = [];
    try {
      monthlyRevenue = await sequelize.query(`
        SELECT 
          DATE_FORMAT(payment_date, '%b') as month,
          SUM(amount) as total
        FROM payments 
        WHERE status = 'completed' 
          AND payment_date >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
        GROUP BY DATE_FORMAT(payment_date, '%Y-%m')
        ORDER BY MIN(payment_date) ASC
      `, { type: sequelize.QueryTypes.SELECT });
    } catch (err) {
      console.error('Error fetching monthly revenue:', err);
      monthlyRevenue = [];
    }

    // Payment type distribution
    const payments = await Payment.findAll();
    const typeMap = new Map();
    
    payments.forEach(p => {
      const type = p.paymentType || 'other';
      if (!typeMap.has(type)) {
        typeMap.set(type, { count: 0, total: 0 });
      }
      const data = typeMap.get(type);
      data.count++;
      data.total += parseFloat(p.amount || 0);
    });

    const typeDistribution = Array.from(typeMap.entries()).map(([type, data]) => ({
      type,
      count: data.count,
      total: data.total
    }));

    // Daily collection for last 30 days
    let dailyCollection = [];
    try {
      dailyCollection = await sequelize.query(`
        SELECT 
          DATE_FORMAT(payment_date, '%Y-%m-%d') as date,
          SUM(amount) as total
        FROM payments 
        WHERE status = 'completed' 
          AND payment_date >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        GROUP BY DATE(payment_date)
        ORDER BY date ASC
      `, { type: sequelize.QueryTypes.SELECT });
    } catch (err) {
      console.error('Error fetching daily collection:', err);
      dailyCollection = [];
    }

    res.json({
      success: true,
      data: {
        monthlyRevenue: monthlyRevenue.map(m => ({
          month: m.month,
          total: parseFloat(m.total) || 0
        })),
        typeDistribution,
        dailyCollection: dailyCollection.map(d => ({
          date: d.date,
          total: parseFloat(d.total) || 0
        }))
      }
    });

  } catch (error) {
    console.error('Error in getPaymentStats:', error);
    // Return empty data instead of error
    res.json({
      success: true,
      data: {
        monthlyRevenue: [],
        typeDistribution: [],
        dailyCollection: []
      }
    });
  }
});

// Get student fee summary
exports.getStudentFeeSummary = catchAsync(async (req, res, next) => {
  try {
    const { studentId } = req.params;

    const payments = await Payment.findAll({
      where: { studentId },
      order: [['dueDate', 'ASC']]
    });

    const totalDue = payments
      .filter(p => p.status === 'pending')
      .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

    const totalPaid = payments
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

    const overdueAmount = payments
      .filter(p => p.status === 'pending' && new Date(p.dueDate) < new Date())
      .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

    res.json({
      success: true,
      data: {
        payments,
        summary: {
          totalDue,
          totalPaid,
          overdueAmount,
          paymentCount: payments.length
        }
      }
    });

  } catch (error) {
    console.error('Error in getStudentFeeSummary:', error);
    return next(new AppError(error.message, 500));
  }
});