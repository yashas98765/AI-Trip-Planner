const mongoose = require('mongoose');

const HospitalBookingSchema = new mongoose.Schema(
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
      enum: ['confirmed', 'pending', 'completed', 'cancelled', 'failed'],
      default: 'confirmed',
    },
    hospitalDetails: {
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
    patientDetails: {
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
        required: true,
      },
      gender: {
        type: String,
        enum: ['male', 'female', 'other'],
        required: true,
      },
      emergencyContact: {
        type: String,
      },
    },
    appointmentDetails: {
      serviceType: {
        type: String,
        enum: [
          'consultation',
          'specialist_consultation',
          'health_checkup',
          'lab_tests',
          'emergency_care',
          'ambulance_service',
          'physiotherapy',
          'dental_care',
          'vaccination',
        ],
        required: true,
      },
      serviceName: {
        type: String,
        required: true,
      },
      department: {
        type: String,
        required: true,
      },
      departmentName: {
        type: String,
        required: true,
      },
      appointmentDate: {
        type: Date,
        required: true,
      },
      appointmentTime: {
        type: String,
        enum: ['morning', 'afternoon', 'evening'],
        required: true,
      },
      symptoms: {
        type: String,
      },
      medicalHistory: {
        type: String,
      },
      insuranceProvider: {
        type: String,
      },
    },
    pricing: {
      basePrice: {
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
  },
  {
    timestamps: true,
  }
);

// Create indexes for faster queries
HospitalBookingSchema.index({ user: 1, createdAt: -1 });
HospitalBookingSchema.index({ bookingReference: 1 });
HospitalBookingSchema.index({ bookingStatus: 1 });
HospitalBookingSchema.index({ 'appointmentDetails.appointmentDate': 1 });

// Generate booking reference before saving
HospitalBookingSchema.pre('save', async function (next) {
  if (!this.bookingReference) {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 10).toUpperCase();
    this.bookingReference = `HOSP-${timestamp}-${random}`;
  }
  next();
});

module.exports = mongoose.model('HospitalBooking', HospitalBookingSchema);
