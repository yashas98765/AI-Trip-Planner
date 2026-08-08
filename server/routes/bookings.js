const express = require("express");
const { body } = require("express-validator");
const {
  createBooking,
  getUserBookings,
  getUpcomingBookings,
  getPastBookings,
  getBookingById,
  getBookingByReference,
  updateBooking,
  cancelBooking,
  resendBookingEmail,
  updateBookingStatus,
  deleteBooking,
  getBookingStats,
} = require("../controllers/bookingController");
const { protect } = require("../middleware/auth");

const router = express.Router();

// Validation middleware for creating booking
const createBookingValidation = [
  body("bookingType")
    .notEmpty()
    .isIn([
      "hotel",
      "resort",
      "restaurant",
      "cafe",
      "car",
      "bike",
      "bus",
      "train",
      "flight",
      "ship",
      "package",
      "gas_station",
    ])
    .withMessage("Invalid booking type"),
  body("bookingDetails.name")
    .notEmpty()
    .trim()
    .withMessage("Booking name is required"),
  body("pricing.basePrice")
    .notEmpty()
    .isNumeric()
    .withMessage("Base price is required and must be a number"),
  body("pricing.totalPrice")
    .notEmpty()
    .isNumeric()
    .withMessage("Total price is required and must be a number"),
  body("numberOfGuests")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Number of guests must be at least 1"),
];

// @route   POST /api/bookings
// @desc    Create new booking
// @access  Private
router.post("/", protect, createBookingValidation, createBooking);

// @route   GET /api/bookings
// @desc    Get all bookings for logged-in user
// @access  Private
router.get("/", protect, getUserBookings);

// @route   GET /api/bookings/stats
// @desc    Get booking statistics
// @access  Private
router.get("/stats", protect, getBookingStats);

// @route   GET /api/bookings/upcoming
// @desc    Get upcoming bookings
// @access  Private
router.get("/upcoming", protect, getUpcomingBookings);

// @route   GET /api/bookings/past
// @desc    Get past bookings
// @access  Private
router.get("/past", protect, getPastBookings);

// @route   GET /api/bookings/reference/:reference
// @desc    Get booking by reference number
// @access  Private
router.get("/reference/:reference", protect, getBookingByReference);

// @route   GET /api/bookings/:id
// @desc    Get single booking by ID
// @access  Private
router.get("/:id", protect, getBookingById);

// @route   PUT /api/bookings/:id
// @desc    Update booking
// @access  Private
router.put("/:id", protect, updateBooking);

// @route   PATCH /api/bookings/:id/cancel
// @desc    Cancel booking
// @access  Private
router.patch(
  "/:id/cancel",
  protect,
  [body("reason").optional().trim()],
  cancelBooking
);

// @route   PATCH /api/bookings/:id/status
// @desc    Update booking status
// @access  Private
router.patch(
  "/:id/status",
  protect,
  [
    body("status")
      .notEmpty()
      .isIn(["pending", "confirmed", "cancelled", "completed"])
      .withMessage("Invalid status"),
  ],
  updateBookingStatus
);

// @route   POST /api/bookings/:id/resend-email
// @desc    Resend confirmation email for booking
// @access  Private
router.post("/:id/resend-email", protect, resendBookingEmail);

// @route   DELETE /api/bookings/:id
// @desc    Delete booking (only cancelled bookings)
// @access  Private
router.delete("/:id", protect, deleteBooking);

module.exports = router;
