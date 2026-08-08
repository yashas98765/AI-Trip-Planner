const mongoose = require('mongoose');

const PharmacyBookingSchema = new mongoose.Schema(
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
      enum: ['confirmed', 'pending', 'ready_for_pickup', 'completed', 'cancelled', 'failed'],
      default: 'confirmed',
    },
    pharmacyDetails: {
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
    orderDetails: {
      serviceType: {
        type: String,
        enum: [
          'prescription_medicine',
          'otc_medicine',
          'health_supplements',
          'medical_equipment',
          'personal_care',
          'baby_care',
          'first_aid',
          'ayurvedic_medicine',
        ],
        required: true,
      },
      serviceName: {
        type: String,
        required: true,
      },
      pickupDate: {
        type: Date,
        required: true,
      },
      pickupTime: {
        type: String,
        enum: ['morning', 'afternoon', 'evening'],
        required: true,
      },
      prescriptionRequired: {
        type: Boolean,
        default: false,
      },
      prescriptionImage: {
        type: String, // URL or base64
      },
      itemDescription: {
        type: String,
        required: true,
      },
      quantity: {
        type: Number,
        default: 1,
      },
      specialInstructions: {
        type: String,
      },
    },
    pricing: {
      basePrice: {
        type: Number,
        required: true,
      },
      deliveryFee: {
        type: Number,
        default: 0,
      },
      convenienceFee: {
        type: Number,
        default: 30,
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
        enum: ['card', 'upi', 'netbanking', 'wallet', 'cod'],
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
PharmacyBookingSchema.index({ user: 1, createdAt: -1 });
PharmacyBookingSchema.index({ bookingReference: 1 });
PharmacyBookingSchema.index({ bookingStatus: 1 });
PharmacyBookingSchema.index({ 'orderDetails.pickupDate': 1 });

// Generate booking reference before saving
PharmacyBookingSchema.pre('save', async function (next) {
  if (!this.bookingReference) {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 10).toUpperCase();
    this.bookingReference = `PHRM-${timestamp}-${random}`;
  }
  next();
});

module.exports = mongoose.model('PharmacyBooking', PharmacyBookingSchema);
