const express = require("express");
const { body } = require("express-validator");
const {
  createTrip,
  getTrips,
  getTripById,
  updateTrip,
  deleteTrip,
  getPublicTrips,
  cloneTrip,
  getTripStats,
  updateTripStatus,
  getTripExpenses,
  addTripExpense,
  updateTripExpense,
  deleteTripExpense,
  shareTrip,
  getSharedTripByToken,
  addCollaborator,
} = require("../controllers/tripController");
const { protect, optionalAuth } = require("../middleware/auth");

const router = express.Router();

// Validation middleware
const tripValidation = [
  body("title")
    .notEmpty()
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage("Title must be between 3 and 100 characters"),
  body("destination.city")
    .notEmpty()
    .trim()
    .withMessage("Destination city is required"),
  body("destination.country")
    .notEmpty()
    .trim()
    .withMessage("Destination country is required"),
  body("preferences.duration")
    .isInt({ min: 1, max: 365 })
    .withMessage("Duration must be between 1 and 365 days"),
  body("preferences.budget.max")
    .optional()
    .isNumeric()
    .withMessage("Budget must be a number"),
];

const updateTripValidation = [
  body("title")
    .optional()
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage("Title must be between 3 and 100 characters"),
  body("preferences.duration")
    .optional()
    .isInt({ min: 1, max: 365 })
    .withMessage("Duration must be between 1 and 365 days"),
];

// @route   GET /api/trips/public
// @desc    Get public trips for discovery
// @access  Public
router.get("/public", optionalAuth, getPublicTrips);

// @route   GET /api/trips/stats
// @desc    Get trip statistics for current user
// @access  Private
router.get("/stats", protect, getTripStats);

// @route   GET /api/trips
// @desc    Get all trips for logged in user
// @access  Private
router.get("/", protect, getTrips);

// @route   POST /api/trips
// @desc    Create a new trip
// @access  Private
router.post("/", protect, tripValidation, createTrip);

// @route   GET /api/trips/:id
// @desc    Get single trip by ID
// @access  Private
router.get("/:id", protect, getTripById);

// @route   GET /api/trips/:id/expenses
// @desc    Get trip expenses
// @access  Private
router.get("/:id/expenses", protect, getTripExpenses);

// @route   POST /api/trips/:id/expenses
// @desc    Add expense to trip
// @access  Private
router.post("/:id/expenses", protect, addTripExpense);

// @route   PUT /api/trips/:id/expenses/:expenseId
// @desc    Update expense on trip
// @access  Private
router.put("/:id/expenses/:expenseId", protect, updateTripExpense);

// @route   DELETE /api/trips/:id/expenses/:expenseId
// @desc    Delete expense from trip
// @access  Private
router.delete("/:id/expenses/:expenseId", protect, deleteTripExpense);

// @route   PUT /api/trips/:id
// @desc    Update trip
// @access  Private
router.put("/:id", protect, updateTripValidation, updateTrip);

// @route   DELETE /api/trips/:id
// @desc    Delete trip
// @access  Private
router.delete("/:id", protect, deleteTrip);

// @route   POST /api/trips/:id/clone
// @desc    Clone a trip (public or owned)
// @access  Private
router.post("/:id/clone", protect, cloneTrip);

// @route   PATCH /api/trips/:id/status
// @desc    Update trip status
// @access  Private
router.patch("/:id/status", protect, updateTripStatus);

// @route   GET /api/trips/upcoming
// @desc    Get upcoming trips
// @access  Private
router.get("/upcoming", protect, async (req, res) => {
  try {
    const { limit = 5 } = req.query;
    const now = new Date();

    const Trip = require("../models/Trip");
    // Only return true upcoming trips (exclude drafts)
    const trips = await Trip.find({
      user: req.user.id,
      startDate: { $gte: now },
      status: { $in: ["upcoming"] },
    })
      .sort({ startDate: 1 })
      .limit(parseInt(limit));

    res.json({
      success: true,
      count: trips.length,
      trips,
    });
  } catch (error) {
    console.error("Get upcoming trips error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching upcoming trips",
    });
  }
});

// @route   GET /api/trips/past
// @desc    Get past trips
// @access  Private
router.get("/past", protect, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const now = new Date();

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const Trip = require("../models/Trip");
    const trips = await Trip.find({
      user: req.user.id,
      endDate: { $lt: now },
      status: { $in: ["completed", "cancelled"] },
    })
      .sort({ endDate: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Trip.countDocuments({
      user: req.user.id,
      endDate: { $lt: now },
      status: { $in: ["completed", "cancelled"] },
    });

    res.json({
      success: true,
      count: trips.length,
      total,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        hasNext: skip + trips.length < total,
        hasPrev: parseInt(page) > 1,
      },
      trips,
    });
  } catch (error) {
    console.error("Get past trips error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching past trips",
    });
  }
});

// @route   POST /api/trips/:id/share
// @desc    Generate a shareable link for a trip
// @access  Private
router.post("/:id/share", protect, shareTrip);

// @route   GET /api/trips/share/:shareToken
// @desc    Get a shared trip by token
// @access  Public
router.get("/share/:shareToken", getSharedTripByToken);

// @route   POST /api/trips/:id/collaborators
// @desc    Add a collaborator to a trip
// @access  Private
router.post("/:id/collaborators", protect, addCollaborator);

module.exports = router;
