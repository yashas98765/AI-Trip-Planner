const EventBooking = require('../models/EventBooking');
const PDFDocument = require('pdfkit');
const nodemailer = require('nodemailer');

// Email transporter configuration
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: process.env.EMAIL_PORT || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER || 'your-email@gmail.com',
    pass: process.env.EMAIL_PASS || 'your-app-password',
  },
});

// Helper function to send confirmation email with PDFs
async function sendEventConfirmation(booking) {
  try {
    const ticketPDF = await generateTicketPDF(booking);
    const receiptPDF = await generateReceiptPDF(booking);

    const mailOptions = {
      from: process.env.EMAIL_FROM || 'AI Trip Planner <noreply@aitripplanner.com>',
      to: booking.customerDetails.email,
      subject: `Event Tickets Confirmed - ${booking.bookingReference}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #8b5cf6, #6366f1); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; }
            .booking-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #8b5cf6; }
            .detail-row { display: flex; justify-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
            .total-box { background: #ede9fe; padding: 15px; border-radius: 8px; margin-top: 20px; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">🎉 Tickets Confirmed!</h1>
              <p style="margin: 10px 0 0 0;">Get ready for an amazing experience</p>
            </div>
            <div class="content">
              <p>Dear ${booking.customerDetails.name},</p>
              <p>Your event tickets have been confirmed successfully!</p>
              
              <div class="booking-details">
                <h3 style="color: #8b5cf6; margin-top: 0;">Event Details</h3>
                <div class="detail-row">
                  <strong>Booking Reference:</strong>
                  <span>${booking.bookingReference}</span>
                </div>
                <div class="detail-row">
                  <strong>Event:</strong>
                  <span>${booking.eventDetails.eventName}</span>
                </div>
                <div class="detail-row">
                  <strong>Venue:</strong>
                  <span>${booking.venueDetails.name}</span>
                </div>
                <div class="detail-row">
                  <strong>Address:</strong>
                  <span>${booking.venueDetails.address}</span>
                </div>
                <div class="detail-row">
                  <strong>Date:</strong>
                  <span>${new Date(booking.eventDetails.eventDate).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
                <div class="detail-row">
                  <strong>Time:</strong>
                  <span>${booking.eventDetails.eventTime}</span>
                </div>
                <div class="detail-row">
                  <strong>Seating:</strong>
                  <span>${booking.eventDetails.seatingCategory.toUpperCase()}</span>
                </div>
                <div class="detail-row">
                  <strong>Tickets:</strong>
                  <span>${booking.eventDetails.numberOfTickets} ${booking.eventDetails.numberOfTickets === 1 ? 'Ticket' : 'Tickets'}</span>
                </div>
              </div>

              <div class="total-box">
                <div style="display: flex; justify-between; font-size: 18px; font-weight: bold; color: #7c3aed;">
                  <span>Total Amount Paid:</span>
                  <span>₹${booking.pricing.total}</span>
                </div>
                <p style="margin: 10px 0 0 0; font-size: 12px; color: #6b7280;">
                  Transaction ID: ${booking.payment.transactionId}
                </p>
              </div>

              <p style="margin-top: 30px;">
                Please find attached your event tickets and payment receipt.
              </p>

              <p>
                <strong>Important:</strong> Please carry a valid ID proof and show your booking reference at the venue.
                Arrive at least 30 minutes before the event starts for a smooth entry.
              </p>

              <p>Thank you for choosing us! Have a wonderful time at the event! 🎊</p>
            </div>
            <div class="footer">
              <p>This is an automated email. Please do not reply.</p>
              <p>&copy; 2026 AI Trip Planner. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      attachments: [
        {
          filename: `Event-Ticket-${booking.bookingReference}.pdf`,
          content: ticketPDF,
        },
        {
          filename: `Receipt-${booking.bookingReference}.pdf`,
          content: receiptPDF,
        },
      ],
    };

    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Error sending event confirmation email:', error);
    return { success: false, error: error.message };
  }
}

// Generate event ticket PDF
async function generateTicketPDF(booking) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const chunks = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      // Header with gradient effect
      doc.rect(0, 0, doc.page.width, 150).fill('#8b5cf6');
      
      doc.fontSize(32).fillColor('white').text('🎫 EVENT TICKET', 50, 40, { align: 'center' });
      doc.fontSize(14).text(booking.bookingReference, 50, 85, { align: 'center' });
      doc.fontSize(12).text('AI Trip Planner - Events', 50, 110, { align: 'center' });

      // Event details section
      let yPos = 180;
      doc.fontSize(18).fillColor('#8b5cf6').text('Event Information', 50, yPos);
      yPos += 30;

      const eventInfo = [
        { label: 'Event Name', value: booking.eventDetails.eventName },
        { label: 'Event Type', value: booking.eventDetails.eventType.replace(/_/g, ' ').toUpperCase() },
        { label: 'Date', value: new Date(booking.eventDetails.eventDate).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) },
        { label: 'Time', value: booking.eventDetails.eventTime },
        { label: 'Duration', value: booking.eventDetails.duration || 'N/A' },
      ];

      eventInfo.forEach((info) => {
        doc.fontSize(11).fillColor('#666').text(info.label + ':', 50, yPos);
        doc.fontSize(11).fillColor('#000').text(info.value, 180, yPos);
        yPos += 25;
      });

      // Venue details
      yPos += 10;
      doc.fontSize(18).fillColor('#8b5cf6').text('Venue Details', 50, yPos);
      yPos += 30;

      const venueInfo = [
        { label: 'Venue Name', value: booking.venueDetails.name },
        { label: 'Address', value: booking.venueDetails.address },
        { label: 'Contact', value: booking.venueDetails.contact || 'N/A' },
      ];

      venueInfo.forEach((info) => {
        doc.fontSize(11).fillColor('#666').text(info.label + ':', 50, yPos);
        doc.fontSize(11).fillColor('#000').text(info.value, 180, yPos, { width: 350 });
        yPos += 25;
      });

      // Ticket holder details
      yPos += 10;
      doc.fontSize(18).fillColor('#8b5cf6').text('Ticket Holder', 50, yPos);
      yPos += 30;

      const holderInfo = [
        { label: 'Name', value: booking.customerDetails.name },
        { label: 'Email', value: booking.customerDetails.email },
        { label: 'Phone', value: booking.customerDetails.phone },
        { label: 'Seating', value: booking.eventDetails.seatingCategory.toUpperCase() },
        { label: 'Number of Tickets', value: booking.eventDetails.numberOfTickets.toString() },
      ];

      holderInfo.forEach((info) => {
        doc.fontSize(11).fillColor('#666').text(info.label + ':', 50, yPos);
        doc.fontSize(11).fillColor('#000').text(info.value, 180, yPos);
        yPos += 25;
      });

      // QR Code placeholder (you can integrate a QR library if needed)
      yPos += 20;
      doc.rect(50, yPos, 150, 150).stroke('#8b5cf6');
      doc.fontSize(10).fillColor('#666').text('QR Code', 50, yPos + 160, { width: 150, align: 'center' });
      doc.fontSize(8).text(booking.bookingReference, 50, yPos + 175, { width: 150, align: 'center' });

      // Important instructions
      yPos += 200;
      doc.fontSize(14).fillColor('#8b5cf6').text('Important Instructions', 50, yPos);
      yPos += 25;
      
      const instructions = [
        '• Arrive at least 30 minutes before the event starts',
        '• Carry a valid government ID proof',
        '• This ticket is non-transferable and non-refundable',
        '• No outside food or beverages allowed',
        '• Follow venue guidelines and security protocols',
      ];

      instructions.forEach((instruction) => {
        doc.fontSize(10).fillColor('#333').text(instruction, 50, yPos);
        yPos += 18;
      });

      // Footer
      doc.fontSize(8).fillColor('#999').text(
        'Generated on ' + new Date().toLocaleString('en-IN'),
        50,
        doc.page.height - 50,
        { align: 'center', width: doc.page.width - 100 }
      );

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

// Generate receipt PDF
async function generateReceiptPDF(booking) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const chunks = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      // Header
      doc.rect(0, 0, doc.page.width, 120).fill('#6366f1');
      
      doc.fontSize(28).fillColor('white').text('PAYMENT RECEIPT', 50, 35, { align: 'center' });
      doc.fontSize(12).text('AI Trip Planner - Event Booking', 50, 75, { align: 'center' });

      // Receipt details
      let yPos = 150;
      doc.fontSize(11).fillColor('#666').text('Receipt No:', 50, yPos);
      doc.fontSize(11).fillColor('#000').text(booking.bookingReference, 180, yPos);
      yPos += 25;

      doc.fontSize(11).fillColor('#666').text('Date:', 50, yPos);
      doc.fontSize(11).fillColor('#000').text(new Date().toLocaleDateString('en-IN'), 180, yPos);
      yPos += 25;

      doc.fontSize(11).fillColor('#666').text('Payment Method:', 50, yPos);
      doc.fontSize(11).fillColor('#000').text(booking.payment.method.toUpperCase(), 180, yPos);
      yPos += 25;

      doc.fontSize(11).fillColor('#666').text('Transaction ID:', 50, yPos);
      doc.fontSize(11).fillColor('#000').text(booking.payment.transactionId || 'N/A', 180, yPos);
      yPos += 25;

      doc.fontSize(11).fillColor('#666').text('Payment Status:', 50, yPos);
      doc.fontSize(11).fillColor('#10b981').text(booking.payment.status.toUpperCase(), 180, yPos);
      yPos += 40;

      // Bill to section
      doc.fontSize(16).fillColor('#6366f1').text('Bill To:', 50, yPos);
      yPos += 25;

      doc.fontSize(11).fillColor('#000').text(booking.customerDetails.name, 50, yPos);
      yPos += 20;
      doc.fontSize(10).fillColor('#666').text(booking.customerDetails.email, 50, yPos);
      yPos += 20;
      doc.fontSize(10).text(booking.customerDetails.phone, 50, yPos);
      yPos += 40;

      // Event details
      doc.fontSize(16).fillColor('#6366f1').text('Event Details:', 50, yPos);
      yPos += 25;

      doc.fontSize(11).fillColor('#000').text(booking.eventDetails.eventName, 50, yPos);
      yPos += 20;
      doc.fontSize(10).fillColor('#666').text(booking.venueDetails.name, 50, yPos);
      yPos += 20;
      doc.fontSize(10).text(new Date(booking.eventDetails.eventDate).toLocaleDateString('en-IN') + ' at ' + booking.eventDetails.eventTime, 50, yPos);
      yPos += 40;

      // Pricing breakdown table
      doc.fontSize(16).fillColor('#6366f1').text('Price Breakdown:', 50, yPos);
      yPos += 30;

      // Table header
      doc.rect(50, yPos, doc.page.width - 100, 25).fill('#f3f4f6');
      doc.fontSize(11).fillColor('#000').text('Description', 60, yPos + 7);
      doc.text('Amount', doc.page.width - 150, yPos + 7);
      yPos += 25;

      // Table rows
      const priceItems = [
        { 
          desc: `${booking.eventDetails.numberOfTickets} × ${booking.eventDetails.seatingCategory.toUpperCase()} Ticket`, 
          amount: booking.pricing.ticketPrice 
        },
        { desc: 'Convenience Fee', amount: booking.pricing.convenienceFee },
        { desc: 'GST (18%)', amount: booking.pricing.gst },
      ];

      priceItems.forEach((item) => {
        doc.fontSize(10).fillColor('#666').text(item.desc, 60, yPos + 5);
        doc.text(`₹${item.amount.toFixed(2)}`, doc.page.width - 150, yPos + 5);
        doc.moveTo(50, yPos + 25).lineTo(doc.page.width - 50, yPos + 25).stroke('#e5e7eb');
        yPos += 25;
      });

      // Total
      yPos += 10;
      doc.rect(50, yPos, doc.page.width - 100, 35).fill('#ddd6fe');
      doc.fontSize(14).fillColor('#000').text('Total Amount Paid', 60, yPos + 10);
      doc.fontSize(14).fillColor('#7c3aed').text(`₹${booking.pricing.total.toFixed(2)}`, doc.page.width - 150, yPos + 10);

      // Footer
      yPos = doc.page.height - 80;
      doc.fontSize(10).fillColor('#666').text('Thank you for your booking!', 50, yPos, { align: 'center', width: doc.page.width - 100 });
      doc.fontSize(8).fillColor('#999').text(
        'This is a computer-generated receipt and does not require a signature.',
        50,
        yPos + 25,
        { align: 'center', width: doc.page.width - 100 }
      );

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

// @desc    Create new event booking
// @route   POST /api/events
// @access  Private
const createEventBooking = async (req, res) => {
  try {
    const {
      venueDetails,
      customerDetails,
      eventDetails,
      pricing,
      payment,
    } = req.body;

    // Validate required fields
    if (!venueDetails || !customerDetails || !eventDetails || !pricing || !payment) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required booking details',
      });
    }

    // Create booking
    const booking = await EventBooking.create({
      user: req.user._id,
      venueDetails,
      customerDetails,
      eventDetails,
      pricing,
      payment: {
        ...payment,
        status: 'completed',
        paidAt: new Date(),
        transactionId: `TXN${Date.now()}${Math.floor(Math.random() * 10000)}`,
      },
    });

    // Send confirmation email with PDFs
    const emailResult = await sendEventConfirmation(booking);
    
    if (emailResult.success) {
      booking.emailSent = true;
      booking.emailSentAt = new Date();
      await booking.save();
    }

    res.status(201).json({
      success: true,
      message: 'Event booking created successfully',
      booking,
    });
  } catch (error) {
    console.error('Error creating event booking:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create event booking',
      error: error.message,
    });
  }
};

// @desc    Get all event bookings for user
// @route   GET /api/events
// @access  Private
const getUserEventBookings = async (req, res) => {
  try {
    const bookings = await EventBooking.find({ user: req.user._id })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: bookings.length,
      bookings,
    });
  } catch (error) {
    console.error('Error fetching event bookings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch event bookings',
      error: error.message,
    });
  }
};

// @desc    Get single event booking
// @route   GET /api/events/:id
// @access  Private
const getEventBookingById = async (req, res) => {
  try {
    const booking = await EventBooking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Event booking not found',
      });
    }

    // Check if booking belongs to user
    if (booking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this booking',
      });
    }

    res.status(200).json({
      success: true,
      booking,
    });
  } catch (error) {
    console.error('Error fetching event booking:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch event booking',
      error: error.message,
    });
  }
};

// @desc    Update event booking status
// @route   PATCH /api/events/:id
// @access  Private
const updateEventBooking = async (req, res) => {
  try {
    const { bookingStatus } = req.body;

    const booking = await EventBooking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Event booking not found',
      });
    }

    // Check if booking belongs to user
    if (booking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this booking',
      });
    }

    if (bookingStatus) {
      booking.bookingStatus = bookingStatus;
    }

    await booking.save();

    res.status(200).json({
      success: true,
      message: 'Event booking updated successfully',
      booking,
    });
  } catch (error) {
    console.error('Error updating event booking:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update event booking',
      error: error.message,
    });
  }
};

// @desc    Cancel event booking
// @route   DELETE /api/events/:id
// @access  Private
const cancelEventBooking = async (req, res) => {
  try {
    const booking = await EventBooking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Event booking not found',
      });
    }

    // Check if booking belongs to user
    if (booking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this booking',
      });
    }

    booking.bookingStatus = 'cancelled';
    await booking.save();

    res.status(200).json({
      success: true,
      message: 'Event booking cancelled successfully',
      booking,
    });
  } catch (error) {
    console.error('Error cancelling event booking:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel event booking',
      error: error.message,
    });
  }
};

// @desc    Resend confirmation email
// @route   POST /api/events/:id/resend-email
// @access  Private
const resendEventConfirmation = async (req, res) => {
  try {
    const booking = await EventBooking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Event booking not found',
      });
    }

    // Check if booking belongs to user
    if (booking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized',
      });
    }

    const emailResult = await sendEventConfirmation(booking);

    if (emailResult.success) {
      booking.emailSent = true;
      booking.emailSentAt = new Date();
      await booking.save();

      res.status(200).json({
        success: true,
        message: 'Confirmation email sent successfully',
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to send confirmation email',
        error: emailResult.error,
      });
    }
  } catch (error) {
    console.error('Error resending event confirmation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to resend confirmation email',
      error: error.message,
    });
  }
};

module.exports = {
  createEventBooking,
  getUserEventBookings,
  getEventBookingById,
  updateEventBooking,
  cancelEventBooking,
  resendEventConfirmation,
};
