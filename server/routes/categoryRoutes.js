const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// GET /api/categories - Get all categories
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM categories WHERE is_active = true ORDER BY sort_order'
    );
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch categories' });
  }
});

module.exports = router;
