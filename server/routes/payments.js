const express = require('express');
const {
  createPaymentOrder,
  verifyPayment,
  getPaymentDetails,
  initiateRefund,
} = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Public debug endpoint — verify Razorpay keys are loaded
router.get('/test-keys', (req, res) => {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  res.json({
    keyIdSet: !!keyId,
    keyIdPrefix: keyId ? keyId.substring(0, 12) + '...' : 'NOT SET',
    keySecretSet: !!keySecret,
    keySecretPrefix: keySecret ? keySecret.substring(0, 4) + '...' : 'NOT SET',
    nodeEnv: process.env.NODE_ENV,
  });
});

// Public debug endpoint — actually create a ₹1 test order to verify Razorpay works
router.get('/test-order', async (req, res) => {
  try {
    const Razorpay = require('razorpay');
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) {
      return res.json({ success: false, error: 'Keys not set' });
    }
    const client = new Razorpay({ key_id: keyId, key_secret: keySecret });
    const order = await client.orders.create({
      amount: 100, // ₹1 in paise
      currency: 'INR',
      receipt: `test_${Date.now()}`,
    });
    res.json({ success: true, orderId: order.id, amount: order.amount, status: order.status });
  } catch (error) {
    res.json({
      success: false,
      error: error.message,
      statusCode: error.statusCode,
      razorpayError: error.error || null,
    });
  }
});

// All routes below require authentication
router.use(protect);

// Create payment order
router.post('/create-order', createPaymentOrder);

// Verify payment
router.post('/verify', verifyPayment);

// Get payment details
router.get('/:paymentId', getPaymentDetails);

// Initiate refund
router.post('/refund', initiateRefund);

module.exports = router;
