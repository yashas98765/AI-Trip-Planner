const mongoose = require("mongoose");
const User = require("../models/User");
require("dotenv").config();

async function createTestUser() {
  try {
    // Connect to MongoDB
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/ai-trip-planner"
    );
    console.log("✅ Connected to MongoDB");

    // Check if test user already exists
    const existingUser = await User.findOne({ email: "test@example.com" });
    if (existingUser) {
      console.log("ℹ️  Test user already exists");
      console.log("📧 Email: test@example.com");
      console.log("🔐 Password: Test@123456");
      await mongoose.disconnect();
      return;
    }

    // Create test user
    const testUser = new User({
      name: "Test User",
      email: "test@example.com",
      password: "Test@123456", // Will be hashed by pre-save hook
      phone: "+1234567890",
      termsAccepted: true,
      privacyPolicyAccepted: true,
      dataProcessingConsent: true,
      newsletter: false,
      isActive: true,
      createdFrom: "web",
    });

    await testUser.save();

    console.log("✅ Test user created successfully!");
    console.log("📧 Email: test@example.com");
    console.log("🔐 Password: Test@123456");
    console.log(
      "\nUse these credentials to test login at http://localhost:3000"
    );

    await mongoose.disconnect();
  } catch (error) {
    console.error("❌ Error creating test user:", error);
    process.exit(1);
  }
}

createTestUser();
