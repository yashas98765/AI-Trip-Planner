const ActivityBooking = require('../models/ActivityBooking');
const nodemailer = require('nodemailer');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// Email configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Helper function to send activity confirmation email with PDFs
const sendActivityConfirmation = async (booking) => {
  try {
    // Ensure temp directory exists
    const tempDir = path.join(__dirname, '../temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Generate activity voucher PDF
    const voucherPath = path.join(__dirname, `../temp/activity-voucher-${booking.bookingReference}.pdf`);
    await generateActivityVoucherPDF(booking, voucherPath);

    // Generate receipt PDF
    const receiptPath = path.join(__dirname, `../temp/activity-receipt-${booking.bookingReference}.pdf`);
    await generateActivityReceiptPDF(booking, receiptPath);

    // Get activity type display name
    const activityTypeNames = {
      adventure: 'Adventure Activity',
      theme_park: 'Theme Park',
      guided_tour: 'Guided Tour',
      cruise: 'Cruise',
      boat_ride: 'Boat Ride',
      hostel: 'Hostel',
      resort: 'Resort',
      homestay: 'Homestay'
    };

    const activityTypeName = activityTypeNames[booking.activityType] || 'Activity';

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: booking.customerDetails.email,
      subject: `${activityTypeName} Booking Confirmed - ${booking.bookingReference}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f5f5f5; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 30px; text-align: center; }
            .header h1 { margin: 0; font-size: 28px; font-weight: 600; }
            .header p { margin: 10px 0 0; opacity: 0.95; font-size: 16px; }
            .content { padding: 40px 30px; }
            .greeting { font-size: 18px; color: #667eea; font-weight: 600; margin-bottom: 20px; }
            .message { color: #555; margin-bottom: 30px; font-size: 15px; line-height: 1.8; }
            .booking-details { background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%); border-radius: 10px; padding: 25px; margin: 25px 0; }
            .booking-details h2 { color: #667eea; margin: 0 0 20px; font-size: 20px; }
            .detail-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.5); }
            .detail-row:last-child { border-bottom: none; }
            .detail-label { color: #555; font-weight: 600; }
            .detail-value { color: #333; font-weight: 600; text-align: right; }
            .total-section { background: #667eea; color: white; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
            .total-label { font-size: 14px; margin-bottom: 5px; opacity: 0.9; }
            .total-amount { font-size: 32px; font-weight: bold; }
            .info-box { background: #e8f4f8; border-left: 4px solid #17a2b8; padding: 15px; margin: 20px 0; border-radius: 4px; }
            .footer { background: #f8f9fa; padding: 30px; text-align: center; color: #666; font-size: 13px; }
            .footer-links { margin: 15px 0; }
            .footer-links a { color: #667eea; text-decoration: none; margin: 0 10px; }
            .icon { font-size: 40px; margin-bottom: 10px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="icon">🎉</div>
              <h1>Booking Confirmed!</h1>
              <p>Your ${activityTypeName} is booked</p>
            </div>
            <div class="content">
              <div class="greeting">Hello ${booking.customerDetails.name},</div>
              <div class="message">
                Thank you for booking with us! Your reservation has been confirmed and we're excited to have you join us for an amazing experience.
              </div>
              
              <div class="booking-details">
                <h2>📋 Booking Details</h2>
                <div class="detail-row">
                  <span class="detail-label">Booking Reference:</span>
                  <span class="detail-value">${booking.bookingReference}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Activity Type:</span>
                  <span class="detail-value">${activityTypeName}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Activity Name:</span>
                  <span class="detail-value">${booking.bookingDetails.activityName}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Place:</span>
                  <span class="detail-value">${booking.placeDetails.name}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Date:</span>
                  <span class="detail-value">${new Date(booking.bookingDetails.bookingDate).toLocaleDateString()}</span>
                </div>
                ${booking.bookingDetails.bookingTime ? `
                <div class="detail-row">
                  <span class="detail-label">Time:</span>
                  <span class="detail-value">${booking.bookingDetails.bookingTime}</span>
                </div>
                ` : ''}
                <div class="detail-row">
                  <span class="detail-label">Number of People:</span>
                  <span class="detail-value">${booking.bookingDetails.numberOfPeople}</span>
                </div>
                ${booking.bookingDetails.checkInDate && booking.bookingDetails.checkOutDate ? `
                <div class="detail-row">
                  <span class="detail-label">Check-in:</span>
                  <span class="detail-value">${new Date(booking.bookingDetails.checkInDate).toLocaleDateString()}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Check-out:</span>
                  <span class="detail-value">${new Date(booking.bookingDetails.checkOutDate).toLocaleDateString()}</span>
                </div>
                ` : ''}
              </div>

              <div class="total-section">
                <div class="total-label">Total Amount Paid</div>
                <div class="total-amount">₹${booking.pricing.total.toLocaleString()}</div>
                <div style="margin-top: 10px; font-size: 14px; opacity: 0.9;">Transaction ID: ${booking.payment.transactionId}</div>
              </div>

              <div class="info-box">
                <strong>📌 Important Information:</strong><br/>
                • Please arrive 15 minutes before scheduled time<br/>
                • Bring a valid ID proof for verification<br/>
                • Present the voucher (digital or printed) at the venue<br/>
                • ${booking.cancellationPolicy}<br/>
                ${booking.bookingDetails.specialRequests ? `• Special requests: ${booking.bookingDetails.specialRequests}` : ''}
              </div>

              <div class="message">
                Your booking voucher and payment receipt are attached to this email. We look forward to seeing you!
              </div>
            </div>
            <div class="footer">
              <p><strong>Need help?</strong> Contact us at support@tripplanner.com or call +91-1800-XXX-XXXX</p>
              <div class="footer-links">
                <a href="#">View Booking</a> | 
                <a href="#">Contact Support</a> | 
                <a href="#">Travel Tips</a>
              </div>
              <p style="margin-top: 20px; color: #999; font-size: 12px;">
                This is an automated email. Please do not reply to this message.<br/>
                © ${new Date().getFullYear()} AI Trip Planner. All rights reserved.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
      attachments: [
        {
          filename: `Activity-Voucher-${booking.bookingReference}.pdf`,
          path: voucherPath,
        },
        {
          filename: `Activity-Receipt-${booking.bookingReference}.pdf`,
          path: receiptPath,
        },
      ],
    };

    await transporter.sendMail(mailOptions);

    // Clean up temp files
    fs.unlinkSync(voucherPath);
    fs.unlinkSync(receiptPath);

    return true;
  } catch (error) {
    console.error('Error sending activity confirmation email:', error);
    return false;
  }
};

// Generate activity voucher PDF
const generateActivityVoucherPDF = (booking, outputPath) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const stream = fs.createWriteStream(outputPath);
      doc.pipe(stream);

      // Header with gradient effect
      doc.rect(0, 0, doc.page.width, 120).fill('#667eea');
      
      // Title
      const activityTypeNames = {
        adventure: '🏔️ ADVENTURE ACTIVITY',
        theme_park: '🎢 THEME PARK',
        guided_tour: '🗺️ GUIDED TOUR',
        cruise: '🚢 CRUISE',
        boat_ride: '⛵ BOAT RIDE',
        hostel: '🏨 HOSTEL',
        resort: '🏖️ RESORT',
        homestay: '🏠 HOMESTAY'
      };

      doc.fontSize(28).fillColor('#ffffff').font('Helvetica-Bold')
         .text(activityTypeNames[booking.activityType] || 'ACTIVITY VOUCHER', 50, 40, { align: 'center' });
      
      doc.fontSize(14).fillColor('#f0f0f0').font('Helvetica')
         .text('Your adventure awaits!', 50, 80, { align: 'center' });

      // Booking Reference
      doc.fontSize(12).fillColor('#ffffff')
         .text(`Booking Reference: ${booking.bookingReference}`, 50, 105);

      let yPos = 160;

      // Booking Information Section
      doc.fontSize(16).fillColor('#667eea').font('Helvetica-Bold')
         .text('BOOKING INFORMATION', 50, yPos);
      
      yPos += 30;
      doc.fontSize(11).fillColor('#333333').font('Helvetica');

      const bookingInfo = [
        ['Activity Name:', booking.bookingDetails.activityName],
        ['Date:', new Date(booking.bookingDetails.bookingDate).toLocaleDateString('en-IN', { 
          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
        })],
      ];

      if (booking.bookingDetails.bookingTime) {
        bookingInfo.push(['Time:', booking.bookingDetails.bookingTime]);
      }
      if (booking.bookingDetails.checkInDate) {
        bookingInfo.push(['Check-in:', new Date(booking.bookingDetails.checkInDate).toLocaleDateString('en-IN')]);
      }
      if (booking.bookingDetails.checkOutDate) {
        bookingInfo.push(['Check-out:', new Date(booking.bookingDetails.checkOutDate).toLocaleDateString('en-IN')]);
      }
      bookingInfo.push(
        ['Number of People:', booking.bookingDetails.numberOfPeople.toString()],
        ['Duration:', booking.bookingDetails.duration]
      );

      bookingInfo.forEach(([label, value]) => {
        doc.font('Helvetica-Bold').text(label, 50, yPos, { continued: true, width: 200 });
        doc.font('Helvetica').text(value, 250, yPos);
        yPos += 20;
      });

      // Place Details Section
      yPos += 20;
      doc.fontSize(16).fillColor('#667eea').font('Helvetica-Bold')
         .text('PLACE DETAILS', 50, yPos);
      
      yPos += 30;
      doc.fontSize(11).fillColor('#333333').font('Helvetica');

      const placeInfo = [
        ['Place Name:', booking.placeDetails.name],
        ['Address:', booking.placeDetails.address],
        ['Contact:', booking.placeDetails.contact || 'N/A'],
      ];

      placeInfo.forEach(([label, value]) => {
        doc.font('Helvetica-Bold').text(label, 50, yPos, { continued: true, width: 200 });
        doc.font('Helvetica').text(value, 250, yPos, { width: 300 });
        yPos += label === 'Address:' ? 30 : 20;
      });

      // Customer Details Section
      yPos += 20;
      doc.fontSize(16).fillColor('#667eea').font('Helvetica-Bold')
         .text('CUSTOMER DETAILS', 50, yPos);
      
      yPos += 30;
      doc.fontSize(11).fillColor('#333333').font('Helvetica');

      const customerInfo = [
        ['Name:', booking.customerDetails.name],
        ['Email:', booking.customerDetails.email],
        ['Phone:', booking.customerDetails.phone],
      ];

      customerInfo.forEach(([label, value]) => {
        doc.font('Helvetica-Bold').text(label, 50, yPos, { continued: true, width: 200 });
        doc.font('Helvetica').text(value, 250, yPos, { width: 300 });
        yPos += 20;
      });

      // QR Code Placeholder
      yPos += 20;
      doc.rect(50, yPos, 150, 150).stroke('#667eea');
      doc.fontSize(10).fillColor('#999999')
         .text('QR Code', 95, yPos + 65, { width: 60, align: 'center' });
      doc.text('(Scan at venue)', 75, yPos + 85, { width: 100, align: 'center' });

      // Important Instructions
      const instructionsY = yPos;
      doc.fontSize(14).fillColor('#667eea').font('Helvetica-Bold')
         .text('IMPORTANT INSTRUCTIONS', 250, instructionsY);
      
      doc.fontSize(9).fillColor('#333333').font('Helvetica');
      const instructions = [
        '• Arrive 15 minutes early',
        '• Bring valid ID proof',
        '• Present this voucher at entry',
        '• Follow safety guidelines',
        '• Check weather conditions',
        '• Wear comfortable clothing',
        '• Keep belongings secure',
        '• Emergency contact available',
      ];

      let instructY = instructionsY + 25;
      instructions.forEach((instruction) => {
        doc.text(instruction, 250, instructY, { width: 290 });
        instructY += 15;
      });

      // Footer
      doc.fontSize(8).fillColor('#999999').font('Helvetica')
         .text('This voucher is valid only for the date and time mentioned above. Please carry this voucher (printed or digital) to the venue.', 
               50, doc.page.height - 80, { align: 'center', width: doc.page.width - 100 });
      
      doc.text('For queries, contact: support@tripplanner.com | +91-1800-XXX-XXXX', 
               50, doc.page.height - 60, { align: 'center', width: doc.page.width - 100 });

      doc.end();
      stream.on('finish', resolve);
      stream.on('error', reject);
    } catch (error) {
      reject(error);
    }
  });
};

// Generate receipt PDF
const generateActivityReceiptPDF = (booking, outputPath) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const stream = fs.createWriteStream(outputPath);
      doc.pipe(stream);

      // Header
      doc.rect(0, 0, doc.page.width, 100).fill('#667eea');
      doc.fontSize(26).fillColor('#ffffff').font('Helvetica-Bold')
         .text('PAYMENT RECEIPT', 50, 35, { align: 'center' });
      
      doc.fontSize(12).fillColor('#f0f0f0').font('Helvetica')
         .text(`Receipt #: ${booking.bookingReference}`, 50, 70, { align: 'center' });

      let yPos = 140;

      // Receipt header info
      doc.fontSize(10).fillColor('#666666').font('Helvetica')
         .text(`Date: ${new Date().toLocaleDateString('en-IN')}`, 50, yPos);
      doc.text(`Transaction ID: ${booking.payment.transactionId}`, 400, yPos);

      yPos += 40;

      // Bill To Section
      doc.fontSize(14).fillColor('#667eea').font('Helvetica-Bold')
         .text('BILL TO:', 50, yPos);
      
      yPos += 25;
      doc.fontSize(11).fillColor('#333333').font('Helvetica')
         .text(booking.customerDetails.name, 50, yPos);
      yPos += 18;
      doc.text(booking.customerDetails.email, 50, yPos);
      yPos += 18;
      doc.text(booking.customerDetails.phone, 50, yPos);

      yPos += 40;

      // Payment Details Table
      doc.fontSize(14).fillColor('#667eea').font('Helvetica-Bold')
         .text('PAYMENT DETAILS:', 50, yPos);
      
      yPos += 30;

      // Table Header
      doc.rect(50, yPos, 495, 25).fill('#f0f0f0');
      doc.fontSize(11).fillColor('#333333').font('Helvetica-Bold')
         .text('Description', 60, yPos + 8);
      doc.text('Amount (₹)', 450, yPos + 8);

      yPos += 30;

      // Table Rows
      const items = [
        ['Base Price', booking.pricing.basePrice],
        ['Convenience Fee', booking.pricing.convenienceFee],
        ['GST (18%)', booking.pricing.gst],
      ];

      if (booking.pricing.discount > 0) {
        items.push(['Discount', -booking.pricing.discount]);
      }

      doc.fontSize(10).fillColor('#333333').font('Helvetica');
      items.forEach(([desc, amount]) => {
        doc.text(desc, 60, yPos);
        doc.text(amount.toLocaleString(), 450, yPos);
        yPos += 25;
        doc.moveTo(50, yPos).lineTo(545, yPos).stroke('#e0e0e0');
        yPos += 5;
      });

      // Total
      yPos += 10;
      doc.fontSize(14).font('Helvetica-Bold')
         .rect(50, yPos, 495, 35).fill('#667eea');
      doc.fillColor('#ffffff')
         .text('TOTAL PAID', 60, yPos + 10);
      doc.text(`₹${booking.pricing.total.toLocaleString()}`, 450, yPos + 10);

      yPos += 60;

      // Payment Method
      doc.fontSize(11).fillColor('#333333').font('Helvetica')
         .text(`Payment Method: ${booking.payment.method.toUpperCase()}`, 50, yPos);
      yPos += 20;
      doc.text(`Payment Status: ${booking.payment.status.toUpperCase()}`, 50, yPos);
      yPos += 20;
      doc.text(`Paid At: ${new Date(booking.payment.paidAt).toLocaleString('en-IN')}`, 50, yPos);

      // Footer
      doc.fontSize(8).fillColor('#999999')
         .text('Thank you for your business!', 50, doc.page.height - 80, { align: 'center', width: doc.page.width - 100 });
      doc.text('This is a computer-generated receipt and does not require a signature.', 
               50, doc.page.height - 65, { align: 'center', width: doc.page.width - 100 });

      doc.end();
      stream.on('finish', resolve);
      stream.on('error', reject);
    } catch (error) {
      reject(error);
    }
  });
};

// Create activity booking
exports.createActivityBooking = async (req, res) => {
  try {
    console.log('=== CREATE ACTIVITY BOOKING REQUEST ===');
    console.log('User:', req.user?._id);
    console.log('Body:', JSON.stringify(req.body, null, 2));
    
    const userId = req.user._id;

    // Validate required fields
    if (!req.body.activityType) {
      console.error('Missing activityType');
      return res.status(400).json({
        success: false,
        message: 'Activity type is required',
      });
    }

    if (!req.body.placeDetails?.name) {
      console.error('Missing place details');
      return res.status(400).json({
        success: false,
        message: 'Place details are required',
      });
    }

    if (!req.body.customerDetails?.name || !req.body.customerDetails?.email || !req.body.customerDetails?.phone) {
      console.error('Missing customer details');
      return res.status(400).json({
        success: false,
        message: 'Customer details (name, email, phone) are required',
      });
    }

    if (!req.body.bookingDetails?.activityName || !req.body.bookingDetails?.bookingDate) {
      console.error('Missing booking details');
      return res.status(400).json({
        success: false,
        message: 'Booking details (activity name, date) are required',
      });
    }

    if (!req.body.pricing?.basePrice || !req.body.pricing?.gst || !req.body.pricing?.total) {
      console.error('Missing pricing details');
      return res.status(400).json({
        success: false,
        message: 'Pricing details are required',
      });
    }

    if (!req.body.payment?.method) {
      console.error('Missing payment method');
      return res.status(400).json({
        success: false,
        message: 'Payment method is required',
      });
    }

    // Generate transaction ID
    const transactionId = `TXN${Date.now()}${Math.floor(Math.random() * 10000)}`;

    const bookingData = {
      user: userId,
      activityType: req.body.activityType,
      placeDetails: req.body.placeDetails,
      customerDetails: req.body.customerDetails,
      bookingDetails: req.body.bookingDetails,
      pricing: req.body.pricing,
      payment: {
        ...req.body.payment,
        status: 'completed',
        transactionId,
      },
    };

    console.log('Creating booking with data:', JSON.stringify(bookingData, null, 2));

    const booking = new ActivityBooking(bookingData);
    await booking.save();

    console.log('Booking saved successfully:', booking.bookingReference);

    // Send confirmation email with PDFs
    try {
      const emailSent = await sendActivityConfirmation(booking);
      booking.emailSent = emailSent;
      await booking.save();
      console.log('Email sent:', emailSent);
    } catch (emailError) {
      console.error('Email error (non-fatal):', emailError.message);
      // Don't fail the booking if email fails
    }

    res.status(201).json({
      success: true,
      message: 'Activity booking created successfully',
      booking,
    });
  } catch (error) {
    console.error('=== ERROR CREATING ACTIVITY BOOKING ===');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    if (error.errors) {
      console.error('Validation errors:', error.errors);
    }
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create activity booking',
      error: error.message,
    });
  }
};

// Get all activity bookings for user
exports.getUserActivityBookings = async (req, res) => {
  try {
    const userId = req.user._id;
    const bookings = await ActivityBooking.find({ user: userId }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      bookings,
    });
  } catch (error) {
    console.error('Error fetching activity bookings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch activity bookings',
      error: error.message,
    });
  }
};

// Get single activity booking by ID
exports.getActivityBookingById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const booking = await ActivityBooking.findOne({ _id: id, user: userId });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Activity booking not found',
      });
    }

    res.status(200).json({
      success: true,
      booking,
    });
  } catch (error) {
    console.error('Error fetching activity booking:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch activity booking',
      error: error.message,
    });
  }
};

// Update activity booking
exports.updateActivityBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const updates = req.body;

    const booking = await ActivityBooking.findOneAndUpdate(
      { _id: id, user: userId },
      updates,
      { new: true, runValidators: true }
    );

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Activity booking not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Activity booking updated successfully',
      booking,
    });
  } catch (error) {
    console.error('Error updating activity booking:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update activity booking',
      error: error.message,
    });
  }
};

// Cancel activity booking
exports.cancelActivityBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const booking = await ActivityBooking.findOne({ _id: id, user: userId });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Activity booking not found',
      });
    }

    if (booking.bookingStatus === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Booking is already cancelled',
      });
    }

    booking.bookingStatus = 'cancelled';
    booking.payment.status = 'refunded';
    await booking.save();

    res.status(200).json({
      success: true,
      message: 'Activity booking cancelled successfully',
      booking,
    });
  } catch (error) {
    console.error('Error cancelling activity booking:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel activity booking',
      error: error.message,
    });
  }
};

// Resend confirmation email
exports.resendActivityConfirmation = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const booking = await ActivityBooking.findOne({ _id: id, user: userId });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Activity booking not found',
      });
    }

    const emailSent = await sendActivityConfirmation(booking);

    res.status(200).json({
      success: true,
      message: emailSent ? 'Confirmation email sent successfully' : 'Failed to send confirmation email',
      emailSent,
    });
  } catch (error) {
    console.error('Error resending activity confirmation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to resend confirmation email',
      error: error.message,
    });
  }
};
