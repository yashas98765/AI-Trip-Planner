const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');
const Trip = require('../models/Trip');
const { sendBookingConfirmation, sendTripConfirmation } = require('../utils/emailService');

// Add a delay between emails to avoid rate limiting
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function sendExistingTripConfirmations() {
  try {
    console.log('🔄 Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Fetch all trips with user information
    console.log('📋 Fetching existing trips...');
    const trips = await Trip.find().populate('user', 'email name');
    console.log(`Found ${trips.length} trips\n`);

    let successCount = 0;
    let failureCount = 0;
    let skippedCount = 0;

    console.log('📧 Sending confirmation emails...\n');

    for (let i = 0; i < trips.length; i++) {
      const trip = trips[i];
      
      // Skip if user data is missing
      if (!trip.user || !trip.user.email) {
        console.log(`⚠️  Skipping Trip ${trip._id} - No user email found`);
        skippedCount++;
        continue;
      }

      try {
        console.log(`[${i + 1}/${trips.length}] Sending email for trip: ${trip.title}`);
        console.log(`   📧 To: ${trip.user.email}`);
        
        const result = await sendTripConfirmation(
          trip.user.email,
          trip.user.name || trip.user.email,
          trip.toObject()
        );

        if (result.success) {
          console.log(`   ✅ Success - Message ID: ${result.messageId}\n`);
          successCount++;
        } else {
          console.log(`   ❌ Failed to send email\n`);
          failureCount++;
        }

        // Wait 2 seconds between emails to avoid rate limiting
        if (i < trips.length - 1) {
          await delay(2000);
        }

      } catch (error) {
        console.log(`   ❌ Error: ${error.message}\n`);
        failureCount++;
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log('📊 EMAIL SENDING SUMMARY');
    console.log('='.repeat(50));
    console.log(`Total Trips: ${trips.length}`);
    console.log(`✅ Successfully Sent: ${successCount}`);
    console.log(`❌ Failed: ${failureCount}`);
    console.log(`⚠️  Skipped: ${skippedCount}`);
    console.log('='.repeat(50) + '\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
}

async function sendExistingBookingConfirmations() {
  try {
    console.log('🔄 Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Note: You'll need to create a Booking model if it doesn't exist
    // For now, checking if it exists
    let Booking;
    try {
      Booking = require('../models/Booking');
    } catch (error) {
      console.log('⚠️  Booking model not found. Skipping booking confirmations.');
      console.log('   If you have bookings stored elsewhere, please update this script.\n');
      await mongoose.connection.close();
      return;
    }

    console.log('📋 Fetching existing bookings...');
    const bookings = await Booking.find().populate('user', 'email name');
    console.log(`Found ${bookings.length} bookings\n`);

    let successCount = 0;
    let failureCount = 0;
    let skippedCount = 0;

    console.log('📧 Sending confirmation emails...\n');

    for (let i = 0; i < bookings.length; i++) {
      const booking = bookings[i];
      
      // Skip if user data is missing
      if (!booking.user || !booking.user.email) {
        console.log(`⚠️  Skipping Booking ${booking.bookingReference} - No user email found`);
        skippedCount++;
        continue;
      }

      try {
        console.log(`[${i + 1}/${bookings.length}] Sending email for booking: ${booking.bookingReference}`);
        console.log(`   📧 To: ${booking.user.email}`);
        
        const result = await sendBookingConfirmation(
          booking.user.email,
          booking.user.name || booking.user.email,
          booking.toObject()
        );

        if (result.success) {
          console.log(`   ✅ Success - Message ID: ${result.messageId}\n`);
          successCount++;
        } else {
          console.log(`   ❌ Failed to send email\n`);
          failureCount++;
        }

        // Wait 2 seconds between emails to avoid rate limiting
        if (i < bookings.length - 1) {
          await delay(2000);
        }

      } catch (error) {
        console.log(`   ❌ Error: ${error.message}\n`);
        failureCount++;
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log('📊 EMAIL SENDING SUMMARY');
    console.log('='.repeat(50));
    console.log(`Total Bookings: ${bookings.length}`);
    console.log(`✅ Successfully Sent: ${successCount}`);
    console.log(`❌ Failed: ${failureCount}`);
    console.log(`⚠️  Skipped: ${skippedCount}`);
    console.log('='.repeat(50) + '\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
}

// Command line interface
const args = process.argv.slice(2);
const command = args[0];

console.log('\n' + '='.repeat(50));
console.log('📧 SEND EXISTING CONFIRMATIONS SCRIPT');
console.log('='.repeat(50) + '\n');

if (command === 'trips') {
  console.log('🎯 Mode: Sending trip confirmations\n');
  sendExistingTripConfirmations();
} else if (command === 'bookings') {
  console.log('🎯 Mode: Sending booking confirmations\n');
  sendExistingBookingConfirmations();
} else if (command === 'all') {
  console.log('🎯 Mode: Sending all confirmations\n');
  (async () => {
    await sendExistingBookingConfirmations();
    console.log('\n' + '─'.repeat(50) + '\n');
    await sendExistingTripConfirmations();
  })();
} else {
  console.log('Usage: node sendExistingConfirmations.js [trips|bookings|all]\n');
  console.log('Examples:');
  console.log('  node sendExistingConfirmations.js trips     - Send confirmations for all trips');
  console.log('  node sendExistingConfirmations.js bookings  - Send confirmations for all bookings');
  console.log('  node sendExistingConfirmations.js all       - Send confirmations for both\n');
  process.exit(1);
}
