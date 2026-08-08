const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');
const Trip = require('../models/Trip');
const { sendTripConfirmation } = require('../utils/emailService');

async function testTripEmailWithPDF() {
  try {
    console.log('🔄 Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    console.log('📋 Fetching one trip...');
    const trip = await Trip.findOne().populate('user', 'email name');
    
    if (!trip) {
      console.log('❌ No trips found in database');
      process.exit(0);
    }

    if (!trip.user || !trip.user.email) {
      console.log('❌ Trip has no user email');
      process.exit(0);
    }

    console.log(`\n📧 Sending test email with PDF attachments...`);
    console.log(`   Trip: ${trip.title}`);
    console.log(`   To: ${trip.user.email}\n`);

    const result = await sendTripConfirmation(
      trip.user.email,
      trip.user.name || trip.user.email,
      trip.toObject()
    );

    if (result.success) {
      console.log(`✅ SUCCESS!`);
      console.log(`   Message ID: ${result.messageId}`);
      console.log(`   Check your email for:`);
      console.log(`   - Trip confirmation email`);
      console.log(`   - Trip Invoice PDF attachment`);
      console.log(`   - Trip Receipt PDF attachment\n`);
    } else {
      console.log(`❌ Failed to send email`);
      console.log(`   Error: ${result.error}\n`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
}

testTripEmailWithPDF();
