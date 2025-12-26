const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { liffAuth } = require('../middleware/liffAuth');
const { validateCreateOrder } = require('../middleware/validate');
const { uploadLimiter } = require('../middleware/rateLimit');
const { uploadSlip } = require('../middleware/upload');


// POST /api/orders - Create new order (requires auth + validation)
router.post('/', liffAuth, validateCreateOrder, orderController.createOrder);

// GET /api/orders/user/:lineUserId - Get orders by user (requires auth + owner check)
router.get('/user/:lineUserId', liffAuth, orderController.getOrdersByUser);

// POST /api/orders/:id/slip - Upload slip (requires auth + rate limit)
router.post('/:id/slip', liffAuth, uploadLimiter, uploadSlip.single('slip'), orderController.uploadSlip);

// GET /api/orders/:orderNumber - Get order by order number (requires auth)
router.get('/:orderNumber', liffAuth, orderController.getOrderByNumber);

// GET /api/orders/:id/track - Get order tracking (requires auth)
router.get('/:id/track', liffAuth, orderController.getOrderTracking);

module.exports = router;
