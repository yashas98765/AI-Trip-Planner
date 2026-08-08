const ShoppingMallBooking = require('../models/ShoppingMallBooking');
const PDFDocument = require('pdfkit');
const nodemailer = require('nodemailer');

// @desc    Create shopping mall booking
// @route   POST /api/shopping-mall/book
// @access  Private
exports.createShoppingMallBooking = async (req, res) => {
  try {
    const {
      mallDetails,
      customerDetails,
      bookingDetails,
      pricing,
      payment,
    } = req.body;

    // Validate required fields
    if (!customerDetails || !bookingDetails || !pricing || !payment) {
      return res.status(400).json({
        success: false,
        message: 'Missing required booking information',
      });
    }

    // Create booking
    const booking = await ShoppingMallBooking.create({
      user: req.user._id,
      mallDetails: {
        name: mallDetails?.name || 'Shopping Mall',
        address: mallDetails?.address || '',
        contact: mallDetails?.contact || '',
      },
      customerDetails: {
        name: customerDetails.name,
        email: customerDetails.email,
        phone: customerDetails.phone,
      },
      bookingDetails: {
        serviceType: bookingDetails.serviceType,
        serviceName: bookingDetails.serviceName,
        visitDate: bookingDetails.visitDate,
        visitTime: bookingDetails.visitTime,
        numberOfPeople: bookingDetails.numberOfPeople,
        parkingRequired: bookingDetails.parkingRequired || false,
        parkingDuration: bookingDetails.parkingDuration || 0,
        vehicleType: bookingDetails.vehicleType || '',
        storePreferences: bookingDetails.storePreferences || [],
        specialRequests: bookingDetails.specialRequests || '',
      },
      pricing: {
        basePrice: pricing.basePrice,
        parkingCharges: pricing.parkingCharges || 0,
        convenienceFee: pricing.convenienceFee || 49,
        gst: pricing.gst || 0,
        total: pricing.total,
      },
      payment: {
        method: payment.method,
        status: payment.status || 'completed',
        transactionId: payment.transactionId,
        paidAt: payment.paidAt || new Date(),
      },
      bookingStatus: 'confirmed',
    });

    // Send confirmation email with PDFs
    try {
      console.log('Attempting to send shopping mall confirmation email to:', booking.customerDetails.email);
      await sendShoppingMallConfirmation(booking);
      booking.emailSent = true;
      booking.emailSentAt = new Date();
      await booking.save();
      console.log('Shopping mall confirmation email sent successfully to:', booking.customerDetails.email);
    } catch (emailError) {
      console.error('Email sending failed for shopping mall booking:', {
        bookingRef: booking.bookingReference,
        email: booking.customerDetails.email,
        error: emailError.message,
        stack: emailError.stack
      });
      // Don't fail the booking if email fails
    }

    res.status(201).json({
      success: true,
      message: 'Shopping mall booking confirmed successfully',
      booking,
    });
  } catch (error) {
    console.error('Shopping mall booking error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create booking',
    });
  }
};

// @desc    Get shopping mall booking by ID
// @route   GET /api/shopping-mall/booking/:id
// @access  Private
exports.getShoppingMallBookingById = async (req, res) => {
  try {
    const booking = await ShoppingMallBooking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    // Check if the booking belongs to the user
    if (booking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this booking',
      });
    }

    res.status(200).json({
      success: true,
      booking,
    });
  } catch (error) {
    console.error('Get booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve booking',
    });
  }
};

// @desc    Get user shopping mall bookings
// @route   GET /api/shopping-mall/bookings
// @access  Private
exports.getUserShoppingMallBookings = async (req, res) => {
  try {
    const bookings = await ShoppingMallBooking.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);

    res.status(200).json({
      success: true,
      count: bookings.length,
      bookings,
    });
  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve bookings',
    });
  }
};

// @desc    Cancel shopping mall booking
// @route   PATCH /api/shopping-mall/booking/:id/cancel
// @access  Private
exports.cancelShoppingMallBooking = async (req, res) => {
  try {
    const booking = await ShoppingMallBooking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    if (booking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this booking',
      });
    }

    if (booking.bookingStatus === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Booking is already cancelled',
      });
    }

    booking.bookingStatus = 'cancelled';
    await booking.save();

    res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully',
      booking,
    });
  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel booking',
    });
  }
};

// @desc    Generate invoice PDF
// @route   GET /api/shopping-mall/invoice/:id
// @access  Private
exports.generateInvoice = async (req, res) => {
  try {
    const booking = await ShoppingMallBooking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    if (booking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized',
      });
    }

    const doc = new PDFDocument({ margin: 50 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=invoice-${booking.bookingReference}.pdf`
    );

    doc.pipe(res);

    // Header
    doc
      .fontSize(24)
      .fillColor('#7C3AED')
      .text('INVOICE', 50, 50, { align: 'center' })
      .moveDown();

    // Company details
    doc
      .fontSize(12)
      .fillColor('#000')
      .text('AI Trip Planner - Shopping Services', 50, 120)
      .text('Premium Shopping Assistance', 50, 135)
      .text('support@aitripplanner.com', 50, 150);

    // Invoice details
    doc
      .text(`Invoice No: ${booking.bookingReference}`, 350, 120, { align: 'right' })
      .text(`Date: ${new Date(booking.createdAt).toLocaleDateString()}`, 350, 135, {
        align: 'right',
      })
      .text(`Payment Status: ${booking.payment.status}`, 350, 150, { align: 'right' });

    doc.moveTo(50, 180).lineTo(550, 180).stroke();

    // Customer details
    doc
      .fontSize(14)
      .fillColor('#7C3AED')
      .text('Bill To:', 50, 200)
      .fontSize(11)
      .fillColor('#000')
      .text(booking.customerDetails.name, 50, 220)
      .text(booking.customerDetails.email, 50, 235)
      .text(booking.customerDetails.phone, 50, 250);

    // Mall details
    doc
      .fontSize(14)
      .fillColor('#7C3AED')
      .text('Shopping Venue:', 350, 200)
      .fontSize(11)
      .fillColor('#000')
      .text(booking.mallDetails.name, 350, 220)
      .text(booking.mallDetails.address || 'N/A', 350, 235);

    // Service details box
    doc
      .rect(50, 290, 500, 80)
      .fillAndStroke('#F9FAFB', '#E5E7EB');

    doc
      .fillColor('#000')
      .fontSize(12)
      .text('Service Details', 60, 300)
      .fontSize(10)
      .text(`Service: ${booking.bookingDetails.serviceName}`, 60, 320)
      .text(`Visit Date: ${new Date(booking.bookingDetails.visitDate).toLocaleDateString()}`, 60, 335)
      .text(`Time Slot: ${booking.bookingDetails.visitTime}`, 60, 350)
      .text(`People: ${booking.bookingDetails.numberOfPeople}`, 300, 320);

    if (booking.bookingDetails.parkingRequired) {
      doc.text(
        `Parking: ${booking.bookingDetails.vehicleType.toUpperCase()} - ${booking.bookingDetails.parkingDuration}hrs`,
        300,
        335
      );
    }

    // Pricing table
    const tableTop = 400;
    doc.fontSize(11).fillColor('#000');

    // Table header
    doc
      .rect(50, tableTop, 500, 25)
      .fillAndStroke('#7C3AED', '#7C3AED');
    doc
      .fillColor('#FFF')
      .text('Description', 60, tableTop + 8)
      .text('Amount', 480, tableTop + 8, { align: 'right' });

    // Table rows
    let currentY = tableTop + 35;
    doc.fillColor('#000');

    const items = [
      ['Service Charges', `₹${booking.pricing.basePrice}`],
    ];

    if (booking.pricing.parkingCharges > 0) {
      items.push(['Parking Charges', `₹${booking.pricing.parkingCharges}`]);
    }

    items.push(
      ['Convenience Fee', `₹${booking.pricing.convenienceFee}`],
      ['GST (18%)', `₹${booking.pricing.gst}`]
    );

    items.forEach((item) => {
      doc.text(item[0], 60, currentY).text(item[1], 480, currentY, { align: 'right' });
      currentY += 20;
    });

    // Total row
    doc
      .rect(50, currentY + 10, 500, 35)
      .fillAndStroke('#F3E8FF', '#E9D5FF');
    doc
      .fontSize(14)
      .fillColor('#7C3AED')
      .text('Total Amount', 60, currentY + 20)
      .text(`₹${booking.pricing.total}`, 480, currentY + 20, { align: 'right' });

    // Payment info
    currentY += 70;
    doc
      .fontSize(11)
      .fillColor('#000')
      .text(`Payment Method: ${booking.payment.method.toUpperCase()}`, 50, currentY)
      .text(`Transaction ID: ${booking.payment.transactionId}`, 50, currentY + 15);

    // Footer
    doc
      .fontSize(9)
      .fillColor('#6B7280')
      .text('Thank you for choosing AI Trip Planner!', 50, 700, { align: 'center' })
      .text('For support, contact: support@aitripplanner.com', 50, 715, {
        align: 'center',
      });

    doc.end();
  } catch (error) {
    console.error('Invoice generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate invoice',
    });
  }
};

// @desc    Generate receipt PDF
// @route   GET /api/shopping-mall/receipt/:id
// @access  Private
exports.generateReceipt = async (req, res) => {
  try {
    const booking = await ShoppingMallBooking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    if (booking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized',
      });
    }

    const doc = new PDFDocument({ margin: 50 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=receipt-${booking.bookingReference}.pdf`
    );

    doc.pipe(res);

    // Header
    doc
      .fontSize(28)
      .fillColor('#EC4899')
      .text('PAYMENT RECEIPT', 50, 50, { align: 'center' })
      .moveDown();

    // Receipt box
    doc
      .rect(50, 120, 500, 100)
      .fillAndStroke('#FDF2F8', '#F9A8D4');

    doc
      .fontSize(14)
      .fillColor('#000')
      .text('Receipt Details', 60, 135)
      .fontSize(11)
      .text(`Receipt No: ${booking.bookingReference}`, 60, 160)
      .text(`Date: ${new Date(booking.payment.paidAt).toLocaleString()}`, 60, 175)
      .text(`Transaction ID: ${booking.payment.transactionId}`, 60, 190)
      .text(`Amount Paid: ₹${booking.pricing.total}`, 350, 160, { align: 'right' })
      .text(`Payment Method: ${booking.payment.method.toUpperCase()}`, 350, 175, {
        align: 'right',
      })
      .text(`Status: ${booking.payment.status.toUpperCase()}`, 350, 190, {
        align: 'right',
      });

    // Customer info
    doc
      .fontSize(14)
      .fillColor('#EC4899')
      .text('Customer Information', 50, 250)
      .fontSize(11)
      .fillColor('#000')
      .text(`Name: ${booking.customerDetails.name}`, 50, 275)
      .text(`Email: ${booking.customerDetails.email}`, 50, 290)
      .text(`Phone: ${booking.customerDetails.phone}`, 50, 305);

    // Booking info
    doc
      .fontSize(14)
      .fillColor('#EC4899')
      .text('Booking Information', 50, 340)
      .fontSize(11)
      .fillColor('#000')
      .text(`Mall: ${booking.mallDetails.name}`, 50, 365)
      .text(`Service: ${booking.bookingDetails.serviceName}`, 50, 380)
      .text(`Visit Date: ${new Date(booking.bookingDetails.visitDate).toLocaleDateString()}`, 50, 395)
      .text(`Time: ${booking.bookingDetails.visitTime}`, 50, 410)
      .text(`People: ${booking.bookingDetails.numberOfPeople}`, 350, 365);

    if (booking.bookingDetails.parkingRequired) {
      doc.text(`Parking: Reserved (${booking.bookingDetails.vehicleType.toUpperCase()})`, 350, 380);
    }

    // Amount breakdown
    doc
      .fontSize(14)
      .fillColor('#EC4899')
      .text('Payment Breakdown', 50, 450);

    const breakdownY = 475;
    doc
      .fontSize(11)
      .fillColor('#000')
      .text('Service Charges', 50, breakdownY)
      .text(`₹${booking.pricing.basePrice}`, 500, breakdownY, { align: 'right' });

    if (booking.pricing.parkingCharges > 0) {
      doc
        .text('Parking Charges', 50, breakdownY + 20)
        .text(`₹${booking.pricing.parkingCharges}`, 500, breakdownY + 20, { align: 'right' });
    }

    doc
      .text('Convenience Fee', 50, breakdownY + 40)
      .text(`₹${booking.pricing.convenienceFee}`, 500, breakdownY + 40, { align: 'right' })
      .text('GST (18%)', 50, breakdownY + 60)
      .text(`₹${booking.pricing.gst}`, 500, breakdownY + 60, { align: 'right' });

    // Total box
    doc
      .rect(50, breakdownY + 90, 500, 40)
      .fillAndStroke('#FDF2F8', '#F9A8D4');
    doc
      .fontSize(16)
      .fillColor('#EC4899')
      .text('Total Paid', 60, breakdownY + 105)
      .text(`₹${booking.pricing.total}`, 490, breakdownY + 105, { align: 'right' });

    // Footer
    doc
      .fontSize(12)
      .fillColor('#10B981')
      .text('✓ Payment Successful', 50, 680, { align: 'center' });

    doc
      .fontSize(9)
      .fillColor('#6B7280')
      .text('This is a computer-generated receipt. No signature required.', 50, 710, {
        align: 'center',
      })
      .text('AI Trip Planner | support@aitripplanner.com', 50, 725, { align: 'center' });

    doc.end();
  } catch (error) {
    console.error('Receipt generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate receipt',
    });
  }
};

// Email service function
async function sendShoppingMallConfirmation(booking) {
  console.log('Creating email transporter with:', {
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    user: process.env.EMAIL_USER ? '***' + process.env.EMAIL_USER.slice(-10) : 'NOT SET',
    from: process.env.EMAIL_FROM || 'AI Trip Planner <noreply@aitripplanner.com>'
  });

  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  // Generate invoice PDF buffer
  const invoiceDoc = new PDFDocument();
  const invoiceChunks = [];
  invoiceDoc.on('data', (chunk) => invoiceChunks.push(chunk));
  await new Promise((resolve) => {
    invoiceDoc.on('end', resolve);
    // Invoice generation (simplified version)
    invoiceDoc
      .fontSize(20)
      .text('INVOICE', { align: 'center' })
      .moveDown()
      .fontSize(12)
      .text(`Booking Reference: ${booking.bookingReference}`)
      .text(`Mall: ${booking.mallDetails.name}`)
      .text(`Service: ${booking.bookingDetails.serviceName}`)
      .text(`Amount: ₹${booking.pricing.total}`);
    invoiceDoc.end();
  });
  const invoiceBuffer = Buffer.concat(invoiceChunks);

  // Generate receipt PDF buffer
  const receiptDoc = new PDFDocument();
  const receiptChunks = [];
  receiptDoc.on('data', (chunk) => receiptChunks.push(chunk));
  await new Promise((resolve) => {
    receiptDoc.on('end', resolve);
    receiptDoc
      .fontSize(20)
      .text('PAYMENT RECEIPT', { align: 'center' })
      .moveDown()
      .fontSize(12)
      .text(`Receipt No: ${booking.bookingReference}`)
      .text(`Transaction ID: ${booking.payment.transactionId}`)
      .text(`Amount Paid: ₹${booking.pricing.total}`);
    receiptDoc.end();
  });
  const receiptBuffer = Buffer.concat(receiptChunks);

  const mailOptions = {
    from: process.env.EMAIL_FROM || 'AI Trip Planner <noreply@aitripplanner.com>',
    to: booking.customerDetails.email,
    subject: `Shopping Mall Booking Confirmed - ${booking.bookingReference}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #7C3AED, #EC4899); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; }
          .booking-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .detail-row { display: flex; justify-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
          .total-box { background: #FDF2F8; padding: 15px; border-radius: 8px; margin-top: 20px; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">🛍️ Booking Confirmed!</h1>
            <p style="margin: 10px 0 0 0;">Your shopping experience is booked</p>
          </div>
          <div class="content">
            <p>Dear ${booking.customerDetails.name},</p>
            <p>Your shopping mall booking has been confirmed successfully!</p>
            
            <div class="booking-details">
              <h3 style="color: #7C3AED; margin-top: 0;">Booking Details</h3>
              <div class="detail-row">
                <strong>Booking Reference:</strong>
                <span>${booking.bookingReference}</span>
              </div>
              <div class="detail-row">
                <strong>Mall:</strong>
                <span>${booking.mallDetails.name}</span>
              </div>
              <div class="detail-row">
                <strong>Service:</strong>
                <span>${booking.bookingDetails.serviceName}</span>
              </div>
              <div class="detail-row">
                <strong>Visit Date:</strong>
                <span>${new Date(booking.bookingDetails.visitDate).toLocaleDateString()}</span>
              </div>
              <div class="detail-row">
                <strong>Time Slot:</strong>
                <span>${booking.bookingDetails.visitTime}</span>
              </div>
              <div class="detail-row">
                <strong>Number of People:</strong>
                <span>${booking.bookingDetails.numberOfPeople}</span>
              </div>
              ${booking.bookingDetails.parkingRequired ? `
              <div class="detail-row">
                <strong>Parking:</strong>
                <span>Reserved (${booking.bookingDetails.vehicleType.toUpperCase()})</span>
              </div>
              ` : ''}
            </div>

            <div class="total-box">
              <div style="display: flex; justify-between; font-size: 18px; font-weight: bold; color: #EC4899;">
                <span>Total Amount Paid:</span>
                <span>₹${booking.pricing.total}</span>
              </div>
              <p style="margin: 10px 0 0 0; font-size: 12px; color: #6b7280;">
                Transaction ID: ${booking.payment.transactionId}
              </p>
            </div>

            <p style="margin-top: 30px;">
              Please find attached the invoice and receipt for your booking.
            </p>

            <p>
              <strong>Important:</strong> Please carry a valid ID proof and show this booking reference at the mall reception.
            </p>

            <p>Thank you for choosing AI Trip Planner!</p>
          </div>
          <div class="footer">
            <p>This is an automated email. Please do not reply.</p>
            <p>AI Trip Planner | support@aitripplanner.com</p>
          </div>
        </div>
      </body>
      </html>
    `,
    attachments: [
      {
        filename: `invoice-${booking.bookingReference}.pdf`,
        content: invoiceBuffer,
        contentType: 'application/pdf',
      },
      {
        filename: `receipt-${booking.bookingReference}.pdf`,
        content: receiptBuffer,
        contentType: 'application/pdf',
      },
    ],
  };

  console.log('Sending shopping mall email to:', booking.customerDetails.email);
  const result = await transporter.sendMail(mailOptions);
  console.log('Email sent successfully. Message ID:', result.messageId);
  return result;
}
