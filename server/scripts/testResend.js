const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');
const Booking = require('../models/Booking');
const { sendBookingConfirmation } = require('../utils/emailService');

async function testResendAPI() {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.error('❌ ERROR: RESEND_API_KEY is not defined in your server/.env file.');
      console.log('Please add: RESEND_API_KEY=re_your_api_key_here');
      process.exit(1);
    }

    console.log('🔄 Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    console.log('📋 Fetching one booking...');
    const booking = await Booking.findOne().populate('user', 'email name');
    
    if (!booking) {
      console.log('❌ No bookings found in database to use for testing.');
      process.exit(0);
    }

    // Set fallback name/email if user doesn't have it, and force recipient to user email
    const recipientEmail = booking.user?.email || 'yashassh2601@gmail.com';
    const recipientName = booking.user?.name || 'Test User';

    console.log(`\n📧 Sending test email via RESEND HTTP API...`);
    console.log(`   Booking Ref: ${booking.bookingReference}`);
    console.log(`   Recipient  : ${recipientEmail}\n`);

    const result = await sendBookingConfirmation(
      recipientEmail,
      recipientName,
      booking.toObject()
    );

    if (result.success) {
      console.log(`\n✅ SUCCESS! Email sent via Resend API.`);
      console.log(`   Message ID: ${result.messageId}\n`);
    } else {
      console.log(`\n❌ FAILED to send email.`);
      console.log(`   Error: ${result.error}\n`);
    }

  } catch (error) {
    console.error('❌ Error during Resend test:', error.message);
    console.error(error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
}

testResendAPI();
