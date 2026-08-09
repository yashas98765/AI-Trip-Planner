const { validationResult } = require("express-validator");
const Trip = require("../models/Trip");
const User = require("../models/User");
const { sendTripConfirmation } = require("../utils/emailService");

// @desc    Create a new trip
// @route   POST /api/trips
// @access  Private
const createTrip = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const {
      title,
      description,
      destination,
      preferences,
      itinerary,
      startDate,
      endDate,
      notes,
      isPublic,
      tags,
      status,
      expenses,
    } = req.body;

    // Determine status based on new rules
    // If status is explicitly provided, use it
    // If itinerary.days exists and has length > 0, set to 'upcoming', else 'draft'
    let tripStatus;
    if (status) {
      tripStatus = status;
    } else if (
      itinerary &&
      Array.isArray(itinerary.days) &&
      itinerary.days.length > 0
    ) {
      tripStatus = "upcoming";
    } else {
      tripStatus = "draft";
    }

    // Create trip
    const trip = await Trip.create({
      user: req.user.id,
      title,
      description,
      destination,
      preferences,
      itinerary,
      status: tripStatus,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      notes,
      isPublic: isPublic || false,
      tags: tags || [],
      expenses: Array.isArray(expenses) ? expenses : [],
    });

    // Populate user information
    await trip.populate("user", "name email avatar");

    // Send confirmation email asynchronously (do not await to prevent blocking the HTTP response)
    sendTripConfirmation(
      req.user.email,
      req.user.name || req.user.email,
      trip.toObject()
    ).then((emailResult) => {
      if (emailResult.success) {
        console.log(`Trip confirmation email sent for trip ${trip._id}`);
      } else {
        console.warn(`Failed to send trip confirmation email for trip ${trip._id}: ${emailResult.error}`);
      }
    }).catch((emailError) => {
      console.error(`Error sending trip confirmation email for trip ${trip._id}:`, emailError);
    });

    res.status(201).json({
      success: true,
      message: "Trip created successfully",
      trip,
    });
  } catch (error) {
    console.error("Create trip error:", error);
    console.error("Error stack:", error.stack);
    console.error("Error name:", error.name);
    res.status(500).json({
      success: false,
      message: "Error creating trip",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
};

// @desc    Get all trips for logged in user
// @route   GET /api/trips
// @access  Private
const getTrips = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      destination,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    console.log("GetTrips called for user:", req.user.id);

    // Build query
    const query = { user: req.user.id };

    if (status) {
      query.status = status;
    }

    if (destination) {
      query.$or = [
        { "destination.city": { $regex: destination, $options: "i" } },
        { "destination.country": { $regex: destination, $options: "i" } },
      ];
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = { [sortBy]: sortOrder === "desc" ? -1 : 1 };

    console.log("Query:", JSON.stringify(query));
    console.log("Sort:", sort);

    // Get trips with pagination
    const trips = await Trip.find(query)
      .populate("user", "name email avatar")
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    console.log(`Found ${trips.length} trips`);

    // Get total count for pagination
    const total = await Trip.countDocuments(query);

    // Calculate pagination info
    const totalPages = Math.ceil(total / parseInt(limit));
    const hasNextPage = parseInt(page) < totalPages;
    const hasPrevPage = parseInt(page) > 1;

    res.json({
      success: true,
      trips,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalTrips: total,
        hasNextPage,
        hasPrevPage,
        limit: parseInt(limit),
      },
    });
  } catch (error) {
    console.error("Get trips error:", error);
    console.error("Error stack:", error.stack);
    console.error("Error message:", error.message);
    res.status(500).json({
      success: false,
      message: "Error fetching trips",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
};

// @desc    Get single trip by ID
// @route   GET /api/trips/:id
// @access  Private
const getTripById = async (req, res) => {
  try {
    console.log("GetTripById called for trip:", req.params.id);

    const trip = await Trip.findById(req.params.id)
      .populate("user", "name email avatar")
      .lean();

    console.log("Trip found:", trip ? "Yes" : "No");

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: "Trip not found",
      });
    }

    // Check if user owns the trip or trip is public
    if (trip.user._id.toString() !== req.user.id && !trip.isPublic) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to access this trip",
      });
    }

    res.json({
      success: true,
      trip,
    });
  } catch (error) {
    console.error("Get trip by ID error:", error);
    console.error("Error stack:", error.stack);
    console.error("Error message:", error.message);

    if (error.name === "CastError") {
      return res.status(404).json({
        success: false,
        message: "Trip not found",
      });
    }

    res.status(500).json({
      success: false,
      message: "Error fetching trip",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
};

// @desc    Update trip
// @route   PUT /api/trips/:id
// @access  Private
const updateTrip = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    let trip = await Trip.findById(req.params.id);

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: "Trip not found",
      });
    }

    // Check if user owns the trip
    if (trip.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this trip",
      });
    }

    const {
      title,
      description,
      destination,
      preferences,
      itinerary,
      startDate,
      endDate,
      notes,
      isPublic,
      tags,
      status,
      expenses,
    } = req.body;

    // Update fields if provided
    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (destination !== undefined) updateData.destination = destination;
    if (preferences !== undefined) updateData.preferences = preferences;
    if (itinerary !== undefined) updateData.itinerary = itinerary;
    if (startDate !== undefined)
      updateData.startDate = startDate ? new Date(startDate) : null;
    if (endDate !== undefined)
      updateData.endDate = endDate ? new Date(endDate) : null;
    if (notes !== undefined) updateData.notes = notes;
    if (isPublic !== undefined) updateData.isPublic = isPublic;
    if (tags !== undefined) updateData.tags = tags;
    if (expenses !== undefined) updateData.expenses = Array.isArray(expenses) ? expenses : [];
    
    // Determine status based on new rules
    // If status is explicitly provided, use it
    // If itinerary.days exists and has length > 0, set to 'upcoming', else 'draft'
    if (status !== undefined) {
      updateData.status = status;
    } else if (itinerary !== undefined) {
      // Auto-determine status when itinerary is being updated
      if (
        itinerary &&
        Array.isArray(itinerary.days) &&
        itinerary.days.length > 0
      ) {
        updateData.status = "upcoming";
      } else {
        updateData.status = "draft";
      }
    }

    trip = await Trip.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    }).populate("user", "name email avatar");

    res.json({
      success: true,
      message: "Trip updated successfully",
      trip,
    });
  } catch (error) {
    console.error("Update trip error:", error);

    if (error.name === "CastError") {
      return res.status(404).json({
        success: false,
        message: "Trip not found",
      });
    }

    res.status(500).json({
      success: false,
      message: "Error updating trip",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
};

// @desc    Delete trip
// @route   DELETE /api/trips/:id
// @access  Private
const deleteTrip = async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: "Trip not found",
      });
    }

    // Check if user owns the trip
    if (trip.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this trip",
      });
    }

    await Trip.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Trip deleted successfully",
    });
  } catch (error) {
    console.error("Delete trip error:", error);

    if (error.name === "CastError") {
      return res.status(404).json({
        success: false,
        message: "Trip not found",
      });
    }

    res.status(500).json({
      success: false,
      message: "Error deleting trip",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
};

// @desc    Get public trips (for discovery)
// @route   GET /api/trips/public
// @access  Public
const getPublicTrips = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      destination,
      travelStyle,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    // Build query for public trips
    const query = { isPublic: true };

    if (destination) {
      query.$or = [
        { "destination.city": { $regex: destination, $options: "i" } },
        { "destination.country": { $regex: destination, $options: "i" } },
      ];
    }

    if (travelStyle) {
      query["preferences.travelStyle"] = travelStyle;
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = { [sortBy]: sortOrder === "desc" ? -1 : 1 };

    // Get public trips
    const trips = await Trip.find(query)
      .populate("user", "name avatar")
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count
    const total = await Trip.countDocuments(query);

    // Calculate pagination info
    const totalPages = Math.ceil(total / parseInt(limit));
    const hasNextPage = parseInt(page) < totalPages;
    const hasPrevPage = parseInt(page) > 1;

    res.json({
      success: true,
      trips,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalTrips: total,
        hasNextPage,
        hasPrevPage,
        limit: parseInt(limit),
      },
    });
  } catch (error) {
    console.error("Get public trips error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching public trips",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
};

// @desc    Clone/copy a public trip
// @route   POST /api/trips/:id/clone
// @access  Private
const cloneTrip = async (req, res) => {
  try {
    const originalTrip = await Trip.findById(req.params.id);

    if (!originalTrip) {
      return res.status(404).json({
        success: false,
        message: "Trip not found",
      });
    }

    // Check if trip is public or user owns it
    if (
      !originalTrip.isPublic &&
      originalTrip.user.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to clone this trip",
      });
    }

    // Create cloned trip
    const clonedTripData = {
      user: req.user.id,
      title: `${originalTrip.title} (Copy)`,
      description: originalTrip.description,
      destination: originalTrip.destination,
      preferences: originalTrip.preferences,
      itinerary: originalTrip.itinerary,
      recommendations: originalTrip.recommendations,
      notes: originalTrip.notes,
      tags: originalTrip.tags,
      expenses: originalTrip.expenses,
      status: "draft", // Reset status to draft
      isPublic: false, // Make private by default
    };

    const clonedTrip = await Trip.create(clonedTripData);
    await clonedTrip.populate("user", "name email avatar");

    res.status(201).json({
      success: true,
      message: "Trip cloned successfully",
      trip: clonedTrip,
    });
  } catch (error) {
    console.error("Clone trip error:", error);

    if (error.name === "CastError") {
      return res.status(404).json({
        success: false,
        message: "Trip not found",
      });
    }

    res.status(500).json({
      success: false,
      message: "Error cloning trip",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
};

// @desc    Get trip statistics for user
// @route   GET /api/trips/stats
// @access  Private
const getTripStats = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get trip statistics
    const stats = await Trip.aggregate([
      { $match: { user: userId } },
      {
        $group: {
          _id: null,
          totalTrips: { $sum: 1 },
          completedTrips: {
            $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
          },
          ongoingTrips: {
            $sum: { $cond: [{ $eq: ["$status", "ongoing"] }, 1, 0] },
          },
          plannedTrips: {
            $sum: { $cond: [{ $eq: ["$status", "draft"] }, 1, 0] },
          },
          totalCost: {
            $sum: "$itinerary.totalCost.amount",
          },
          averageDuration: {
            $avg: "$preferences.duration",
          },
        },
      },
    ]);

    // Get trip by travel style
    const travelStyleStats = await Trip.aggregate([
      { $match: { user: userId } },
      {
        $group: {
          _id: "$preferences.travelStyle",
          count: { $sum: 1 },
        },
      },
    ]);

    // Get trips by destination (top 5)
    const destinationStats = await Trip.aggregate([
      { $match: { user: userId } },
      {
        $group: {
          _id: "$destination.country",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]);

    const result = {
      overview: stats[0] || {
        totalTrips: 0,
        completedTrips: 0,
        ongoingTrips: 0,
        plannedTrips: 0,
        totalCost: 0,
        averageDuration: 0,
      },
      travelStyleBreakdown: travelStyleStats,
      topDestinations: destinationStats,
    };

    res.json({
      success: true,
      stats: result,
    });
  } catch (error) {
    console.error("Get trip stats error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching trip statistics",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
};

// @desc    Get trip expenses
// @route   GET /api/trips/:id/expenses
// @access  Private
const getTripExpenses = async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id).select("expenses user");

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: "Trip not found",
      });
    }

    if (trip.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view these expenses",
      });
    }

    res.json({
      success: true,
      expenses: trip.expenses || [],
    });
  } catch (error) {
    console.error("Get trip expenses error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching trip expenses",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
};

// @desc    Add trip expense
// @route   POST /api/trips/:id/expenses
// @access  Private
const addTripExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const { day, category, description, amount, paidBy, splitAmong, timestamp } = req.body;

    if (!day || !category || !description || amount === undefined || amount === null) {
      return res.status(400).json({
        success: false,
        message: "Day, category, description, and amount are required",
      });
    }

    const trip = await Trip.findById(id);

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: "Trip not found",
      });
    }

    if (trip.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this trip",
      });
    }

    const expense = {
      day: parseInt(day),
      category,
      description: String(description).trim(),
      amount: parseFloat(amount),
      paidBy: paidBy || "",
      splitAmong: Array.isArray(splitAmong) ? splitAmong : [],
      timestamp: timestamp ? new Date(timestamp) : new Date(),
    };

    trip.expenses = trip.expenses || [];
    trip.expenses.push(expense);
    await trip.save();

    res.status(201).json({
      success: true,
      message: "Expense added successfully",
      expense: trip.expenses[trip.expenses.length - 1],
      expenses: trip.expenses,
    });
  } catch (error) {
    console.error("Add trip expense error:", error);
    res.status(500).json({
      success: false,
      message: "Error adding trip expense",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
};

// @desc    Update trip expense
// @route   PUT /api/trips/:id/expenses/:expenseId
// @access  Private
const updateTripExpense = async (req, res) => {
  try {
    const { id, expenseId } = req.params;
    const trip = await Trip.findById(id);

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: "Trip not found",
      });
    }

    if (trip.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this trip",
      });
    }

    const expense = trip.expenses.id(expenseId);
    if (!expense) {
      return res.status(404).json({
        success: false,
        message: "Expense not found",
      });
    }

    const { day, category, description, amount, paidBy, splitAmong, timestamp } = req.body;

    if (day !== undefined) expense.day = parseInt(day);
    if (category !== undefined) expense.category = category;
    if (description !== undefined) expense.description = String(description).trim();
    if (amount !== undefined) expense.amount = parseFloat(amount);
    if (paidBy !== undefined) expense.paidBy = paidBy;
    if (splitAmong !== undefined) expense.splitAmong = Array.isArray(splitAmong) ? splitAmong : [];
    if (timestamp !== undefined) expense.timestamp = timestamp ? new Date(timestamp) : new Date();

    await trip.save();

    res.json({
      success: true,
      message: "Expense updated successfully",
      expense,
      expenses: trip.expenses,
    });
  } catch (error) {
    console.error("Update trip expense error:", error);
    res.status(500).json({
      success: false,
      message: "Error updating trip expense",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
};

// @desc    Delete trip expense
// @route   DELETE /api/trips/:id/expenses/:expenseId
// @access  Private
const deleteTripExpense = async (req, res) => {
  try {
    const { id, expenseId } = req.params;
    const trip = await Trip.findById(id);

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: "Trip not found",
      });
    }

    if (trip.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this trip",
      });
    }

    const expense = trip.expenses.id(expenseId);
    if (!expense) {
      return res.status(404).json({
        success: false,
        message: "Expense not found",
      });
    }

    expense.deleteOne();
    await trip.save();

    res.json({
      success: true,
      message: "Expense deleted successfully",
      expenses: trip.expenses,
    });
  } catch (error) {
    console.error("Delete trip expense error:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting trip expense",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
};

// @desc    Update trip status
// @route   PATCH /api/trips/:id/status
// @access  Private
const updateTripStatus = async (req, res) => {
  try {
    const { status } = req.body;

    // Validate status
    const validStatuses = ["draft", "upcoming", "ongoing", "completed", "cancelled"];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
      });
    }

    const trip = await Trip.findById(req.params.id);

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: "Trip not found",
      });
    }

    // Check if user owns the trip
    if (trip.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this trip",
      });
    }

    // Update status
    trip.status = status;
    await trip.save();

    await trip.populate("user", "name email avatar");

    res.json({
      success: true,
      message: `Trip marked as ${status}`,
      trip,
    });
  } catch (error) {
    console.error("Update trip status error:", error);

    if (error.name === "CastError") {
      return res.status(404).json({
        success: false,
        message: "Trip not found",
      });
    }

    res.status(500).json({
      success: false,
      message: "Error updating trip status",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
};

// @desc    Generate a shareable link for a trip
// @route   POST /api/trips/:id/share
// @access  Private
const shareTrip = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if trip exists and user owns it
    const trip = await Trip.findById(id);
    if (!trip) {
      return res.status(404).json({
        success: false,
        message: "Trip not found",
      });
    }

    if (trip.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to share this trip",
      });
    }

    // Generate unique share token
    const shareToken = `share_${id}_${Math.random().toString(36).substring(2, 9)}`;

    // Update trip with share token and make it public
    trip.shareToken = shareToken;
    trip.isPublic = true;
    await trip.save();

    const shareUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/shared/trips/${shareToken}`;

    res.json({
      success: true,
      shareToken,
      shareUrl,
      message: "Trip shared successfully",
    });
  } catch (error) {
    console.error("Error sharing trip:", error);
    res.status(500).json({
      success: false,
      message: "Error sharing trip",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
};

// @desc    Get a shared trip by token
// @route   GET /api/trips/share/:shareToken
// @access  Public
const getSharedTripByToken = async (req, res) => {
  try {
    const { shareToken } = req.params;

    const trip = await Trip.findOne({ shareToken })
      .populate('user', 'name email avatar')
      .select('-sharedWith');

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: "Shared trip not found",
      });
    }

    res.json({
      success: true,
      data: trip,
    });
  } catch (error) {
    console.error("Error getting shared trip:", error);
    res.status(500).json({
      success: false,
      message: "Error getting shared trip",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
};

// @desc    Add collaborator to trip
// @route   POST /api/trips/:id/collaborators
// @access  Private
const addCollaborator = async (req, res) => {
  try {
    const { id } = req.params;
    const { email, permission = 'view' } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    // Check if trip exists and user owns it
    const trip = await Trip.findById(id);
    if (!trip) {
      return res.status(404).json({
        success: false,
        message: "Trip not found",
      });
    }

    if (trip.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to add collaborators",
      });
    }

    // Check if collaborator already exists
    const exists = trip.sharedWith.some(s => s.email === email);
    if (exists) {
      return res.status(400).json({
        success: false,
        message: "User already added as collaborator",
      });
    }

    // Add collaborator
    trip.sharedWith.push({
      email,
      permission,
      sharedAt: new Date(),
    });

    await trip.save();

    res.json({
      success: true,
      message: "Collaborator added successfully",
      data: trip,
    });
  } catch (error) {
    console.error("Error adding collaborator:", error);
    res.status(500).json({
      success: false,
      message: "Error adding collaborator",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
};

module.exports = {
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
};
