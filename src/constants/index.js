/**
 * Application Constants
 * proper JSDoc type definitions for better IDE support
 */

/**
 * @typedef {Object} OrderStatusConfig
 * @property {string} label - Thai label for the status
 * @property {string} color - Color code or name
 * @property {string} icon - Material icon name
 * @property {string} description - Description for tracking page
 */

/**
 * @type {Object.<string, OrderStatusConfig>}
 */
export const ORDER_STATUS = {
  pending: { label: 'รอยืนยัน', color: 'gray', icon: 'schedule' },
  confirmed: { label: 'ยืนยันแล้ว', color: 'blue', icon: 'check_circle' },
  cooking: { label: 'กำลังปรุง', color: 'orange', icon: 'skillet' },
  ready: { label: 'พร้อมส่ง', color: 'green', icon: 'inventory_2' },
  out_for_delivery: { label: 'กำลังจัดส่ง', color: 'purple', icon: 'two_wheeler' },
  delivered: { label: 'ส่งแล้ว', color: 'green', icon: 'home_pin' },
  completed: { label: 'เสร็จสิ้น', color: 'green', icon: 'done_all' },
  cancelled: { label: 'ยกเลิก', color: 'red', icon: 'cancel' },
};

/**
 * @typedef {Object} DeliveryOption
 * @property {string} id - Option ID
 * @property {string} label - Display label
 * @property {string} icon - Icon name
 * @property {number} price - Base price
 */

/**
 * @type {DeliveryOption[]}
 */
/**
 * @typedef {Object} DeliveryOption
 * @property {string} id - Option ID
 * @property {string} label - Display label
 * @property {string} labelEn - English label
 * @property {number|string} fee - Delivery fee
 * @property {boolean} requiresLocation - If location is required
 */

export const DELIVERY_OPTIONS = {
  pickup: {
    id: 'pickup',
    label: 'รับที่ร้าน / ทานที่ร้าน',
    labelEn: 'Pickup / Dine-in',
    fee: 0,
    requiresLocation: false,
  },
  free_delivery: {
    id: 'free_delivery',
    label: 'ส่งฟรีโดยทางร้าน',
    labelEn: 'Free Delivery by Shop',
    description: 'ภายใน 2 กม.',
    fee: 0,
    maxDistance: 2,
    requiresLocation: true,
  },
  easy_delivery: {
    id: 'easy_delivery',
    label: 'ไรเดอร์ Easy Delivery',
    labelEn: 'Easy Delivery Rider',
    description: 'เกิน 2 กม. (ลูกค้าชำระค่าส่งแยก)',
    fee: 'COD',
    requiresLocation: true,
  },
};

/**
 * Bank Information for payments
 */
export const BANK_INFO = {
  name: "ธนาคารกสิกรไทย (KBank)",
  account: "205-1-21840-0",
  accountName: "ธัญทิพย์ วิชยเจริญพงษ์",
  branch: "สาขาอ่างทอง",
  qrCodeUrl: "/qr-payment.png",
  logoUrl: "/logo.png",
  promptpay: '0812345678', // TODO: Update with real promptpay
};

/**
 * Shop Information
 */
export const SHOP_INFO = {
  name: "ตั้มพานิช",
  phone: "035-611-234",
  address: "ถ.เทศบาล ต.ตลาดหลวง อ.เมือง จ.อ่างทอง 14000",
  lineId: '@tumpanich',
  openTime: '08:00 - 16:00',
  location: {
    lat: 14.58421474875605,
    lng: 100.4287852096075,
  },
  deliveryRadius: 10, // km
  baseDeliveryFee: 0,
  deliveryFeePerKm: 10,
};

/**
 * Error Messages (Thai)
 */
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ กรุณาตรวจสอบอินเทอร์เน็ต',
  TIMEOUT_ERROR: 'การเชื่อมต่อใช้เวลานานเกินไป กรุณาลองใหม่',
  SERVER_ERROR: 'เกิดข้อผิดพลาดที่เซิร์ฟเวอร์',
  AUTH_ERROR: 'เซสชั่นหมดอายุ กรุณาเข้าสู่ระบบใหม่',
  VALIDATION_ERROR: 'ข้อมูลไม่ถูกต้อง กรุณาตรวจสอบข้อมูล',
  RATE_LIMIT_ERROR: 'ทำรายการบ่อยเกินไป กรุณารอสักครู่',
  UNKNOWN_ERROR: 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ',
};
