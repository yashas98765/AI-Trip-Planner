const mongoose = require('mongoose');

const activityBookingSchema = new mongoose.Schema({
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
  activityType: {
    type: String,
    enum: [
      'adventure',
      'theme_park',
      'guided_tour',
      'cruise',
      'boat_ride',
      'hostel',
      'resort',
      'homestay'
    ],
    required: true,
  },
  placeDetails: {
    name: { type: String, required: true },
    address: { type: String, required: true },
    contact: { type: String },
    placeId: { type: String },
  },
  customerDetails: {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    age: { type: Number },
    nationality: { type: String },
  },
  bookingDetails: {
    activityName: { type: String, required: true },
    activityDescription: { type: String },
    bookingDate: { type: Date, required: true },
    bookingTime: { type: String },
    numberOfPeople: { 
      type: Number, 
      min: 1, 
      max: 50,
      default: 1 
    },
    duration: { 
      type: String,
      default: 'Full day'
    },
    // For accommodation types (hostel, resort, homestay)
    checkInDate: { type: Date },
    checkOutDate: { type: Date },
    roomType: { type: String },
    numberOfRooms: { type: Number, default: 1 },
    // For cruises and boat rides
    departureTime: { type: String },
    returnTime: { type: String },
    // For guided tours
    tourLanguage: { type: String },
    meetingPoint: { type: String },
    specialRequests: { type: String },
  },
  pricing: {
    basePrice: { type: Number, required: true },
    convenienceFee: { type: Number, default: 99 },
    gst: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    total: { type: Number, required: true },
  },
  payment: {
    method: {
      type: String,
      enum: ['card', 'upi', 'netbanking', 'wallet', 'cash'],
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'completed',
    },
    transactionId: { type: String, required: true },
    paidAt: { type: Date, default: Date.now },
  },
  emailSent: {
    type: Boolean,
    default: false,
  },
  cancellationPolicy: {
    type: String,
    default: 'Free cancellation up to 24 hours before the activity',
  },
}, {
  timestamps: true,
});

// Pre-save hook to generate booking reference
activityBookingSchema.pre('save', function(next) {
  if (!this.bookingReference) {
    const prefixMap = {
      adventure: 'ADV',
      theme_park: 'TPK',
      guided_tour: 'GTR',
      cruise: 'CRS',
      boat_ride: 'BTR',
      hostel: 'HST',
      resort: 'RST',
      homestay: 'HMS'
    };
    const prefix = prefixMap[this.activityType] || 'ACT';
    const randomString = Math.random().toString(36).substring(2, 10).toUpperCase();
    const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    this.bookingReference = `${prefix}-${randomString}-${randomNum}`;
  }
  next();
});

// Indexes for better query performance
activityBookingSchema.index({ user: 1 });
activityBookingSchema.index({ bookingStatus: 1 });
activityBookingSchema.index({ activityType: 1 });
activityBookingSchema.index({ 'bookingDetails.bookingDate': 1 });

const ActivityBooking = mongoose.model('ActivityBooking', activityBookingSchema);

module.exports = ActivityBooking;
