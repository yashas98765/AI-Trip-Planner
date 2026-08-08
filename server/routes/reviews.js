const express = require("express");
const router = express.Router();
const { protect: auth } = require("../middleware/auth");
const {
  createReview,
  getPlaceReviews,
  getUserReviews,
  updateReview,
  deleteReview,
  markHelpful,
  getPredictedRating
} = require("../controllers/reviewController");

// Public routes
router.get("/place/:placeId", getPlaceReviews);

// Protected routes
router.post("/", auth, createReview);
router.get("/my-reviews", auth, getUserReviews);
router.put("/:id", auth, updateReview);
router.delete("/:id", auth, deleteReview);
router.post("/:id/helpful", auth, markHelpful);
router.get("/predict", auth, getPredictedRating);

module.exports = router;
