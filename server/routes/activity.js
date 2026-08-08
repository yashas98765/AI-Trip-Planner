const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const activityController = require('../controllers/activityController');

// All routes are protected (require authentication)

// Create activity booking
router.post('/', protect, activityController.createActivityBooking);

// Get all activity bookings for user
router.get('/', protect, activityController.getUserActivityBookings);

// Get single activity booking by ID
router.get('/:id', protect, activityController.getActivityBookingById);

// Update activity booking
router.patch('/:id', protect, activityController.updateActivityBooking);

// Cancel activity booking
router.delete('/:id', protect, activityController.cancelActivityBooking);

// Resend confirmation email
router.post('/:id/resend-email', protect, activityController.resendActivityConfirmation);

module.exports = router;
