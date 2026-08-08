const mongoose = require('mongoose');

const EventBookingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    bookingReference: {
      type: String,
      unique: true,
    },
    bookingStatus: {
      type: String,
      enum: ['confirmed', 'pending', 'checked_in', 'completed', 'cancelled', 'failed'],
      default: 'confirmed',
    },
    venueDetails: {
      name: {
        type: String,
        required: true,
      },
      address: {
        type: String,
        required: true,
      },
      contact: {
        type: String,
      },
    },
    customerDetails: {
      name: {
        type: String,
        required: true,
      },
      email: {
        type: String,
        required: true,
      },
      phone: {
        type: String,
        required: true,
      },
      age: {
        type: Number,
      },
    },
    eventDetails: {
      eventType: {
        type: String,
        enum: [
          'concert',
          'sports',
          'theater',
          'comedy_show',
          'conference',
          'workshop',
          'exhibition',
          'festival',
          'movie',
          'live_music',
        ],
        required: true,
      },
      eventName: {
        type: String,
        required: true,
      },
      eventDate: {
        type: Date,
        required: true,
      },
      eventTime: {
        type: String,
        required: true,
      },
      duration: {
        type: String, // e.g., "2 hours", "3 hours"
      },
      seatingCategory: {
        type: String,
        enum: ['general', 'silver', 'gold', 'platinum', 'vip'],
        required: true,
      },
      numberOfTickets: {
        type: Number,
        required: true,
        min: 1,
        max: 10,
      },
      specialRequests: {
        type: String,
      },
    },
    pricing: {
      ticketPrice: {
        type: Number,
        required: true,
      },
      convenienceFee: {
        type: Number,
        default: 50,
      },
      gst: {
        type: Number,
        required: true,
      },
      total: {
        type: Number,
        required: true,
      },
    },
    payment: {
      method: {
        type: String,
        enum: ['card', 'upi', 'netbanking', 'wallet'],
        required: true,
      },
      status: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'refunded'],
        default: 'pending',
      },
      transactionId: {
        type: String,
      },
      paidAt: {
        type: Date,
      },
    },
    emailSent: {
      type: Boolean,
      default: false,
    },
    emailSentAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes for faster queries
EventBookingSchema.index({ user: 1, createdAt: -1 });
EventBookingSchema.index({ bookingReference: 1 });
EventBookingSchema.index({ bookingStatus: 1 });
EventBookingSchema.index({ 'eventDetails.eventDate': 1 });

// Generate unique booking reference before saving
EventBookingSchema.pre('save', async function (next) {
  if (!this.bookingReference) {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    this.bookingReference = `EVT-${timestamp}-${random}`;
  }
  next();
});

module.exports = mongoose.model('EventBooking', EventBookingSchema);
