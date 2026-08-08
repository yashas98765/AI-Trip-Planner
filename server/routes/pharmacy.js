const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  createPharmacyBooking,
  getPharmacyBookingById,
  getUserPharmacyBookings,
  cancelPharmacyBooking,
  generateInvoice,
  generateReceipt,
} = require('../controllers/pharmacyController');

// All routes require authentication
router.use(protect);

// Booking routes
router.post('/book', createPharmacyBooking);
router.get('/bookings', getUserPharmacyBookings);
router.get('/booking/:id', getPharmacyBookingById);
router.patch('/booking/:id/cancel', cancelPharmacyBooking);

// PDF generation routes
router.get('/booking/:id/invoice', generateInvoice);
router.get('/booking/:id/receipt', generateReceipt);

module.exports = router;
