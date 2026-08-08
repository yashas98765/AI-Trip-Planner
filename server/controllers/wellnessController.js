const WellnessBooking = require('../models/WellnessBooking');
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

// Helper function to send wellness confirmation email with PDFs
const sendWellnessConfirmation = async (booking) => {
  try {
    // Ensure temp directory exists
    const tempDir = path.join(__dirname, '../temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Generate appointment voucher PDF
    const voucherPath = path.join(__dirname, `../temp/wellness-voucher-${booking.bookingReference}.pdf`);
    await generateAppointmentVoucherPDF(booking, voucherPath);

    // Generate receipt PDF
    const receiptPath = path.join(__dirname, `../temp/wellness-receipt-${booking.bookingReference}.pdf`);
    await generateReceiptPDF(booking, receiptPath);

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: booking.customerDetails.email,
      subject: `Wellness Appointment Confirmed - ${booking.bookingReference}`,
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
              <div class="icon">🧘</div>
              <h1>Appointment Confirmed!</h1>
              <p>Your wellness journey begins</p>
            </div>
            <div class="content">
              <div class="greeting">Hello ${booking.customerDetails.name},</div>
              <div class="message">
                Thank you for booking your wellness appointment with us! Your reservation has been confirmed and we're excited to welcome you for a rejuvenating experience.
              </div>
              
              <div class="booking-details">
                <h2>📋 Appointment Details</h2>
                <div class="detail-row">
                  <span class="detail-label">Booking Reference:</span>
                  <span class="detail-value">${booking.bookingReference}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Service:</span>
                  <span class="detail-value">${booking.serviceDetails.serviceName}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Center:</span>
                  <span class="detail-value">${booking.centerDetails.name}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Date & Time:</span>
                  <span class="detail-value">${new Date(booking.serviceDetails.appointmentDate).toLocaleDateString()} at ${booking.serviceDetails.appointmentTime}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Duration:</span>
                  <span class="detail-value">${booking.serviceDetails.duration}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Number of People:</span>
                  <span class="detail-value">${booking.serviceDetails.numberOfPeople}</span>
                </div>
              </div>

              <div class="total-section">
                <div class="total-label">Total Amount Paid</div>
                <div class="total-amount">₹${booking.pricing.total.toLocaleString()}</div>
                <div style="margin-top: 10px; font-size: 14px; opacity: 0.9;">Transaction ID: ${booking.payment.transactionId}</div>
              </div>

              <div class="info-box">
                <strong>📌 Important Information:</strong><br/>
                • Please arrive 15 minutes before your scheduled time<br/>
                • Bring a valid ID proof for verification<br/>
                • Inform us of any allergies or medical conditions<br/>
                • Cancellation policy: Free cancellation up to 24 hours before appointment<br/>
                • Reschedule requests must be made at least 12 hours in advance
              </div>

              <div class="message">
                Your appointment voucher and payment receipt are attached to this email. Please present the voucher at the wellness center.
              </div>
            </div>
            <div class="footer">
              <p><strong>Need help?</strong> Contact us at support@tripplanner.com or call +91-1800-XXX-XXXX</p>
              <div class="footer-links">
                <a href="#">View Booking</a> | 
                <a href="#">Contact Support</a> | 
                <a href="#">Wellness Tips</a>
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
          filename: `Wellness-Voucher-${booking.bookingReference}.pdf`,
          path: voucherPath,
        },
        {
          filename: `Wellness-Receipt-${booking.bookingReference}.pdf`,
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
    console.error('Error sending wellness confirmation email:', error);
    return false;
  }
};

// Generate appointment voucher PDF
const generateAppointmentVoucherPDF = (booking, outputPath) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const stream = fs.createWriteStream(outputPath);
      doc.pipe(stream);

      // Header with gradient effect
      doc.rect(0, 0, doc.page.width, 120).fill('#667eea');
      
      // Title
      doc.fontSize(28).fillColor('#ffffff').font('Helvetica-Bold')
         .text('🧘 WELLNESS APPOINTMENT VOUCHER', 50, 40, { align: 'center' });
      
      doc.fontSize(14).fillColor('#f0f0f0').font('Helvetica')
         .text('Your path to wellness and relaxation', 50, 80, { align: 'center' });

      // Booking Reference
      doc.fontSize(12).fillColor('#ffffff')
         .text(`Booking Reference: ${booking.bookingReference}`, 50, 105);

      let yPos = 160;

      // Appointment Information Section
      doc.fontSize(16).fillColor('#667eea').font('Helvetica-Bold')
         .text('APPOINTMENT INFORMATION', 50, yPos);
      
      yPos += 30;
      doc.fontSize(11).fillColor('#333333').font('Helvetica');

      const appointmentInfo = [
        ['Service Type:', booking.serviceDetails.serviceName],
        ['Service Category:', booking.serviceDetails.serviceType.replace('_', ' ').toUpperCase()],
        ['Appointment Date:', new Date(booking.serviceDetails.appointmentDate).toLocaleDateString('en-IN', { 
          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
        })],
        ['Appointment Time:', booking.serviceDetails.appointmentTime],
        ['Duration:', booking.serviceDetails.duration],
        ['Number of People:', booking.serviceDetails.numberOfPeople.toString()],
        ['Therapist Preference:', booking.serviceDetails.therapist.toUpperCase()],
      ];

      appointmentInfo.forEach(([label, value]) => {
        doc.font('Helvetica-Bold').text(label, 50, yPos, { continued: true, width: 200 });
        doc.font('Helvetica').text(value, 250, yPos);
        yPos += 20;
      });

      // Wellness Center Section
      yPos += 20;
      doc.fontSize(16).fillColor('#667eea').font('Helvetica-Bold')
         .text('WELLNESS CENTER', 50, yPos);
      
      yPos += 30;
      doc.fontSize(11).fillColor('#333333').font('Helvetica');

      const centerInfo = [
        ['Center Name:', booking.centerDetails.name],
        ['Address:', booking.centerDetails.address],
        ['Contact:', booking.centerDetails.contact || 'N/A'],
      ];

      centerInfo.forEach(([label, value]) => {
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
        ['Age:', booking.customerDetails.age ? booking.customerDetails.age.toString() : 'N/A'],
        ['Gender:', booking.customerDetails.gender ? booking.customerDetails.gender.toUpperCase() : 'N/A'],
      ];

      customerInfo.forEach(([label, value]) => {
        doc.font('Helvetica-Bold').text(label, 50, yPos, { continued: true, width: 200 });
        doc.font('Helvetica').text(value, 250, yPos);
        yPos += 20;
      });

      // QR Code Placeholder
      yPos += 20;
      doc.rect(50, yPos, 150, 150).stroke('#667eea');
      doc.fontSize(10).fillColor('#999999')
         .text('QR Code', 95, yPos + 65, { width: 60, align: 'center' });
      doc.text('(Scan at center)', 75, yPos + 85, { width: 100, align: 'center' });

      // Important Instructions
      const instructionsY = yPos;
      doc.fontSize(14).fillColor('#667eea').font('Helvetica-Bold')
         .text('IMPORTANT INSTRUCTIONS', 250, instructionsY);
      
      doc.fontSize(9).fillColor('#333333').font('Helvetica');
      const instructions = [
        '• Arrive 15 minutes before scheduled time',
        '• Bring valid ID proof for verification',
        '• Inform of any allergies or medical conditions',
        '• Please shower before spa treatments',
        '• Remove jewelry and accessories',
        '• Keep mobile phones on silent',
        '• Pregnant women should consult doctor first',
        '• Avoid heavy meals before appointment',
      ];

      let instructY = instructionsY + 25;
      instructions.forEach((instruction) => {
        doc.text(instruction, 250, instructY, { width: 290 });
        instructY += 15;
      });

      // Special Requests if any
      if (booking.serviceDetails.specialRequests) {
        yPos += 170;
        doc.fontSize(12).fillColor('#667eea').font('Helvetica-Bold')
           .text('SPECIAL REQUESTS:', 50, yPos);
        doc.fontSize(10).fillColor('#333333').font('Helvetica')
           .text(booking.serviceDetails.specialRequests, 50, yPos + 20, { width: 500 });
      }

      // Footer
      doc.fontSize(8).fillColor('#999999').font('Helvetica')
         .text('This voucher is valid only for the date and time mentioned above. Please carry this voucher (printed or digital) to the wellness center.', 
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
const generateReceiptPDF = (booking, outputPath) => {
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

      // Service Details Section
      doc.fontSize(14).fillColor('#667eea').font('Helvetica-Bold')
         .text('SERVICE DETAILS:', 50, yPos);
      
      yPos += 25;
      doc.fontSize(11).fillColor('#333333').font('Helvetica')
         .text(`Service: ${booking.serviceDetails.serviceName}`, 50, yPos);
      yPos += 18;
      doc.text(`Center: ${booking.centerDetails.name}`, 50, yPos);
      yPos += 18;
      doc.text(`Date: ${new Date(booking.serviceDetails.appointmentDate).toLocaleDateString('en-IN')} at ${booking.serviceDetails.appointmentTime}`, 50, yPos);
      yPos += 18;
      doc.text(`Duration: ${booking.serviceDetails.duration}`, 50, yPos);
      yPos += 18;
      doc.text(`Number of People: ${booking.serviceDetails.numberOfPeople}`, 50, yPos);

      yPos += 40;

      // Price Breakdown Table
      doc.fontSize(14).fillColor('#667eea').font('Helvetica-Bold')
         .text('PRICE BREAKDOWN:', 50, yPos);
      
      yPos += 30;

      // Table header
      doc.rect(50, yPos, 500, 25).fill('#f0f0f0');
      doc.fontSize(10).fillColor('#333333').font('Helvetica-Bold')
         .text('Description', 60, yPos + 8)
         .text('Amount', 480, yPos + 8);

      yPos += 25;

      // Table rows
      const priceItems = [
        ['Service Price', `₹${booking.pricing.servicePrice.toLocaleString()}`],
        ['Convenience Fee', `₹${booking.pricing.convenienceFee.toLocaleString()}`],
        ['GST (18%)', `₹${booking.pricing.gst.toLocaleString()}`],
      ];

      priceItems.forEach(([desc, amount]) => {
        doc.rect(50, yPos, 500, 25).stroke('#dddddd');
        doc.fontSize(10).fillColor('#333333').font('Helvetica')
           .text(desc, 60, yPos + 8)
           .text(amount, 480, yPos + 8);
        yPos += 25;
      });

      // Total row
      doc.rect(50, yPos, 500, 30).fill('#667eea');
      doc.fontSize(12).fillColor('#ffffff').font('Helvetica-Bold')
         .text('TOTAL AMOUNT', 60, yPos + 10)
         .text(`₹${booking.pricing.total.toLocaleString()}`, 480, yPos + 10);

      yPos += 50;

      // Payment Info
      doc.fontSize(11).fillColor('#333333').font('Helvetica')
         .text(`Payment Method: ${booking.payment.method.toUpperCase()}`, 50, yPos);
      yPos += 20;
      doc.text(`Payment Status: ${booking.payment.status.toUpperCase()}`, 50, yPos);
      yPos += 20;
      doc.text(`Transaction ID: ${booking.payment.transactionId}`, 50, yPos);

      // Footer
      yPos = doc.page.height - 100;
      doc.fontSize(10).fillColor('#667eea').font('Helvetica-Bold')
         .text('Thank you for choosing our wellness services!', 50, yPos, { align: 'center', width: 500 });
      
      doc.fontSize(8).fillColor('#999999').font('Helvetica')
         .text('This is a computer-generated receipt and does not require a signature.', 
               50, yPos + 25, { align: 'center', width: 500 });
      doc.text('For support, contact: support@tripplanner.com | +91-1800-XXX-XXXX', 
               50, yPos + 40, { align: 'center', width: 500 });

      doc.end();
      stream.on('finish', resolve);
      stream.on('error', reject);
    } catch (error) {
      reject(error);
    }
  });
};

// Create wellness booking
exports.createWellnessBooking = async (req, res) => {
  try {
    console.log('===== CREATE WELLNESS BOOKING CALLED =====');
    console.log('User ID:', req.user?._id);
    console.log('Request Body:', JSON.stringify(req.body, null, 2));
    
    const userId = req.user._id;

    // Generate transaction ID
    const transactionId = `TXN${Date.now()}${Math.floor(Math.random() * 10000)}`;

    const bookingData = {
      user: userId,
      centerDetails: req.body.centerDetails,
      customerDetails: req.body.customerDetails,
      serviceDetails: req.body.serviceDetails,
      pricing: req.body.pricing,
      payment: {
        ...req.body.payment,
        status: 'completed',
        transactionId,
      },
    };

    console.log('Booking Data:', JSON.stringify(bookingData, null, 2));

    const booking = new WellnessBooking(bookingData);
    await booking.save();

    console.log('Booking saved successfully:', booking.bookingReference);

    // Send confirmation email with PDFs
    const emailSent = await sendWellnessConfirmation(booking);
    booking.emailSent = emailSent;
    await booking.save();

    res.status(201).json({
      success: true,
      message: 'Wellness booking created successfully',
      booking,
    });
  } catch (error) {
    console.error('Error creating wellness booking:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Failed to create wellness booking',
      error: error.message,
    });
  }
};

// Get all wellness bookings for a user
exports.getUserWellnessBookings = async (req, res) => {
  try {
    const userId = req.user._id;
    const bookings = await WellnessBooking.find({ user: userId }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      bookings,
    });
  } catch (error) {
    console.error('Error fetching wellness bookings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch wellness bookings',
      error: error.message,
    });
  }
};

// Get a single wellness booking by ID
exports.getWellnessBookingById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const booking = await WellnessBooking.findOne({ _id: id, user: userId });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Wellness booking not found',
      });
    }

    res.status(200).json({
      success: true,
      booking,
    });
  } catch (error) {
    console.error('Error fetching wellness booking:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch wellness booking',
      error: error.message,
    });
  }
};

// Update wellness booking status
exports.updateWellnessBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const { bookingStatus } = req.body;

    const booking = await WellnessBooking.findOneAndUpdate(
      { _id: id, user: userId },
      { bookingStatus },
      { new: true }
    );

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Wellness booking not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Wellness booking updated successfully',
      booking,
    });
  } catch (error) {
    console.error('Error updating wellness booking:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update wellness booking',
      error: error.message,
    });
  }
};

// Cancel wellness booking
exports.cancelWellnessBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const booking = await WellnessBooking.findOneAndUpdate(
      { _id: id, user: userId },
      { bookingStatus: 'cancelled' },
      { new: true }
    );

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Wellness booking not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Wellness booking cancelled successfully',
      booking,
    });
  } catch (error) {
    console.error('Error cancelling wellness booking:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel wellness booking',
      error: error.message,
    });
  }
};

// Resend confirmation email
exports.resendWellnessConfirmation = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const booking = await WellnessBooking.findOne({ _id: id, user: userId });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Wellness booking not found',
      });
    }

    const emailSent = await sendWellnessConfirmation(booking);

    res.status(200).json({
      success: true,
      message: emailSent ? 'Confirmation email sent successfully' : 'Failed to send confirmation email',
      emailSent,
    });
  } catch (error) {
    console.error('Error resending wellness confirmation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to resend confirmation email',
      error: error.message,
    });
  }
};
