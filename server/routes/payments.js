const express = require('express');
const {
  createPaymentOrder,
  verifyPayment,
  getPaymentDetails,
  initiateRefund,
} = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
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
