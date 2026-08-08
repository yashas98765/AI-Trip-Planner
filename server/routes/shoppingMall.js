const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  createShoppingMallBooking,
  getShoppingMallBookingById,
  getUserShoppingMallBookings,
  cancelShoppingMallBooking,
  generateInvoice,
  generateReceipt,
} = require('../controllers/shoppingMallController');

// @route   POST /api/shopping-mall/book
// @desc    Create shopping mall booking
// @access  Private
router.post('/book', protect, createShoppingMallBooking);

// @route   GET /api/shopping-mall/bookings
// @desc    Get user shopping mall bookings
// @access  Private
router.get('/bookings', protect, getUserShoppingMallBookings);

// @route   GET /api/shopping-mall/booking/:id
// @desc    Get shopping mall booking by ID
// @access  Private
router.get('/booking/:id', protect, getShoppingMallBookingById);

// @route   PATCH /api/shopping-mall/booking/:id/cancel
// @desc    Cancel shopping mall booking
// @access  Private
router.patch('/booking/:id/cancel', protect, cancelShoppingMallBooking);

// @route   GET /api/shopping-mall/invoice/:id
// @desc    Generate invoice PDF
// @access  Private
router.get('/invoice/:id', protect, generateInvoice);

// @route   GET /api/shopping-mall/receipt/:id
// @desc    Generate receipt PDF
// @access  Private
router.get('/receipt/:id', protect, generateReceipt);

module.exports = router;
