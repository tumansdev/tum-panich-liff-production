const pool = require('../config/db');
const { notifyNewOrder } = require('../websocket');

// Generate order number
function generateOrderNumber() {
  const prefix = 'TP';
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `${prefix}-${timestamp}${random}`.substring(0, 12);
}

// Create new order
exports.createOrder = async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const {
      lineUserId,
      items,
      deliveryType,
      deliveryAddress,
      deliveryLat,
      deliveryLng,
      deliveryDistance,
      deliveryNote,
      subtotal,
      deliveryFee,
      discount,
      total,
      couponId
    } = req.body;

    // Get or create user
    let userResult = await client.query(
      'SELECT id FROM users WHERE line_user_id = $1',
      [lineUserId]
    );

    let userId = userResult.rows[0]?.id;

    if (!userId) {
      const newUser = await client.query(
        'INSERT INTO users (line_user_id) VALUES ($1) RETURNING id',
        [lineUserId]
      );
      userId = newUser.rows[0].id;
    }

    // Create order
    const orderNumber = generateOrderNumber();
    const orderResult = await client.query(`
      INSERT INTO orders (
        order_number, user_id, delivery_type, delivery_address,
        delivery_lat, delivery_lng, delivery_distance, delivery_note,
        subtotal, delivery_fee, discount, total, coupon_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `, [
      orderNumber, userId, deliveryType, deliveryAddress,
      deliveryLat, deliveryLng, deliveryDistance, deliveryNote,
      subtotal, deliveryFee || 0, discount || 0, total, couponId
    ]);

    const orderId = orderResult.rows[0].id;

    // Create order items
    for (const item of items) {
      await client.query(`
        INSERT INTO order_items (
          order_id, menu_item_id, name, price, quantity, subtotal, options, note
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [
        orderId,
        item.menuItemId,
        item.name,
        item.price,
        item.quantity,
        item.price * item.quantity,
        JSON.stringify(item.options || []),
        item.note
      ]);

      // Update order count
      await client.query(
        'UPDATE menu_items SET order_count = order_count + $1 WHERE id = $2',
        [item.quantity, item.menuItemId]
      );
    }

    // Update coupon usage if used
    if (couponId) {
      await client.query(
        'UPDATE coupons SET current_uses = current_uses + 1 WHERE id = $1',
        [couponId]
      );
      await client.query(
        'INSERT INTO coupon_usages (coupon_id, user_id, order_id) VALUES ($1, $2, $3)',
        [couponId, userId, orderId]
      );
    }

    // Create notification for admin
    await client.query(`
      INSERT INTO notifications (type, title, message, order_id)
      VALUES ('new_order', 'ออเดอร์ใหม่!', $1, $2)
    `, [`ออเดอร์ #${orderNumber} - ฿${total}`, orderId]);

    await client.query('COMMIT');

    // Notify admin via WebSocket about new order
    try {
      notifyNewOrder({
        orderNumber,
        orderId,
        total,
        deliveryType,
        itemCount: items.length,
      });
    } catch (wsError) {
      console.error('WebSocket notification error:', wsError);
      // Don't fail the order if WebSocket fails
    }

    res.status(201).json({
      success: true,
      data: {
        orderNumber,
        orderId,
        total
      }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating order:', error);
    res.status(500).json({ success: false, error: 'Failed to create order' });
  } finally {
    client.release();
  }
};

// Get order by order number
exports.getOrderByNumber = async (req, res) => {
  try {
    const { orderNumber } = req.params;
    
    const orderResult = await pool.query(`
      SELECT o.*, u.display_name, u.phone
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      WHERE o.order_number = $1
    `, [orderNumber]);

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    const order = orderResult.rows[0];

    // Get order items
    const itemsResult = await pool.query(
      'SELECT * FROM order_items WHERE order_id = $1',
      [order.id]
    );

    res.json({
      success: true,
      data: {
        ...order,
        items: itemsResult.rows
      }
    });
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch order' });
  }
};

// Get orders by user
exports.getOrdersByUser = async (req, res) => {
  try {
    const { lineUserId } = req.params;
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;

    const result = await pool.query(`
      SELECT o.*
      FROM orders o
      JOIN users u ON o.user_id = u.id
      WHERE u.line_user_id = $1
      ORDER BY o.created_at DESC
      LIMIT $2 OFFSET $3
    `, [lineUserId, limit, offset]);

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
    console.error('Error fetching orders:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch orders' });
  }
};

// Upload slip
exports.uploadSlip = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    const slipUrl = `/uploads/slips/${req.file.filename}`;

    await pool.query(
      'UPDATE orders SET slip_image_url = $1, payment_status = $2, updated_at = NOW() WHERE id = $3',
      [slipUrl, 'pending_verification', id]
    );

    // Create notification for admin
    const orderResult = await pool.query('SELECT order_number FROM orders WHERE id = $1', [id]);
    await pool.query(`
      INSERT INTO notifications (type, title, message, order_id)
      VALUES ('payment_received', 'แจ้งโอนเงิน', $1, $2)
    `, [`ออเดอร์ #${orderResult.rows[0]?.order_number} แนบสลิปแล้ว`, id]);

    res.json({
      success: true,
      data: { slipUrl }
    });
  } catch (error) {
    console.error('Error uploading slip:', error);
    res.status(500).json({ success: false, error: 'Failed to upload slip' });
  }
};

// Get order tracking
exports.getOrderTracking = async (req, res) => {
  try {
    const { id } = req.params;
    
    // ใช้ order_number เป็นหลัก (text) เพราะ frontend ส่งมาเป็น order_number
    // ถ้าต้องการค้นหาด้วย id (integer) ให้ตรวจสอบว่าเป็นตัวเลขก่อน
    const isNumeric = /^\d+$/.test(id);
    
    const result = await pool.query(`
      SELECT 
        order_number, status, delivery_type, estimated_time,
        rider_name, rider_phone,
        created_at, confirmed_at, cooking_at, ready_at, delivered_at
      FROM orders WHERE ${isNumeric ? 'id = $1::integer OR' : ''} order_number = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    const order = result.rows[0];
    
    // Build timeline
    const timeline = [
      { step: 'pending', label: 'รอยืนยัน', time: order.created_at, completed: true },
      { step: 'confirmed', label: 'ยืนยันแล้ว', time: order.confirmed_at, completed: !!order.confirmed_at },
      { step: 'cooking', label: 'กำลังปรุง', time: order.cooking_at, completed: !!order.cooking_at },
      { step: 'ready', label: 'พร้อมส่ง', time: order.ready_at, completed: !!order.ready_at },
      { step: 'delivered', label: 'ส่งแล้ว', time: order.delivered_at, completed: !!order.delivered_at }
    ];

    res.json({
      success: true,
      data: {
        ...order,
        timeline
      }
    });
  } catch (error) {
    console.error('Error fetching tracking:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch tracking' });
  }
};
