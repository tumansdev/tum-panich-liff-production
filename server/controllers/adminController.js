const pool = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { broadcastOrderUpdate, notifyAdminOrderUpdate } = require('../websocket');

// Admin login
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    const result = await pool.query(
      'SELECT * FROM admin_users WHERE username = $1 AND is_active = true',
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const admin = result.rows[0];
    const validPassword = await bcrypt.compare(password, admin.password_hash);

    if (!validPassword) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    // Update last login
    await pool.query(
      'UPDATE admin_users SET last_login = NOW() WHERE id = $1',
      [admin.id]
    );

    const token = jwt.sign(
      { id: admin.id, username: admin.username, role: admin.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      data: {
        token,
        admin: {
          id: admin.id,
          username: admin.username,
          displayName: admin.display_name,
          role: admin.role
        }
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, error: 'Login failed' });
  }
};

// Get dashboard summary
exports.getDashboard = async (req, res) => {
  try {
    // Today's stats
    const todayResult = await pool.query(`
      SELECT 
        COUNT(*) as order_count,
        COALESCE(SUM(total), 0) as total_revenue
      FROM orders 
      WHERE DATE(created_at) = CURRENT_DATE
        AND status != 'cancelled'
    `);

    // Pending orders count
    const pendingResult = await pool.query(`
      SELECT COUNT(*) as count FROM orders 
      WHERE status IN ('pending', 'confirmed', 'cooking')
    `);

    // Today's orders by status
    const statusResult = await pool.query(`
      SELECT status, COUNT(*) as count
      FROM orders 
      WHERE DATE(created_at) = CURRENT_DATE
      GROUP BY status
    `);

    // Top selling items today
    const topItemsResult = await pool.query(`
      SELECT oi.name, SUM(oi.quantity) as quantity
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      WHERE DATE(o.created_at) = CURRENT_DATE
        AND o.status != 'cancelled'
      GROUP BY oi.name
      ORDER BY quantity DESC
      LIMIT 5
    `);

    res.json({
      success: true,
      data: {
        today: {
          orders: parseInt(todayResult.rows[0].order_count),
          revenue: parseFloat(todayResult.rows[0].total_revenue)
        },
        pendingOrders: parseInt(pendingResult.rows[0].count),
        statusBreakdown: statusResult.rows,
        topItems: topItemsResult.rows
      }
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ success: false, error: 'Failed to load dashboard' });
  }
};

// Get notifications
exports.getNotifications = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    
    const result = await pool.query(`
      SELECT * FROM notifications 
      ORDER BY created_at DESC 
      LIMIT $1
    `, [limit]);

    // Get unread count
    const unreadResult = await pool.query(
      'SELECT COUNT(*) as count FROM notifications WHERE is_read = false'
    );

    res.json({
      success: true,
      data: {
        notifications: result.rows,
        unreadCount: parseInt(unreadResult.rows[0].count)
      }
    });
  } catch (error) {
    console.error('Notifications error:', error);
    res.status(500).json({ success: false, error: 'Failed to load notifications' });
  }
};

// Get orders (admin)
exports.getOrders = async (req, res) => {
  try {
    const { status, date, limit = 50, offset = 0 } = req.query;
    
    let query = `
      SELECT o.*, u.display_name, u.phone, u.line_user_id
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (status) {
      query += ` AND o.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (date) {
      query += ` AND DATE(o.created_at) = $${paramIndex}`;
      params.push(date);
      paramIndex++;
    }

    query += ` ORDER BY o.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    // Get items for each order
    const orders = await Promise.all(result.rows.map(async (order) => {
      const itemsResult = await pool.query(
        'SELECT * FROM order_items WHERE order_id = $1',
        [order.id]
      );
      return { ...order, items: itemsResult.rows };
    }));

    res.json({
      success: true,
      data: orders
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ success: false, error: 'Failed to load orders' });
  }
};

// Update order status
exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, estimatedTime, riderName, riderPhone } = req.body;

    // Build update query
    let updates = ['status = $1', 'updated_at = NOW()'];
    let params = [status];
    let paramIndex = 2;

    // Set timestamp based on status
    const statusTimestamps = {
      confirmed: 'confirmed_at',
      cooking: 'cooking_at',
      ready: 'ready_at',
      delivered: 'delivered_at'
    };

    if (statusTimestamps[status]) {
      updates.push(`${statusTimestamps[status]} = NOW()`);
    }

    if (estimatedTime) {
      updates.push(`estimated_time = $${paramIndex}`);
      params.push(estimatedTime);
      paramIndex++;
    }

    if (riderName) {
      updates.push(`rider_name = $${paramIndex}`);
      params.push(riderName);
      paramIndex++;
    }

    if (riderPhone) {
      updates.push(`rider_phone = $${paramIndex}`);
      params.push(riderPhone);
      paramIndex++;
    }

    // If confirmed, update payment status to paid
    if (status === 'confirmed') {
      updates.push(`payment_status = 'paid'`);
    }

    params.push(id);
    const query = `UPDATE orders SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`;

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    const updatedOrder = result.rows[0];

    // Broadcast status update via WebSocket
    try {
      const orderData = {
        status,
        order_number: updatedOrder.order_number,
        estimated_time: updatedOrder.estimated_time,
        rider_name: updatedOrder.rider_name,
        rider_phone: updatedOrder.rider_phone,
      };
      
      // Notify customers subscribed to this order
      broadcastOrderUpdate(updatedOrder.order_number, orderData);
      
      // Notify all admin clients
      notifyAdminOrderUpdate(updatedOrder.order_number, status, orderData);
    } catch (wsError) {
      console.error('WebSocket broadcast error:', wsError);
      // Don't fail the request if WebSocket fails
    }

    res.json({
      success: true,
      data: updatedOrder
    });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ success: false, error: 'Failed to update order status' });
  }
};

// Get all menu (admin - including unavailable)
exports.getAllMenu = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT m.*, c.name as category_name
      FROM menu_items m
      LEFT JOIN categories c ON m.category_id = c.id
      ORDER BY m.category_id, m.sort_order, m.id
    `);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Get menu error:', error);
    res.status(500).json({ success: false, error: 'Failed to load menu' });
  }
};

// Create menu item
exports.createMenuItem = async (req, res) => {
  try {
    const {
      name, nameEn, description, price, imageUrl,
      categoryId, isAvailable, isRecommended, isSpicy, isVegan
    } = req.body;

    const result = await pool.query(`
      INSERT INTO menu_items (
        name, name_en, description, price, image_url,
        category_id, is_available, is_recommended, is_spicy, is_vegan
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `, [name, nameEn, description, price, imageUrl,
        categoryId, isAvailable ?? true, isRecommended ?? false, 
        isSpicy ?? false, isVegan ?? false]);

    res.status(201).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Create menu error:', error);
    res.status(500).json({ success: false, error: 'Failed to create menu item' });
  }
};

// Update menu item
exports.updateMenuItem = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Build dynamic update query
    const fields = [];
    const values = [];
    let paramIndex = 1;

    const allowedFields = [
      'name', 'name_en', 'description', 'price', 'image_url',
      'category_id', 'is_available', 'is_recommended', 'is_spicy', 'is_vegan', 'sort_order'
    ];

    for (const [key, value] of Object.entries(updates)) {
      const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      if (allowedFields.includes(snakeKey)) {
        fields.push(`${snakeKey} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    }

    if (fields.length === 0) {
      return res.status(400).json({ success: false, error: 'No valid fields to update' });
    }

    values.push(id);
    const query = `UPDATE menu_items SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
    
    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Menu item not found' });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Update menu error:', error);
    res.status(500).json({ success: false, error: 'Failed to update menu item' });
  }
};

// Delete menu item
exports.deleteMenuItem = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM menu_items WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Menu item not found' });
    }

    res.json({
      success: true,
      message: 'Menu item deleted'
    });
  } catch (error) {
    console.error('Delete menu error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete menu item' });
  }
};

// Get coupons
exports.getCoupons = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM coupons ORDER BY created_at DESC'
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Get coupons error:', error);
    res.status(500).json({ success: false, error: 'Failed to load coupons' });
  }
};

// Create coupon
exports.createCoupon = async (req, res) => {
  try {
    const {
      code, description, discountType, discountValue,
      minOrder, maxDiscount, maxUses, validFrom, expiresAt
    } = req.body;

    const result = await pool.query(`
      INSERT INTO coupons (
        code, description, discount_type, discount_value,
        min_order, max_discount, max_uses, valid_from, expires_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `, [code.toUpperCase(), description, discountType, discountValue,
        minOrder || 0, maxDiscount, maxUses, validFrom, expiresAt]);

    res.status(201).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Create coupon error:', error);
    if (error.code === '23505') {
      return res.status(400).json({ success: false, error: 'Coupon code already exists' });
    }
    res.status(500).json({ success: false, error: 'Failed to create coupon' });
  }
};

// Update coupon
exports.updateCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive, expiresAt, maxUses } = req.body;

    const result = await pool.query(`
      UPDATE coupons 
      SET is_active = COALESCE($1, is_active),
          expires_at = COALESCE($2, expires_at),
          max_uses = COALESCE($3, max_uses)
      WHERE id = $4
      RETURNING *
    `, [isActive, expiresAt, maxUses, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Coupon not found' });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Update coupon error:', error);
    res.status(500).json({ success: false, error: 'Failed to update coupon' });
  }
};

// Get daily report
exports.getDailyReport = async (req, res) => {
  try {
    const { date } = req.query;
    const targetDate = date || new Date().toISOString().split('T')[0];

    // Orders summary
    const summaryResult = await pool.query(`
      SELECT 
        COUNT(*) as total_orders,
        COUNT(*) FILTER (WHERE status = 'completed') as completed_orders,
        COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_orders,
        COALESCE(SUM(total) FILTER (WHERE status != 'cancelled'), 0) as total_revenue,
        COALESCE(SUM(discount) FILTER (WHERE status != 'cancelled'), 0) as total_discount
      FROM orders
      WHERE DATE(created_at) = $1
    `, [targetDate]);

    // Orders by hour
    const hourlyResult = await pool.query(`
      SELECT 
        EXTRACT(HOUR FROM created_at) as hour,
        COUNT(*) as order_count,
        COALESCE(SUM(total), 0) as revenue
      FROM orders
      WHERE DATE(created_at) = $1 AND status != 'cancelled'
      GROUP BY EXTRACT(HOUR FROM created_at)
      ORDER BY hour
    `, [targetDate]);

    // Top selling items
    const topItemsResult = await pool.query(`
      SELECT 
        oi.name,
        SUM(oi.quantity) as quantity,
        SUM(oi.subtotal) as revenue
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      WHERE DATE(o.created_at) = $1 AND o.status != 'cancelled'
      GROUP BY oi.name
      ORDER BY quantity DESC
      LIMIT 10
    `, [targetDate]);

    // Delivery breakdown
    const deliveryResult = await pool.query(`
      SELECT 
        delivery_type,
        COUNT(*) as count,
        COALESCE(SUM(total), 0) as revenue
      FROM orders
      WHERE DATE(created_at) = $1 AND status != 'cancelled'
      GROUP BY delivery_type
    `, [targetDate]);

    res.json({
      success: true,
      data: {
        date: targetDate,
        summary: summaryResult.rows[0],
        hourly: hourlyResult.rows,
        topItems: topItemsResult.rows,
        deliveryBreakdown: deliveryResult.rows
      }
    });
  } catch (error) {
    console.error('Daily report error:', error);
    res.status(500).json({ success: false, error: 'Failed to generate report' });
  }
};

// Get summary report (last 7 days)
exports.getSummaryReport = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as order_count,
        COALESCE(SUM(total), 0) as revenue
      FROM orders
      WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
        AND status != 'cancelled'
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Summary report error:', error);
    res.status(500).json({ success: false, error: 'Failed to generate report' });
  }
};

// Mark notification as read
exports.markNotificationRead = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      'UPDATE notifications SET is_read = true WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Notification not found' });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Mark notification error:', error);
    res.status(500).json({ success: false, error: 'Failed to update notification' });
  }
};

// Mark all notifications as read
exports.markAllNotificationsRead = async (req, res) => {
  try {
    const result = await pool.query(
      'UPDATE notifications SET is_read = true WHERE is_read = false RETURNING id'
    );

    res.json({
      success: true,
      data: { updatedCount: result.rowCount }
    });
  } catch (error) {
    console.error('Mark all notifications error:', error);
    res.status(500).json({ success: false, error: 'Failed to update notifications' });
  }
};

// Verify payment (approve/reject slip)
exports.verifyPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, notes } = req.body; // action: 'approve' or 'reject'

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ success: false, error: 'Invalid action' });
    }

    const paymentStatus = action === 'approve' ? 'paid' : 'rejected';
    const orderStatus = action === 'approve' ? 'confirmed' : 'pending';

    let updates = [
      `payment_status = '${paymentStatus}'`,
      'updated_at = NOW()'
    ];

    if (action === 'approve') {
      updates.push('confirmed_at = NOW()');
      updates.push(`status = '${orderStatus}'`);
    }

    if (notes) {
      updates.push(`delivery_note = COALESCE(delivery_note, '') || ' [Payment: ${notes}]'`);
    }

    const result = await pool.query(
      `UPDATE orders SET ${updates.join(', ')} WHERE id = $1 RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    // Create notification
    const order = result.rows[0];
    await pool.query(`
      INSERT INTO notifications (type, title, message, order_id)
      VALUES ($1, $2, $3, $4)
    `, [
      action === 'approve' ? 'payment_approved' : 'payment_rejected',
      action === 'approve' ? 'ยืนยันการชำระเงิน' : 'ปฏิเสธการชำระเงิน',
      `ออเดอร์ #${order.order_number}`,
      id
    ]);

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({ success: false, error: 'Failed to verify payment' });
  }
};

// Get order with slip details
exports.getOrderSlip = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(`
      SELECT id, order_number, slip_image_url, payment_status, total, created_at
      FROM orders WHERE id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Get slip error:', error);
    res.status(500).json({ success: false, error: 'Failed to get slip' });
  }
};
// Upload menu image
exports.uploadMenuImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    const imageUrl = `/uploads/menu/${req.file.filename}`;

    res.json({
      success: true,
      data: { imageUrl }
    });
  } catch (error) {
    console.error('Upload menu image error:', error);
    res.status(500).json({ success: false, error: 'Failed to upload image' });
  }
};
