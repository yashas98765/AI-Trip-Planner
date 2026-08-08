const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const wellnessController = require('../controllers/wellnessController');

// All routes are protected (require authentication)

// Create wellness booking
router.post('/', protect, wellnessController.createWellnessBooking);

// Get all wellness bookings for user
router.get('/', protect, wellnessController.getUserWellnessBookings);

// Get single wellness booking by ID
router.get('/:id', protect, wellnessController.getWellnessBookingById);

// Update wellness booking status
router.patch('/:id', protect, wellnessController.updateWellnessBooking);

// Cancel wellness booking
router.delete('/:id', protect, wellnessController.cancelWellnessBooking);

// Resend confirmation email
router.post('/:id/resend-email', protect, wellnessController.resendWellnessConfirmation);

module.exports = router;
