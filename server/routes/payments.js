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
