const pool = require('../config/db');

// Validate coupon
exports.validateCoupon = async (req, res) => {
  try {
    const { code, orderTotal, lineUserId } = req.body;

    if (!code) {
      return res.status(400).json({ success: false, error: 'Coupon code is required' });
    }

    // Find coupon
    const couponResult = await pool.query(`
      SELECT * FROM coupons 
      WHERE UPPER(code) = UPPER($1) AND is_active = true
    `, [code]);

    if (couponResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'ไม่พบคูปองนี้ หรือคูปองหมดอายุแล้ว' 
      });
    }

    const coupon = couponResult.rows[0];

    // Check expiry
    if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
      return res.status(400).json({ 
        success: false, 
        error: 'คูปองนี้หมดอายุแล้ว' 
      });
    }

    // Check valid_from
    if (coupon.valid_from && new Date(coupon.valid_from) > new Date()) {
      return res.status(400).json({ 
        success: false, 
        error: 'คูปองนี้ยังไม่เริ่มใช้งาน' 
      });
    }

    // Check max uses
    if (coupon.max_uses && coupon.current_uses >= coupon.max_uses) {
      return res.status(400).json({ 
        success: false, 
        error: 'คูปองนี้ถูกใช้งานครบแล้ว' 
      });
    }

    // Check min order
    if (orderTotal && coupon.min_order > orderTotal) {
      return res.status(400).json({ 
        success: false, 
        error: `ยอดสั่งซื้อขั้นต่ำ ฿${coupon.min_order}` 
      });
    }

    // Check if user already used this coupon (optional)
    if (lineUserId) {
      const usageResult = await pool.query(`
        SELECT id FROM coupon_usages cu
        JOIN users u ON cu.user_id = u.id
        WHERE cu.coupon_id = $1 AND u.line_user_id = $2
      `, [coupon.id, lineUserId]);

      if (usageResult.rows.length > 0) {
        return res.status(400).json({ 
          success: false, 
          error: 'คุณเคยใช้คูปองนี้แล้ว' 
        });
      }
    }

    // Calculate discount
    let discountAmount = 0;
    if (coupon.discount_type === 'percent') {
      discountAmount = (orderTotal || 0) * (coupon.discount_value / 100);
      if (coupon.max_discount) {
        discountAmount = Math.min(discountAmount, coupon.max_discount);
      }
    } else {
      discountAmount = coupon.discount_value;
    }

    res.json({
      success: true,
      data: {
        couponId: coupon.id,
        code: coupon.code,
        description: coupon.description,
        discountType: coupon.discount_type,
        discountValue: coupon.discount_value,
        discountAmount: Math.round(discountAmount * 100) / 100
      }
    });
  } catch (error) {
    console.error('Error validating coupon:', error);
    res.status(500).json({ success: false, error: 'Failed to validate coupon' });
  }
};
