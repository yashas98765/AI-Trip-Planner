const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');
const Booking = require('../models/Booking');
const { sendBookingConfirmation } = require('../utils/emailService');

async function testBookingEmailWithPDF() {
  try {
    console.log('🔄 Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    console.log('📋 Fetching one booking...');
    const booking = await Booking.findOne().populate('user', 'email name');
    
    if (!booking) {
      console.log('❌ No bookings found in database');
      process.exit(0);
    }

    if (!booking.user || !booking.user.email) {
      console.log('❌ Booking has no user email');
      process.exit(0);
    }

    console.log(`\n📧 Sending test email with PDF attachments...`);
    console.log(`   Booking: ${booking.bookingReference}`);
    console.log(`   To: ${booking.user.email}\n`);

    const result = await sendBookingConfirmation(
      booking.user.email,
      booking.user.name || booking.user.email,
      booking.toObject()
    );

    if (result.success) {
      console.log(`✅ SUCCESS!`);
      console.log(`   Message ID: ${result.messageId}`);
      console.log(`   Check your email for:`);
      console.log(`   - Confirmation email`);
      console.log(`   - Invoice PDF attachment`);
      console.log(`   - Receipt PDF attachment\n`);
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

testBookingEmailWithPDF();
