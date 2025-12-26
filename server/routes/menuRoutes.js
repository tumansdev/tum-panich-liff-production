const express = require('express');
const router = express.Router();
const menuController = require('../controllers/menuController');

// GET /api/menu - Get all menu items
router.get('/', menuController.getAllMenuItems);

// GET /api/menu/:id - Get menu item by ID
router.get('/:id', menuController.getMenuItemById);

// GET /api/menu/category/:categoryId - Get menu items by category
router.get('/category/:categoryId', menuController.getMenuItemsByCategory);

module.exports = router;
