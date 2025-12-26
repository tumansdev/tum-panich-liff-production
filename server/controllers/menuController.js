const pool = require('../config/db');

// Get all menu items with categories
exports.getAllMenuItems = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        m.*,
        c.name as category_name,
        c.name_en as category_name_en,
        c.icon as category_icon
      FROM menu_items m
      LEFT JOIN categories c ON m.category_id = c.id
      WHERE m.is_available = true
      ORDER BY m.is_recommended DESC, m.sort_order, m.id
    `);

    // Get categories
    const categories = await pool.query(
      'SELECT * FROM categories WHERE is_active = true ORDER BY sort_order'
    );

    res.json({
      success: true,
      data: {
        items: result.rows,
        categories: categories.rows
      }
    });
  } catch (error) {
    console.error('Error fetching menu:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch menu' });
  }
};

// Get menu item by ID with options
exports.getMenuItemById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const itemResult = await pool.query(
      'SELECT * FROM menu_items WHERE id = $1',
      [id]
    );

    if (itemResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Menu item not found' });
    }

    const optionsResult = await pool.query(
      'SELECT * FROM menu_options WHERE menu_item_id = $1 ORDER BY option_group, id',
      [id]
    );

    res.json({
      success: true,
      data: {
        ...itemResult.rows[0],
        options: optionsResult.rows
      }
    });
  } catch (error) {
    console.error('Error fetching menu item:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch menu item' });
  }
};

// Get menu items by category
exports.getMenuItemsByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    
    const result = await pool.query(`
      SELECT * FROM menu_items 
      WHERE category_id = $1 AND is_available = true
      ORDER BY is_recommended DESC, sort_order, id
    `, [categoryId]);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching menu by category:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch menu' });
  }
};
