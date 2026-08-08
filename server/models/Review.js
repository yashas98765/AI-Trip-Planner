const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    placeId: {
      type: String,
      required: true,
      index: true,
    },
    placeName: {
      type: String,
      required: true,
    },
    placeType: {
      type: String,
      enum: ["restaurant", "hotel", "attraction", "other"],
      default: "other",
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    title: {
      type: String,
      required: true,
      maxLength: 100,
    },
    comment: {
      type: String,
      required: true,
      maxLength: 1000,
    },
    photos: [{
      type: String, // URLs to photos
    }],
    visitDate: {
      type: Date,
    },
    helpfulCount: {
      type: Number,
      default: 0,
    },
    helpfulBy: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    }],
    verified: {
      type: Boolean,
      default: false,
    },
    location: {
      lat: Number,
      lng: Number,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
reviewSchema.index({ placeId: 1, rating: -1 });
reviewSchema.index({ user: 1, createdAt: -1 });

// Virtual for average rating calculation
reviewSchema.virtual("userInfo", {
  ref: "User",
  localField: "user",
  foreignField: "_id",
  justOne: true,
});

const Review = mongoose.model("Review", reviewSchema);

module.exports = Review;
