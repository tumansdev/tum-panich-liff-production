const pool = require('../config/db');

// Register or update user from LINE
exports.registerUser = async (req, res) => {
  try {
    const { lineUserId, displayName, pictureUrl } = req.body;

    if (!lineUserId) {
      return res.status(400).json({ success: false, error: 'LINE user ID is required' });
    }

    // Upsert user
    const result = await pool.query(`
      INSERT INTO users (line_user_id, display_name, picture_url)
      VALUES ($1, $2, $3)
      ON CONFLICT (line_user_id) 
      DO UPDATE SET 
        display_name = EXCLUDED.display_name,
        picture_url = EXCLUDED.picture_url,
        updated_at = NOW()
      RETURNING *
    `, [lineUserId, displayName, pictureUrl]);

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ success: false, error: 'Failed to register user' });
  }
};

// Get user by LINE user ID
exports.getUserByLineId = async (req, res) => {
  try {
    const { lineUserId } = req.params;
    
    const result = await pool.query(
      'SELECT * FROM users WHERE line_user_id = $1',
      [lineUserId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch user' });
  }
};

// Update user profile
exports.updateUser = async (req, res) => {
  try {
    const { lineUserId } = req.params;
    const { phone, email, birthday, dietaryNotes } = req.body;

    const result = await pool.query(`
      UPDATE users 
      SET phone = COALESCE($1, phone),
          email = COALESCE($2, email),
          birthday = COALESCE($3, birthday),
          dietary_notes = COALESCE($4, dietary_notes),
          updated_at = NOW()
      WHERE line_user_id = $5
      RETURNING *
    `, [phone, email, birthday, dietaryNotes, lineUserId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ success: false, error: 'Failed to update user' });
  }
};

// Get user addresses
exports.getUserAddresses = async (req, res) => {
  try {
    const { lineUserId } = req.params;

    const result = await pool.query(`
      SELECT a.* FROM addresses a
      JOIN users u ON a.user_id = u.id
      WHERE u.line_user_id = $1
      ORDER BY a.is_default DESC, a.created_at DESC
    `, [lineUserId]);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching addresses:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch addresses' });
  }
};

// Add user address
exports.addUserAddress = async (req, res) => {
  try {
    const { lineUserId } = req.params;
    const { label, addressLine, latitude, longitude, note, isDefault } = req.body;

    // Get user ID
    const userResult = await pool.query(
      'SELECT id FROM users WHERE line_user_id = $1',
      [lineUserId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const userId = userResult.rows[0].id;

    // If setting as default, unset other defaults
    if (isDefault) {
      await pool.query(
        'UPDATE addresses SET is_default = false WHERE user_id = $1',
        [userId]
      );
    }

    const result = await pool.query(`
      INSERT INTO addresses (user_id, label, address_line, latitude, longitude, note, is_default)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [userId, label, addressLine, latitude, longitude, note, isDefault || false]);

    res.status(201).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error adding address:', error);
    res.status(500).json({ success: false, error: 'Failed to add address' });
  }
};

// Delete user address
exports.deleteUserAddress = async (req, res) => {
  try {
    const { lineUserId, addressId } = req.params;

    const result = await pool.query(`
      DELETE FROM addresses 
      WHERE id = $1 AND user_id = (
        SELECT id FROM users WHERE line_user_id = $2
      )
      RETURNING id
    `, [addressId, lineUserId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Address not found' });
    }

    res.json({
      success: true,
      message: 'Address deleted'
    });
  } catch (error) {
    console.error('Error deleting address:', error);
    res.status(500).json({ success: false, error: 'Failed to delete address' });
  }
};
