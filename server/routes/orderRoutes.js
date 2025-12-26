const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { liffAuth } = require('../middleware/liffAuth');
const { validateCreateOrder } = require('../middleware/validate');
const { uploadLimiter } = require('../middleware/rateLimit');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads/slips');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for slip uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'slip-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Only image files are allowed'));
  }
});

// POST /api/orders - Create new order (requires auth + validation)
router.post('/', liffAuth, validateCreateOrder, orderController.createOrder);

// GET /api/orders/user/:lineUserId - Get orders by user (requires auth + owner check)
router.get('/user/:lineUserId', liffAuth, orderController.getOrdersByUser);

// POST /api/orders/:id/slip - Upload slip (requires auth + rate limit)
router.post('/:id/slip', liffAuth, uploadLimiter, upload.single('slip'), orderController.uploadSlip);

// GET /api/orders/:orderNumber - Get order by order number (requires auth)
router.get('/:orderNumber', liffAuth, orderController.getOrderByNumber);

// GET /api/orders/:id/track - Get order tracking (requires auth)
router.get('/:id/track', liffAuth, orderController.getOrderTracking);

module.exports = router;
