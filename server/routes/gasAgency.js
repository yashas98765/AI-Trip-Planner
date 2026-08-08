const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  createGasAgencyBooking,
  getGasAgencyBookingById,
  getUserGasAgencyBookings,
  cancelGasAgencyBooking,
  generateInvoice,
  generateReceipt,
} = require('../controllers/gasAgencyController');

// All routes require authentication
router.use(protect);

// @route   POST /api/gas-agency/book
// @desc    Create gas agency cylinder booking
// @access  Private
router.post('/book', createGasAgencyBooking);

// @route   GET /api/gas-agency/bookings
// @desc    Get all gas agency bookings for logged-in user
// @access  Private
router.get('/bookings', getUserGasAgencyBookings);

// @route   GET /api/gas-agency/booking/:id
// @desc    Get single gas agency booking by ID
// @access  Private
router.get('/booking/:id', getGasAgencyBookingById);

// @route   PATCH /api/gas-agency/booking/:id/cancel
// @desc    Cancel gas agency booking
// @access  Private
router.patch('/booking/:id/cancel', cancelGasAgencyBooking);

// @route   GET /api/gas-agency/invoice/:id
// @desc    Generate and download invoice PDF
// @access  Private
router.get('/invoice/:id', generateInvoice);

// @route   GET /api/gas-agency/receipt/:id
// @desc    Generate and download payment receipt PDF
// @access  Private
router.get('/receipt/:id', generateReceipt);

module.exports = router;
