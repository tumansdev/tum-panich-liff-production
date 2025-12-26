const express = require('express');
const router = express.Router();
const couponController = require('../controllers/couponController');

// POST /api/coupons/validate - Validate coupon code
router.post('/validate', couponController.validateCoupon);

module.exports = router;
