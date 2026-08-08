const Booking = require("../models/Booking");
const { validationResult } = require("express-validator");
const { logger } = require("../middleware/logging");
const { sendBookingConfirmation } = require("../utils/emailService");

// @desc    Create new booking
// @route   POST /api/bookings
// @access  Private
const createBooking = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const bookingData = {
      ...req.body,
      user: req.user._id,
    };

    // Ensure pricing object exists with defaults
    if (!bookingData.pricing) {
      bookingData.pricing = {
        basePrice: 1000,
        taxes: 180,
        serviceFee: 50,
        totalPrice: 1230,
        currency: 'INR'
      };
    }

    // Calculate total price if not provided
    if (!bookingData.pricing.totalPrice) {
      const { basePrice = 1000, taxes = 0, serviceFee = 0, discount = 0 } = bookingData.pricing;
      bookingData.pricing.totalPrice =
        basePrice + taxes + serviceFee - discount;
    }

    console.log('Creating booking with data:', JSON.stringify(bookingData, null, 2));
    const booking = await Booking.create(bookingData);

    logger.info(`New booking created: ${booking.bookingReference} by user ${req.user._id}`);

    // Send confirmation email
    try {
      const emailResult = await sendBookingConfirmation(
        req.user.email,
        req.user.name || req.user.email,
        booking.toObject()
      );
      
      if (emailResult.success) {
        logger.info(`Confirmation email sent for booking ${booking.bookingReference}`);
      } else {
        logger.warn(`Failed to send confirmation email for booking ${booking.bookingReference}: ${emailResult.error}`);
      }
    } catch (emailError) {
      // Don't fail the booking if email fails
      logger.error(`Error sending confirmation email for booking ${booking.bookingReference}:`, emailError);
    }

    res.status(201).json({
      success: true,
      message: "Booking created successfully",
      data: booking,
    });
  } catch (error) {
    logger.error("Error creating booking:", error);
    
    // Handle MongoDB validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', '),
        error: error.message,
      });
    }
    
    res.status(500).json({
      success: false,
      message: error.message || "Failed to create booking",
      error: error.message,
    });
  }
};

// @desc    Get all bookings for logged-in user
// @route   GET /api/bookings
// @access  Private
const getUserBookings = async (req, res) => {
  try {
    const { status, bookingType, page = 1, limit = 100 } = req.query;

    const options = {};
    if (status) options.status = status;
    if (bookingType) options.bookingType = bookingType;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const bookings = await Booking.find({
      user: req.user._id,
      ...options,
    })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip)
      .populate("trip", "title destination startDate endDate");

    const total = await Booking.countDocuments({
      user: req.user._id,
      ...options,
    });

    res.status(200).json({
      success: true,
      data: bookings,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    logger.error("Error fetching user bookings:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch bookings",
      error: error.message,
    });
  }
};

// @desc    Get upcoming bookings
// @route   GET /api/bookings/upcoming
// @access  Private
const getUpcomingBookings = async (req, res) => {
  try {
    const bookings = await Booking.getUpcomingBookings(req.user._id);

    res.status(200).json({
      success: true,
      data: bookings,
      count: bookings.length,
    });
  } catch (error) {
    logger.error("Error fetching upcoming bookings:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch upcoming bookings",
      error: error.message,
    });
  }
};

// @desc    Get past bookings
// @route   GET /api/bookings/past
// @access  Private
const getPastBookings = async (req, res) => {
  try {
    const now = new Date();
    const bookings = await Booking.find({
      user: req.user._id,
      status: { $in: ["completed", "cancelled"] },
      $or: [
        { checkOutDate: { $lt: now } },
        { departureDate: { $lt: now } },
        { bookingDate: { $lt: now } },
      ],
    })
      .sort({ checkOutDate: -1, departureDate: -1, bookingDate: -1 })
      .populate("trip", "title destination");

    res.status(200).json({
      success: true,
      data: bookings,
      count: bookings.length,
    });
  } catch (error) {
    logger.error("Error fetching past bookings:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch past bookings",
      error: error.message,
    });
  }
};

// @desc    Get single booking by ID
// @route   GET /api/bookings/:id
// @access  Private
const getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate("user", "name email phone")
      .populate("trip", "title destination startDate endDate itinerary");

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // Check if booking belongs to user
    if (booking.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view this booking",
      });
    }

    res.status(200).json({
      success: true,
      data: booking,
    });
  } catch (error) {
    logger.error("Error fetching booking:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch booking",
      error: error.message,
    });
  }
};

// @desc    Get booking by reference number
// @route   GET /api/bookings/reference/:reference
// @access  Private
const getBookingByReference = async (req, res) => {
  try {
    const booking = await Booking.findOne({
      bookingReference: req.params.reference,
    })
      .populate("user", "name email phone")
      .populate("trip", "title destination startDate endDate");

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // Check if booking belongs to user
    if (booking.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view this booking",
      });
    }

    res.status(200).json({
      success: true,
      data: booking,
    });
  } catch (error) {
    logger.error("Error fetching booking by reference:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch booking",
      error: error.message,
    });
  }
};

// @desc    Update booking
// @route   PUT /api/bookings/:id
// @access  Private
const updateBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // Check if booking belongs to user
    if (booking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this booking",
      });
    }

    // Prevent updating certain fields
    const allowedUpdates = [
      "numberOfGuests",
      "guestDetails",
      "specialRequests",
      "preferences",
      "notes",
    ];

    const updates = {};
    Object.keys(req.body).forEach((key) => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    Object.assign(booking, updates);
    await booking.save();

    logger.info(`Booking updated: ${booking.bookingReference}`);

    res.status(200).json({
      success: true,
      message: "Booking updated successfully",
      data: booking,
    });
  } catch (error) {
    logger.error("Error updating booking:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update booking",
      error: error.message,
    });
  }
};

// @desc    Cancel booking
// @route   PATCH /api/bookings/:id/cancel
// @access  Private
const cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // Check if booking belongs to user
    if (booking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to cancel this booking",
      });
    }

    if (!booking.isCancellable) {
      return res.status(400).json({
        success: false,
        message: "This booking is not cancellable",
      });
    }

    if (booking.status === "cancelled") {
      return res.status(400).json({
        success: false,
        message: "Booking is already cancelled",
      });
    }

    const { reason } = req.body;

    booking.status = "cancelled";
    booking.cancellationDate = new Date();
    booking.cancellationReason = reason || "User requested cancellation";

    // Calculate refund amount (example: 80% if cancelled more than 24h before)
    const now = new Date();
    const relevantDate = booking.checkInDate || booking.departureDate || booking.bookingDate;
    const hoursDifference = (relevantDate - now) / (1000 * 60 * 60);

    if (hoursDifference > 24) {
      booking.refundAmount = booking.pricing.totalPrice * 0.8; // 80% refund
      booking.paymentStatus = "refunded";
    } else if (hoursDifference > 0) {
      booking.refundAmount = booking.pricing.totalPrice * 0.5; // 50% refund
      booking.paymentStatus = "partially_refunded";
    } else {
      booking.refundAmount = 0; // No refund for past bookings
    }

    await booking.save();

    logger.info(`Booking cancelled: ${booking.bookingReference}`);

    res.status(200).json({
      success: true,
      message: "Booking cancelled successfully",
      data: {
        booking,
        refundAmount: booking.refundAmount,
      },
    });
  } catch (error) {
    logger.error("Error cancelling booking:", error);
    res.status(500).json({
      success: false,
      message: "Failed to cancel booking",
      error: error.message,
    });
  }
};

// @desc    Update booking status
// @route   PATCH /api/bookings/:id/status
// @access  Private
const updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!["pending", "confirmed", "cancelled", "completed"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status value",
      });
    }

    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // Check if booking belongs to user
    if (booking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this booking",
      });
    }

    booking.status = status;
    await booking.save();

    logger.info(`Booking status updated: ${booking.bookingReference} -> ${status}`);

    res.status(200).json({
      success: true,
      message: "Booking status updated successfully",
      data: booking,
    });
  } catch (error) {
    logger.error("Error updating booking status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update booking status",
      error: error.message,
    });
  }
};

// @desc    Resend booking confirmation email
// @route   POST /api/bookings/:id/resend-email
// @access  Private
const resendBookingEmail = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('user', 'email name');

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Check ownership
    if (booking.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to resend email for this booking' });
    }

    try {
      const emailResult = await sendBookingConfirmation(
        booking.user.email,
        booking.user.name || booking.user.email,
        booking.toObject()
      );

      if (emailResult.success) {
        booking.confirmationEmailSent = true;
        await booking.save();
        return res.status(200).json({ success: true, emailSent: true, message: 'Confirmation email sent' });
      }

      return res.status(500).json({ success: false, emailSent: false, message: emailResult.error || 'Failed to send email' });
    } catch (emailError) {
      logger.error(`Error resending confirmation email for booking ${booking.bookingReference}:`, emailError);
      return res.status(500).json({ success: false, emailSent: false, message: emailError.message || 'Failed to resend email' });
    }
  } catch (error) {
    logger.error('Error in resendBookingEmail:', error);
    res.status(500).json({ success: false, message: 'Failed to resend email', error: error.message });
  }
};

// @desc    Delete booking
// @route   DELETE /api/bookings/:id
// @access  Private
const deleteBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // Check if booking belongs to user
    if (booking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this booking",
      });
    }

    // Only allow deletion of cancelled bookings
    if (booking.status !== "cancelled") {
      return res.status(400).json({
        success: false,
        message: "Only cancelled bookings can be deleted",
      });
    }

    await booking.deleteOne();

    logger.info(`Booking deleted: ${booking.bookingReference}`);

    res.status(200).json({
      success: true,
      message: "Booking deleted successfully",
    });
  } catch (error) {
    logger.error("Error deleting booking:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete booking",
      error: error.message,
    });
  }
};

// @desc    Get booking statistics
// @route   GET /api/bookings/stats
// @access  Private
const getBookingStats = async (req, res) => {
  try {
    const userId = req.user._id;

    const totalBookings = await Booking.countDocuments({ user: userId });
    const upcomingBookings = await Booking.countDocuments({
      user: userId,
      status: { $in: ["pending", "confirmed"] },
      $or: [
        { checkInDate: { $gte: new Date() } },
        { departureDate: { $gte: new Date() } },
        { bookingDate: { $gte: new Date() } },
      ],
    });

    const completedBookings = await Booking.countDocuments({
      user: userId,
      status: "completed",
    });

    const cancelledBookings = await Booking.countDocuments({
      user: userId,
      status: "cancelled",
    });

    // Total spent - sum all bookings except cancelled ones
    const totalSpent = await Booking.aggregate([
      {
        $match: {
          user: userId,
          status: { $ne: "cancelled" }, // Exclude cancelled bookings
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$pricing.totalPrice" },
        },
      },
    ]);

    // Bookings by type
    const byType = await Booking.aggregate([
      { $match: { user: userId } },
      {
        $group: {
          _id: "$bookingType",
          count: { $sum: 1 },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalBookings,
        upcomingBookings,
        completedBookings,
        cancelledBookings,
        totalSpent: totalSpent[0]?.total || 0,
        byType: byType.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
      },
    });
  } catch (error) {
    logger.error("Error fetching booking stats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch booking statistics",
      error: error.message,
    });
  }
};

module.exports = {
  createBooking,
  getUserBookings,
  getUpcomingBookings,
  getPastBookings,
  getBookingById,
  getBookingByReference,
  updateBooking,
  cancelBooking,
  updateBookingStatus,
  deleteBooking,
  getBookingStats,
  resendBookingEmail,
};
