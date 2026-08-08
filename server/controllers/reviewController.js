const Review = require("../models/Review");
const { logger } = require("../middleware/logging");

/**
 * Create a new review
 */
const createReview = async (req, res) => {
  try {
    const { placeId, placeName, placeType, rating, title, comment, visitDate, location } = req.body;

    // Validate required fields
    if (!placeId || !placeName || !rating || !title || !comment) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    // Check if user already reviewed this place
    const existingReview = await Review.findOne({
      user: req.user.id,
      placeId,
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: "You have already reviewed this place. Please update your existing review.",
      });
    }

    const review = new Review({
      user: req.user.id,
      placeId,
      placeName,
      placeType,
      rating,
      title,
      comment,
      visitDate,
      location,
    });

    await review.save();

    const populatedReview = await Review.findById(review._id).populate(
      "user",
      "name email"
    );

    res.status(201).json({
      success: true,
      message: "Review created successfully",
      data: populatedReview,
    });
  } catch (error) {
    logger.error("Create review error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create review",
    });
  }
};

/**
 * Get reviews for a place
 */
const getPlaceReviews = async (req, res) => {
  try {
    const { placeId } = req.params;
    const { sort = "-createdAt", limit = 20, page = 1 } = req.query;

    const reviews = await Review.find({ placeId })
      .populate("user", "name email")
      .sort(sort)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Review.countDocuments({ placeId });

    // Calculate average rating
    const stats = await Review.aggregate([
      { $match: { placeId } },
      {
        $group: {
          _id: null,
          avgRating: { $avg: "$rating" },
          totalReviews: { $sum: 1 },
          ratingDistribution: {
            $push: "$rating",
          },
        },
      },
    ]);

    const ratingStats = stats[0] || { avgRating: 0, totalReviews: 0 };
    
    // Calculate rating distribution
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    if (ratingStats.ratingDistribution) {
      ratingStats.ratingDistribution.forEach(rating => {
        distribution[rating] = (distribution[rating] || 0) + 1;
      });
    }

    res.json({
      success: true,
      data: {
        reviews,
        stats: {
          avgRating: ratingStats.avgRating ? ratingStats.avgRating.toFixed(1) : 0,
          totalReviews: ratingStats.totalReviews,
          distribution,
        },
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    logger.error("Get place reviews error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch reviews",
    });
  }
};

/**
 * Get user's reviews
 */
const getUserReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ user: req.user.id })
      .sort("-createdAt")
      .limit(50);

    res.json({
      success: true,
      data: reviews,
    });
  } catch (error) {
    logger.error("Get user reviews error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch user reviews",
    });
  }
};

/**
 * Update a review
 */
const updateReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, title, comment, visitDate } = req.body;

    const review = await Review.findOne({ _id: id, user: req.user.id });

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found or unauthorized",
      });
    }

    if (rating) review.rating = rating;
    if (title) review.title = title;
    if (comment) review.comment = comment;
    if (visitDate) review.visitDate = visitDate;

    await review.save();

    res.json({
      success: true,
      message: "Review updated successfully",
      data: review,
    });
  } catch (error) {
    logger.error("Update review error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update review",
    });
  }
};

/**
 * Delete a review
 */
const deleteReview = async (req, res) => {
  try {
    const { id } = req.params;

    const review = await Review.findOneAndDelete({
      _id: id,
      user: req.user.id,
    });

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found or unauthorized",
      });
    }

    res.json({
      success: true,
      message: "Review deleted successfully",
    });
  } catch (error) {
    logger.error("Delete review error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete review",
    });
  }
};

/**
 * Mark review as helpful
 */
const markHelpful = async (req, res) => {
  try {
    const { id } = req.params;

    const review = await Review.findById(id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found",
      });
    }

    // Toggle helpful
    const hasMarked = review.helpfulBy.includes(req.user.id);

    if (hasMarked) {
      review.helpfulBy = review.helpfulBy.filter(
        (userId) => userId.toString() !== req.user.id
      );
      review.helpfulCount = Math.max(0, review.helpfulCount - 1);
    } else {
      review.helpfulBy.push(req.user.id);
      review.helpfulCount += 1;
    }

    await review.save();

    res.json({
      success: true,
      message: hasMarked ? "Removed helpful mark" : "Marked as helpful",
      data: { helpfulCount: review.helpfulCount },
    });
  } catch (error) {
    logger.error("Mark helpful error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to mark review",
    });
  }
};

/**
 * Get predicted rating for a place (ML-based suggestion)
 */
const getPredictedRating = async (req, res) => {
  try {
    const { placeType, location } = req.query;

    // Get user's past ratings
    const userReviews = await Review.find({ user: req.user.id });

    if (userReviews.length === 0) {
      return res.json({
        success: true,
        data: {
          predicted: 4.0,
          confidence: "low",
          message: "Not enough data. Showing average rating.",
        },
      });
    }

    // Simple prediction based on user's average rating for similar place types
    const similarReviews = userReviews.filter((r) => r.placeType === placeType);
    
    let predicted;
    let confidence;

    if (similarReviews.length >= 3) {
      predicted = similarReviews.reduce((sum, r) => sum + r.rating, 0) / similarReviews.length;
      confidence = "high";
    } else if (similarReviews.length > 0) {
      predicted = similarReviews.reduce((sum, r) => sum + r.rating, 0) / similarReviews.length;
      confidence = "medium";
    } else {
      predicted = userReviews.reduce((sum, r) => sum + r.rating, 0) / userReviews.length;
      confidence = "low";
    }

    res.json({
      success: true,
      data: {
        predicted: Math.round(predicted * 10) / 10,
        confidence,
        basedOn: similarReviews.length || userReviews.length,
        message: `Based on your ${similarReviews.length || userReviews.length} previous reviews`,
      },
    });
  } catch (error) {
    logger.error("Predicted rating error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to predict rating",
    });
  }
};

module.exports = {
  createReview,
  getPlaceReviews,
  getUserReviews,
  updateReview,
  deleteReview,
  markHelpful,
  getPredictedRating,
};
