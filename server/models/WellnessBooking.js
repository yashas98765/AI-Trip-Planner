const mongoose = require('mongoose');

const wellnessBookingSchema = new mongoose.Schema({
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
    enum: ['pending', 'confirmed', 'completed', 'cancelled'],
    default: 'confirmed',
  },
  centerDetails: {
    name: { type: String, required: true },
    address: { type: String, required: true },
    contact: { type: String },
  },
  customerDetails: {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    age: { type: Number },
    gender: { type: String, enum: ['male', 'female', 'other'] },
  },
  serviceDetails: {
    serviceType: {
      type: String,
      enum: [
        'massage',
        'facial',
        'body_spa',
        'aromatherapy',
        'yoga_session',
        'meditation',
        'sauna',
        'jacuzzi',
        'manicure_pedicure',
        'hair_treatment',
        'couple_spa',
        'wellness_package'
      ],
      required: true,
    },
    serviceName: { type: String, required: true },
    duration: { 
      type: String, 
      enum: ['30 minutes', '60 minutes', '90 minutes', '2 hours', '3 hours', 'Full day'],
      default: '60 minutes' 
    },
    appointmentDate: { type: Date, required: true },
    appointmentTime: { type: String, required: true },
    numberOfPeople: { 
      type: Number, 
      min: 1, 
      max: 10,
      default: 1 
    },
    therapist: { 
      type: String,
      enum: ['any', 'male', 'female'],
      default: 'any'
    },
    specialRequests: { type: String },
  },
  pricing: {
    servicePrice: { type: Number, required: true },
    convenienceFee: { type: Number, default: 50 },
    gst: { type: Number, required: true },
    total: { type: Number, required: true },
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
      default: 'completed',
    },
    transactionId: { type: String, required: true },
  },
  emailSent: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

// Indexes for better query performance
wellnessBookingSchema.index({ user: 1 });
wellnessBookingSchema.index({ bookingReference: 1 });
wellnessBookingSchema.index({ bookingStatus: 1 });
wellnessBookingSchema.index({ 'serviceDetails.appointmentDate': 1 });

// Pre-save hook to generate booking reference
wellnessBookingSchema.pre('save', function(next) {
  if (!this.bookingReference) {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    this.bookingReference = `WEL-${timestamp}-${random}`.toUpperCase();
  }
  next();
});

module.exports = mongoose.model('WellnessBooking', wellnessBookingSchema);
