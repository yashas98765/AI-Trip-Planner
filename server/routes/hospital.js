const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  createHospitalBooking,
  getHospitalBookingById,
  getUserHospitalBookings,
  cancelHospitalBooking,
  generateInvoice,
  generateReceipt,
} = require('../controllers/hospitalController');

// Create a new hospital booking
router.post('/book', protect, createHospitalBooking);

// Get all hospital bookings for the authenticated user
router.get('/bookings', protect, getUserHospitalBookings);

// Get a specific hospital booking by ID
router.get('/booking/:id', protect, getHospitalBookingById);

// Cancel a hospital booking
router.patch('/booking/:id/cancel', protect, cancelHospitalBooking);

// Generate and download invoice
router.get('/invoice/:id', protect, generateInvoice);

// Generate and download receipt
router.get('/receipt/:id', protect, generateReceipt);

module.exports = router;
