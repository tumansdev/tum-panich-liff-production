const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { liffAuth, verifyOwner } = require('../middleware/liffAuth');

// POST /api/users/register - Register or update user from LINE (no auth needed)
router.post('/register', userController.registerUser);

// Protected routes - require LIFF auth and owner verification
router.use(liffAuth);

// GET /api/users/:lineUserId - Get user by LINE user ID
router.get('/:lineUserId', verifyOwner('lineUserId'), userController.getUserByLineId);

// PATCH /api/users/:lineUserId - Update user profile
router.patch('/:lineUserId', verifyOwner('lineUserId'), userController.updateUser);

// GET /api/users/:lineUserId/addresses - Get user addresses
router.get('/:lineUserId/addresses', verifyOwner('lineUserId'), userController.getUserAddresses);

// POST /api/users/:lineUserId/addresses - Add new address
router.post('/:lineUserId/addresses', verifyOwner('lineUserId'), userController.addUserAddress);

// DELETE /api/users/:lineUserId/addresses/:addressId - Delete address
router.delete('/:lineUserId/addresses/:addressId', verifyOwner('lineUserId'), userController.deleteUserAddress);

module.exports = router;
