const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const adminAuth = require('../middleware/adminAuth');

// POST /api/admin/login - Admin login
router.post('/login', adminController.login);

// Protected routes (require admin token)
router.use(adminAuth);

// Dashboard
router.get('/dashboard', adminController.getDashboard);
router.get('/notifications', adminController.getNotifications);
router.patch('/notifications/:id/read', adminController.markNotificationRead);
router.post('/notifications/read-all', adminController.markAllNotificationsRead);

// Orders management
router.get('/orders', adminController.getOrders);
router.patch('/orders/:id/status', adminController.updateOrderStatus);
router.get('/orders/:id/slip', adminController.getOrderSlip);
router.post('/orders/:id/verify-payment', adminController.verifyPayment);

// Menu management
router.get('/menu', adminController.getAllMenu);
router.post('/menu', adminController.createMenuItem);
router.patch('/menu/:id', adminController.updateMenuItem);
router.delete('/menu/:id', adminController.deleteMenuItem);

// Coupon management
router.get('/coupons', adminController.getCoupons);
router.post('/coupons', adminController.createCoupon);
router.patch('/coupons/:id', adminController.updateCoupon);

// Reports
router.get('/reports/daily', adminController.getDailyReport);
router.get('/reports/summary', adminController.getSummaryReport);

module.exports = router;
