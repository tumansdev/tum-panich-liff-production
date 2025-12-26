/**
 * Input Validation Middleware
 * Uses Zod schemas to validate request data
 */

const { z } = require('zod');

// ==================== SCHEMAS ====================

// Order item schema
const orderItemSchema = z.object({
  menuItemId: z.number().int().positive(),
  name: z.string().min(1).max(200),
  price: z.number().min(0),
  quantity: z.number().int().min(1).max(100),
  note: z.string().max(500).nullable().optional(),
  options: z.array(z.any()).optional().default([]),
});

// Create order schema
const createOrderSchema = z.object({
  lineUserId: z.string().min(1).max(100),
  items: z.array(orderItemSchema).min(1).max(50),
  deliveryType: z.enum(['pickup', 'free_delivery', 'easy_delivery']),
  deliveryAddress: z.string().max(500).nullable().optional(),
  deliveryLat: z.number().min(-90).max(90).nullable().optional(),
  deliveryLng: z.number().min(-180).max(180).nullable().optional(),
  deliveryDistance: z.number().min(0).max(100).nullable().optional(),
  deliveryNote: z.string().max(500).nullable().optional(),
  subtotal: z.number().min(0),
  deliveryFee: z.number().min(0).optional().default(0),
  discount: z.number().min(0).optional().default(0),
  total: z.number().min(0),
  couponId: z.number().int().positive().nullable().optional(),
});

// User registration schema
const registerUserSchema = z.object({
  lineUserId: z.string().min(1).max(100),
  displayName: z.string().max(200).optional(),
  pictureUrl: z.string().url().max(1000).optional(),
});

// Update user schema
const updateUserSchema = z.object({
  displayName: z.string().max(200).optional(),
  phone: z.string().max(20).optional(),
  email: z.string().email().max(100).optional(),
  birthday: z.string().optional(),
  dietaryNotes: z.string().max(500).optional(),
});

// Coupon validation schema
const validateCouponSchema = z.object({
  code: z.string().min(1).max(50),
  orderTotal: z.number().min(0),
  lineUserId: z.string().min(1).max(100).optional(),
});

// Admin login schema
const adminLoginSchema = z.object({
  username: z.string().min(1).max(50),
  password: z.string().min(1).max(200),
});

// Order status update schema
const updateOrderStatusSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'cooking', 'ready', 'out_for_delivery', 'delivered', 'completed', 'cancelled']),
  estimatedTime: z.number().int().min(0).max(180).optional(),
  riderName: z.string().max(100).optional(),
  riderPhone: z.string().max(20).optional(),
});

// ==================== MIDDLEWARE ====================

/**
 * Creates a validation middleware for the given schema
 * @param {z.ZodSchema} schema - Zod schema to validate against
 * @param {string} source - Where to get data from ('body', 'query', 'params')
 */
function validate(schema, source = 'body') {
  return (req, res, next) => {
    try {
      const data = req[source];
      const result = schema.safeParse(data);

      if (!result.success) {
        const errors = result.error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors,
        });
      }

      // Replace request data with parsed (and sanitized) data
      req[source] = result.data;
      next();
    } catch (error) {
      console.error('Validation error:', error);
      return res.status(400).json({
        success: false,
        error: 'Invalid request data',
        debug: error.message, // Add debug info
      });
    }
  };
}

// ==================== EXPORTS ====================

module.exports = {
  // Schemas
  schemas: {
    createOrder: createOrderSchema,
    registerUser: registerUserSchema,
    updateUser: updateUserSchema,
    validateCoupon: validateCouponSchema,
    adminLogin: adminLoginSchema,
    updateOrderStatus: updateOrderStatusSchema,
  },

  // Middleware factory
  validate,

  // Pre-built middleware
  validateCreateOrder: validate(createOrderSchema),
  validateRegisterUser: validate(registerUserSchema),
  validateUpdateUser: validate(updateUserSchema),
  validateCoupon: validate(validateCouponSchema),
  validateAdminLogin: validate(adminLoginSchema),
  validateUpdateOrderStatus: validate(updateOrderStatusSchema),
};
