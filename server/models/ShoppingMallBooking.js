const mongoose = require('mongoose');

const shoppingMallBookingSchema = new mongoose.Schema(
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
    bookingType: {
      type: String,
      default: 'shopping_mall',
    },
    bookingStatus: {
      type: String,
      enum: ['confirmed', 'pending', 'completed', 'cancelled', 'failed'],
      default: 'confirmed',
    },
    mallDetails: {
      name: {
        type: String,
        required: true,
      },
      address: String,
      contact: String,
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
    },
    bookingDetails: {
      serviceType: {
        type: String,
        required: true,
        enum: [
          'shopping_assistance', 
          'personal_shopper', 
          'vip_experience', 
          'gift_wrapping',
          'locker_service',
          'kids_play_area',
          'food_court_voucher',
          'entertainment_zone',
          'senior_assistance',
          'group_tour',
          'parking'
        ],
      },
      serviceName: {
        type: String,
        required: true,
      },
      visitDate: {
        type: Date,
        required: true,
      },
      visitTime: {
        type: String,
        enum: ['morning', 'afternoon', 'evening'],
        required: true,
      },
      numberOfPeople: {
        type: Number,
        required: true,
        min: 1,
      },
      parkingRequired: {
        type: Boolean,
        default: false,
      },
      parkingDuration: Number,
      vehicleType: {
        type: String,
        enum: ['car', 'bike', 'suv'],
      },
      storePreferences: [String],
      specialRequests: String,
    },
    pricing: {
      basePrice: {
        type: Number,
        required: true,
      },
      parkingCharges: {
        type: Number,
        default: 0,
      },
      convenienceFee: {
        type: Number,
        default: 49,
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
        required: true,
        enum: ['card', 'upi', 'netbanking', 'wallet'],
      },
      status: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'refunded'],
        default: 'pending',
      },
      transactionId: {
        type: String,
        required: true,
      },
      paidAt: {
        type: Date,
        default: Date.now,
      },
    },
    emailSent: {
      type: Boolean,
      default: false,
    },
    emailSentAt: Date,
  },
  {
    timestamps: true,
  }
);

// Auto-generate booking reference before saving
shoppingMallBookingSchema.pre('save', async function (next) {
  if (!this.bookingReference) {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.bookingReference = `MALL-${timestamp}-${random}`;
  }
  next();
});

// Index for faster queries
shoppingMallBookingSchema.index({ user: 1, createdAt: -1 });
shoppingMallBookingSchema.index({ bookingReference: 1 });
shoppingMallBookingSchema.index({ bookingStatus: 1 });

const ShoppingMallBooking = mongoose.model('ShoppingMallBooking', shoppingMallBookingSchema);

module.exports = ShoppingMallBooking;
