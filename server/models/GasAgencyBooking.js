const mongoose = require('mongoose');

const gasAgencyBookingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    bookingReference: {
      type: String,
      unique: true,
      required: true,
    },
    bookingType: {
      type: String,
      default: 'gas_agency',
    },
    bookingStatus: {
      type: String,
      enum: ['confirmed', 'pending', 'processing', 'delivered', 'cancelled', 'failed'],
      default: 'confirmed',
    },
    agencyDetails: {
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
      deliveryAddress: {
        type: String,
        required: true,
      },
      city: {
        type: String,
        required: true,
      },
      pincode: {
        type: String,
        required: true,
      },
      landmark: String,
    },
    orderDetails: {
      provider: {
        type: String,
        required: true,
      },
      cylinderType: {
        type: String,
        required: true,
      },
      cylinderId: {
        type: String,
        required: true,
      },
      quantity: {
        type: Number,
        required: true,
        min: 1,
      },
      connectionType: {
        type: String,
        enum: ['new', 'refill', 'transfer'],
        required: true,
      },
      connectionNumber: String,
      deliveryDate: {
        type: Date,
        required: true,
      },
      deliveryTime: {
        type: String,
        enum: ['morning', 'afternoon', 'evening'],
        required: true,
      },
      specialInstructions: String,
    },
    pricing: {
      basePrice: {
        type: Number,
        required: true,
      },
      deposit: {
        type: Number,
        default: 0,
      },
      deliveryCharges: {
        type: Number,
        default: 0,
      },
      gst: {
        type: Number,
        default: 0,
      },
      totalPrice: {
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
        required: true,
      },
      paidAt: Date,
    },
    emailSent: {
      type: Boolean,
      default: false,
    },
    invoiceGenerated: {
      type: Boolean,
      default: false,
    },
    receiptGenerated: {
      type: Boolean,
      default: false,
    },
    deliveryStatus: {
      type: String,
      enum: ['pending', 'dispatched', 'in_transit', 'delivered', 'failed'],
      default: 'pending',
    },
    deliveredAt: Date,
    cancelledAt: Date,
    cancellationReason: String,
  },
  {
    timestamps: true,
  }
);

// Generate booking reference before saving
gasAgencyBookingSchema.pre('save', async function (next) {
  if (!this.bookingReference) {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.bookingReference = `GA${timestamp}${random}`;
  }
  next();
});

// Index for faster queries
gasAgencyBookingSchema.index({ user: 1, createdAt: -1 });
gasAgencyBookingSchema.index({ bookingReference: 1 });
gasAgencyBookingSchema.index({ bookingStatus: 1 });

const GasAgencyBooking = mongoose.model('GasAgencyBooking', gasAgencyBookingSchema);

module.exports = GasAgencyBooking;
