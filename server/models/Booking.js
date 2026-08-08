const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    bookingType: {
      type: String,
      enum: [
        "hotel",
        "resort",
        "restaurant",
        "cafe",
        "car",
        "bike",
        "bus",
        "train",
        "flight",
        "ship",
        "package",
        "gas_station",
      ],
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled", "completed"],
      default: "pending",
    },
    // Common booking details
    bookingDetails: {
      name: {
        type: String,
        required: true,
      },
      description: String,
      location: {
        address: String,
        city: String,
        state: String,
        country: String,
        coordinates: {
          lat: Number,
          lng: Number,
        },
      },
      images: [String],
      rating: Number,
      contactInfo: {
        phone: String,
        email: String,
        website: String,
      },
    },
    // Date and time details
    checkInDate: {
      type: Date,
      required: function () {
        return ["hotel", "resort"].includes(this.bookingType);
      },
    },
    checkOutDate: {
      type: Date,
      required: function () {
        return ["hotel", "resort"].includes(this.bookingType);
      },
    },
    bookingDate: {
      type: Date,
      required: function () {
        return ["restaurant", "cafe"].includes(this.bookingType);
      },
    },
    bookingTime: {
      type: String,
      required: function () {
        return ["restaurant", "cafe"].includes(this.bookingType);
      },
    },
    departureDate: {
      type: Date,
      required: function () {
        return ["car", "bike", "bus", "train", "flight", "ship"].includes(
          this.bookingType
        );
      },
    },
    returnDate: {
      type: Date,
      required: function () {
        return ["car", "bike"].includes(this.bookingType);
      },
    },
    // Guest/Passenger details
    numberOfGuests: {
      type: Number,
      default: 1,
      min: 1,
    },
    guestDetails: {
      adults: {
        type: Number,
        default: 1,
        min: 1,
      },
      children: {
        type: Number,
        default: 0,
        min: 0,
      },
      infants: {
        type: Number,
        default: 0,
        min: 0,
      },
    },
    // Accommodation specific
    roomDetails: {
      roomType: String,
      numberOfRooms: {
        type: Number,
        default: 1,
      },
      pricePerNight: Number,
      capacity: Number,
      bedType: String,
      amenities: [String],
    },
    // Transportation specific
    transportDetails: {
      from: {
        location: String,
        coordinates: {
          lat: Number,
          lng: Number,
        },
      },
      to: {
        location: String,
        coordinates: {
          lat: Number,
          lng: Number,
        },
      },
      vehicleType: String,
      pricePerUnit: Number,
      capacity: Number,
      features: [String],
      vehicleModel: String,
      flightNumber: String,
      trainNumber: String,
      busNumber: String,
      shipName: String,
      seatClass: String,
      seatNumber: String,
      departureTime: String,
      arrivalTime: String,
      duration: String,
    },
    // Restaurant specific
    restaurantDetails: {
      orderedItems: [
        {
          itemName: String,
          quantity: {
            type: Number,
            default: 1,
          },
          price: Number,
          category: String,
          notes: String,
        },
      ],
      totalItems: {
        type: Number,
        default: 0,
      },
    },
    // Gas Station specific
    gasStationDetails: {
      fuelType: {
        type: String,
        enum: ["petrol", "diesel", "cng", "lpg"],
      },
      quantity: {
        type: Number, // in liters or kg
      },
      pricePerUnit: {
        type: Number, // price per liter/kg
      },
      vehicleNumber: String,
      vehicleModel: String,
      fillDateTime: Date, // Scheduled fill date and time
      stationName: String,
      stationAddress: String,
      pumpNumber: String,
      meterReading: {
        start: Number,
        end: Number,
      },
    },
    // Payment details
    pricing: {
      basePrice: {
        type: Number,
        required: true,
      },
      taxes: {
        type: Number,
        default: 0,
      },
      serviceFee: {
        type: Number,
        default: 0,
      },
      discount: {
        type: Number,
        default: 0,
      },
      totalPrice: {
        type: Number,
        required: true,
      },
      currency: {
        type: String,
        default: "INR",
      },
    },
    paymentStatus: {
      type: String,
      enum: ["unpaid", "paid", "refunded", "partially_refunded", "pending"],
      default: "unpaid",
    },
    paymentMethod: {
      type: String,
      enum: ["credit_card", "debit_card", "card", "upi", "net_banking", "netbanking", "wallet", "cash", "razorpay"],
    },
    transactionId: String,
    paymentDetails: {
      gateway: {
        type: String,
        enum: ["razorpay", "stripe", "paypal", "paytm", "cash"],
      },
      orderId: String,
      paymentId: String,
      signature: String,
      paidAt: Date,
      payerEmail: String,
      payerPhone: String,
    },
    // Cancellation details
    cancellationPolicy: String,
    isCancellable: {
      type: Boolean,
      default: true,
    },
    cancellationDate: Date,
    cancellationReason: String,
    refundAmount: Number,
    // Special requests
    specialRequests: String,
    preferences: {
      type: Map,
      of: String,
    },
    // Booking reference
    bookingReference: {
      type: String,
      unique: true,
      // Not required: true because it's auto-generated in pre-save hook
    },
    confirmationNumber: String,
    // External booking details (if booked through third party)
    externalBooking: {
      provider: String,
      providerId: String,
      providerBookingId: String,
      providerUrl: String,
    },
    // Trip association
    trip: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Trip",
    },
    // Notifications
    reminderSent: {
      type: Boolean,
      default: false,
    },
    confirmationEmailSent: {
      type: Boolean,
      default: false,
    },
    // Metadata
    notes: String,
    tags: [String],
  },
  {
    timestamps: true,
  }
);

// Generate booking reference before saving
bookingSchema.pre("save", async function (next) {
  if (!this.bookingReference) {
    const prefix = this.bookingType.substring(0, 3).toUpperCase();
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    this.bookingReference = `${prefix}-${timestamp}-${random}`;
  }
  next();
});

// Virtual for total price calculation
bookingSchema.virtual("calculatedTotal").get(function () {
  const { basePrice, taxes, serviceFee, discount } = this.pricing;
  return basePrice + taxes + serviceFee - discount;
});

// Instance method to check if booking is upcoming
bookingSchema.methods.isUpcoming = function () {
  const now = new Date();
  const relevantDate =
    this.checkInDate || this.departureDate || this.bookingDate;
  return relevantDate && relevantDate > now;
};

// Instance method to check if booking is past
bookingSchema.methods.isPast = function () {
  const now = new Date();
  const relevantDate =
    this.checkOutDate || this.returnDate || this.departureDate || this.bookingDate;
  return relevantDate && relevantDate < now;
};

// Instance method to calculate duration for accommodations
bookingSchema.methods.getDuration = function () {
  if (this.checkInDate && this.checkOutDate) {
    const diff = this.checkOutDate - this.checkInDate;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }
  if (this.departureDate && this.returnDate) {
    const diff = this.returnDate - this.departureDate;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }
  return 1;
};

// Static method to get user bookings
bookingSchema.statics.getUserBookings = function (userId, options = {}) {
  const query = { user: userId };
  
  if (options.status) {
    query.status = options.status;
  }
  
  if (options.bookingType) {
    query.bookingType = options.bookingType;
  }
  
  return this.find(query)
    .sort({ createdAt: -1 })
    .populate("user", "name email")
    .populate("trip", "title destination startDate endDate");
};

// Static method to get upcoming bookings
bookingSchema.statics.getUpcomingBookings = function (userId) {
  const now = new Date();
  return this.find({
    user: userId,
    status: { $in: ["pending", "confirmed"] },
    $or: [
      { checkInDate: { $gte: now } },
      { departureDate: { $gte: now } },
      { bookingDate: { $gte: now } },
    ],
  })
    .sort({ checkInDate: 1, departureDate: 1, bookingDate: 1 })
    .populate("user", "name email")
    .populate("trip", "title destination");
};

// Indexes for better query performance
bookingSchema.index({ user: 1, status: 1 });
bookingSchema.index({ bookingType: 1 });
// Removed duplicate index - bookingReference already has unique: true which creates an index
bookingSchema.index({ checkInDate: 1, checkOutDate: 1 });
bookingSchema.index({ departureDate: 1 });
bookingSchema.index({ createdAt: -1 });

const Booking = mongoose.model("Booking", bookingSchema);

module.exports = Booking;
