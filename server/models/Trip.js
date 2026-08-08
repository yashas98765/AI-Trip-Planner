const mongoose = require("mongoose");

const expenseSchema = new mongoose.Schema(
  {
    day: {
      type: Number,
      required: true,
      min: 1,
    },
    category: {
      type: String,
      required: true,
      enum: ["food", "transport", "accommodation", "activities", "shopping", "misc"],
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    paidBy: {
      type: String,
      trim: true,
    },
    splitAmong: [String],
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

const tripSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: [true, "Trip title is required"],
      trim: true,
    },
    description: String,

    // Trip details
    destination: {
      city: {
        type: String,
        required: true,
      },
      country: {
        type: String,
        required: true,
      },
      coordinates: {
        lat: Number,
        lng: Number,
      },
    },

    // Trip preferences
    preferences: {
      budget: {
        min: Number,
        max: Number,
        currency: {
          type: String,
          default: "USD",
        },
      },
      duration: {
        type: Number, // in days
        required: true,
      },
      travelStyle: {
        type: String,
        enum: ["budget", "luxury", "adventure", "relaxation", "cultural"],
        default: "budget",
      },
      groupSize: {
        type: Number,
        default: 1,
      },
      interests: [
        {
          type: String,
          enum: [
            "culture",
            "nature",
            "food",
            "adventure",
            "relaxation",
            "shopping",
            "history",
            "nightlife",
          ],
        },
      ],
      accommodation: {
        type: String,
        enum: ["hotel", "hostel", "apartment", "resort"],
        default: "hotel",
      },
      transport: [
        {
          type: String,
          enum: ["flight", "train", "bus", "car", "walking"],
        },
      ],
    },

    // AI-generated itinerary
    itinerary: {
      generatedBy: {
        type: String,
        default: "AI",
      },
      generatedAt: {
        type: Date,
        default: Date.now,
      },
      days: [
        {
          day: Number,
          date: Date,
          title: String, // AI-generated title for the day
          theme: String, // Theme/description of the day
          activities: [
            {
              time: String,
              activity: String,
              location: {
                name: String,
                address: String,
                coordinates: {
                  lat: Number,
                  lng: Number,
                },
              },
              duration: Number, // in hours
              cost: {
                amount: Number,
                currency: String,
              },
              description: String,
              type: {
                type: String,
                enum: [
                  "attraction",
                  "restaurant",
                  "transport",
                  "accommodation",
                  "activity",
                ],
              },
            },
          ],
          totalCost: {
            amount: Number,
            currency: String,
          },
        },
      ],
      totalCost: {
        amount: Number,
        currency: String,
      },
      summary: String,
    },



    // Trip status
    status: {
      type: String,
      enum: ["draft", "upcoming", "ongoing", "completed", "cancelled"],
      default: "draft",
    },

    // Trip dates
    startDate: Date,
    endDate: Date,

    // Additional information
    notes: String,
    isPublic: {
      type: Boolean,
      default: false,
    },
    shareToken: {
      type: String,
      unique: true,
      sparse: true,
    },
    sharedWith: [
      {
        userId: mongoose.Schema.Types.ObjectId,
        email: String,
        permission: {
          type: String,
          enum: ['view', 'edit'],
          default: 'view',
        },
        sharedAt: Date,
      }
    ],
    expenses: [expenseSchema],
    tags: [String],

    // AI suggestions and recommendations
    recommendations: {
      weather: {
        forecast: String,
        bestTime: String,
      },
      localTips: [String],
      mustSee: [String],
      budgetTips: [String],
      safetyTips: [String],
    },

    // Itinerary versioning
    versions: [
      {
        versionNumber: {
          type: Number,
          required: true,
        },
        itinerary: mongoose.Schema.Types.Mixed, // Store complete itinerary
        createdAt: {
          type: Date,
          default: Date.now,
        },
        createdBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        description: String, // Optional description of changes
        isCurrent: {
          type: Boolean,
          default: false,
        },
      },
    ],
    currentVersion: {
      type: Number,
      default: 1,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
tripSchema.index({ user: 1, createdAt: -1 });
tripSchema.index({ status: 1 });
tripSchema.index({ "destination.city": 1, "destination.country": 1 });
tripSchema.index({ startDate: 1, endDate: 1 });

// Virtual for trip duration
tripSchema.virtual("tripDuration").get(function () {
  if (this.startDate && this.endDate) {
    const diffTime = Math.abs(this.endDate - this.startDate);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
  return this.preferences.duration;
});

// Virtual for days until trip
tripSchema.virtual("daysUntilTrip").get(function () {
  if (this.startDate) {
    const now = new Date();
    const diffTime = this.startDate - now;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
  return null;
});

// Method to calculate total cost
tripSchema.methods.calculateTotalCost = function () {
  if (this.itinerary.days && this.itinerary.days.length > 0) {
    const total = this.itinerary.days.reduce((sum, day) => {
      return sum + (day.totalCost?.amount || 0);
    }, 0);
    this.itinerary.totalCost = {
      amount: total,
      currency: this.preferences.budget.currency || "USD",
    };
  }
  return this.save();
};



// Method to update trip status
tripSchema.methods.updateStatus = function (newStatus) {
  this.status = newStatus;

  // Auto-update status based on dates
  if (newStatus === "upcoming" && this.startDate) {
    const now = new Date();
    if (now >= this.startDate && now <= this.endDate) {
      this.status = "ongoing";
    } else if (now > this.endDate) {
      this.status = "completed";
    }
  }

  return this.save();
};

// Method to save itinerary version
tripSchema.methods.saveVersion = function (userId, description) {
  const newVersionNumber = this.currentVersion + 1;
  
  // Mark all previous versions as not current
  this.versions.forEach(v => v.isCurrent = false);
  
  // Add new version
  this.versions.push({
    versionNumber: newVersionNumber,
    itinerary: JSON.parse(JSON.stringify(this.itinerary)), // Deep clone
    createdBy: userId,
    description: description || `Version ${newVersionNumber}`,
    isCurrent: true,
  });
  
  this.currentVersion = newVersionNumber;
  return this.save();
};

// Method to restore a specific version
tripSchema.methods.restoreVersion = async function (versionNumber) {
  const version = this.versions.find(v => v.versionNumber === versionNumber);
  
  if (!version) {
    throw new Error('Version not found');
  }
  
  // Save current state as a version before restoring
  if (!this.versions.find(v => v.versionNumber === this.currentVersion)) {
    await this.saveVersion(this.user, 'Auto-saved before restore');
  }
  
  // Restore the itinerary
  this.itinerary = JSON.parse(JSON.stringify(version.itinerary));
  
  // Mark this version as current
  this.versions.forEach(v => v.isCurrent = (v.versionNumber === versionNumber));
  this.currentVersion = versionNumber;
  
  return this.save();
};

// Method to get version history
tripSchema.methods.getVersionHistory = function () {
  return this.versions.sort((a, b) => b.versionNumber - a.versionNumber);
};

// Method to compare two versions
tripSchema.methods.compareVersions = function (version1, version2) {
  const v1 = this.versions.find(v => v.versionNumber === version1);
  const v2 = this.versions.find(v => v.versionNumber === version2);
  
  if (!v1 || !v2) {
    throw new Error('One or both versions not found');
  }
  
  return {
    version1: {
      number: v1.versionNumber,
      createdAt: v1.createdAt,
      itinerary: v1.itinerary,
    },
    version2: {
      number: v2.versionNumber,
      createdAt: v2.createdAt,
      itinerary: v2.itinerary,
    },
  };
};

// Pre-save middleware to calculate total cost
tripSchema.pre("save", function (next) {
  if (this.isModified("itinerary.days")) {
    this.calculateTotalCost();
  }
  next();
});

module.exports = mongoose.model("Trip", tripSchema);
