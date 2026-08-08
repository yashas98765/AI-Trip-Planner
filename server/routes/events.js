const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  createEventBooking,
  getUserEventBookings,
  getEventBookingById,
  updateEventBooking,
  cancelEventBooking,
  resendEventConfirmation,
} = require('../controllers/eventController');

// All routes require authentication
router.use(protect);

// Booking routes
router.post('/', createEventBooking);
router.get('/', getUserEventBookings);
router.get('/:id', getEventBookingById);
router.patch('/:id', updateEventBooking);
router.delete('/:id', cancelEventBooking);

// Resend confirmation email
router.post('/:id/resend-email', resendEventConfirmation);

module.exports = router;
