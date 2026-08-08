const PharmacyBooking = require('../models/PharmacyBooking');
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
async function sendPharmacyConfirmation(booking) {
  try {
    const invoicePDF = await generateInvoicePDF(booking);
    const receiptPDF = await generateReceiptPDF(booking);

    const mailOptions = {
      from: process.env.EMAIL_FROM || 'AI Trip Planner <noreply@aitripplanner.com>',
      to: booking.customerDetails.email,
      subject: `Pharmacy Order Confirmed - ${booking.bookingReference}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; }
            .booking-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981; }
            .detail-row { display: flex; justify-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
            .total-box { background: #d1fae5; padding: 15px; border-radius: 8px; margin-top: 20px; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">💊 Order Confirmed!</h1>
              <p style="margin: 10px 0 0 0;">Your pharmacy order is being prepared</p>
            </div>
            <div class="content">
              <p>Dear ${booking.customerDetails.name},</p>
              <p>Your pharmacy order has been confirmed successfully!</p>
              
              <div class="booking-details">
                <h3 style="color: #10b981; margin-top: 0;">Order Details</h3>
                <div class="detail-row">
                  <strong>Order Reference:</strong>
                  <span>${booking.bookingReference}</span>
                </div>
                <div class="detail-row">
                  <strong>Pharmacy:</strong>
                  <span>${booking.pharmacyDetails.name}</span>
                </div>
                <div class="detail-row">
                  <strong>Service:</strong>
                  <span>${booking.orderDetails.serviceName}</span>
                </div>
                <div class="detail-row">
                  <strong>Item:</strong>
                  <span>${booking.orderDetails.itemDescription}</span>
                </div>
                <div class="detail-row">
                  <strong>Quantity:</strong>
                  <span>${booking.orderDetails.quantity}</span>
                </div>
                <div class="detail-row">
                  <strong>Pickup Date:</strong>
                  <span>${new Date(booking.orderDetails.pickupDate).toLocaleDateString()}</span>
                </div>
                <div class="detail-row">
                  <strong>Pickup Time:</strong>
                  <span>${booking.orderDetails.pickupTime.charAt(0).toUpperCase() + booking.orderDetails.pickupTime.slice(1)}</span>
                </div>
              </div>

              <div class="total-box">
                <div style="display: flex; justify-between; font-size: 18px; font-weight: bold; color: #059669;">
                  <span>Total Amount Paid:</span>
                  <span>₹${booking.pricing.total}</span>
                </div>
                <p style="margin: 10px 0 0 0; font-size: 12px; color: #6b7280;">
                  Transaction ID: ${booking.payment.transactionId}
                </p>
              </div>

              <p style="margin-top: 30px;">
                Please find attached the invoice and receipt for your order.
              </p>

              <p>
                <strong>Important:</strong> Please carry a valid ID proof and show this order reference when collecting your items.
                ${booking.orderDetails.prescriptionRequired ? '<br><strong>Note:</strong> Original prescription must be presented at the pharmacy.' : ''}
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
          filename: `pharmacy-invoice-${booking.bookingReference}.pdf`,
          content: invoicePDF,
        },
        {
          filename: `pharmacy-receipt-${booking.bookingReference}.pdf`,
          content: receiptPDF,
        },
      ],
    };

    await transporter.sendMail(mailOptions);
    console.log(`Pharmacy confirmation email sent to ${booking.customerDetails.email}`);
  } catch (error) {
    console.error('Error sending pharmacy confirmation email:', error);
    throw error;
  }
}

// @desc    Create pharmacy booking
// @route   POST /api/pharmacy/book
// @access  Private
exports.createPharmacyBooking = async (req, res) => {
  try {
    const {
      pharmacyDetails,
      customerDetails,
      orderDetails,
      pricing,
      payment,
    } = req.body;

    // Validate required fields
    if (!customerDetails || !orderDetails || !pricing || !payment) {
      return res.status(400).json({
        success: false,
        message: 'Missing required booking information',
      });
    }

    // Create booking
    const booking = await PharmacyBooking.create({
      user: req.user._id,
      pharmacyDetails: {
        name: pharmacyDetails?.name || 'Pharmacy',
        address: pharmacyDetails?.address || '',
        contact: pharmacyDetails?.contact || '',
      },
      customerDetails: {
        name: customerDetails.name,
        email: customerDetails.email,
        phone: customerDetails.phone,
        age: customerDetails.age || null,
      },
      orderDetails: {
        serviceType: orderDetails.serviceType,
        serviceName: orderDetails.serviceName,
        pickupDate: orderDetails.pickupDate,
        pickupTime: orderDetails.pickupTime,
        prescriptionRequired: orderDetails.prescriptionRequired || false,
        prescriptionImage: orderDetails.prescriptionImage || '',
        itemDescription: orderDetails.itemDescription,
        quantity: orderDetails.quantity || 1,
        specialInstructions: orderDetails.specialInstructions || '',
      },
      pricing: {
        basePrice: pricing.basePrice,
        deliveryFee: pricing.deliveryFee || 0,
        convenienceFee: pricing.convenienceFee || 30,
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
      await sendPharmacyConfirmation(booking);
      booking.emailSent = true;
      booking.emailSentAt = new Date();
      await booking.save();
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      // Don't fail the booking if email fails
    }

    res.status(201).json({
      success: true,
      message: 'Pharmacy order confirmed successfully',
      booking,
    });
  } catch (error) {
    console.error('Pharmacy booking error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create booking',
    });
  }
};

// @desc    Get pharmacy booking by ID
// @route   GET /api/pharmacy/booking/:id
// @access  Private
exports.getPharmacyBookingById = async (req, res) => {
  try {
    const booking = await PharmacyBooking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    // Check if user owns this booking
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
    console.error('Error fetching pharmacy booking:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch booking',
    });
  }
};

// @desc    Get all pharmacy bookings for logged-in user
// @route   GET /api/pharmacy/bookings
// @access  Private
exports.getUserPharmacyBookings = async (req, res) => {
  try {
    const bookings = await PharmacyBooking.find({ user: req.user._id })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: bookings.length,
      bookings,
    });
  } catch (error) {
    console.error('Error fetching pharmacy bookings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bookings',
    });
  }
};

// @desc    Cancel pharmacy booking
// @route   PATCH /api/pharmacy/booking/:id/cancel
// @access  Private
exports.cancelPharmacyBooking = async (req, res) => {
  try {
    const booking = await PharmacyBooking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    // Check if user owns this booking
    if (booking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this booking',
      });
    }

    // Check if booking can be cancelled
    if (booking.bookingStatus === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Booking is already cancelled',
      });
    }

    if (booking.bookingStatus === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel completed booking',
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
    console.error('Error cancelling pharmacy booking:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel booking',
    });
  }
};

// @desc    Generate invoice PDF
// @route   GET /api/pharmacy/booking/:id/invoice
// @access  Private
exports.generateInvoice = async (req, res) => {
  try {
    const booking = await PharmacyBooking.findById(req.params.id);

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

    const pdfBuffer = await generateInvoicePDF(booking);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=pharmacy-invoice-${booking.bookingReference}.pdf`
    );
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error generating invoice:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate invoice',
    });
  }
};

// @desc    Generate receipt PDF
// @route   GET /api/pharmacy/booking/:id/receipt
// @access  Private
exports.generateReceipt = async (req, res) => {
  try {
    const booking = await PharmacyBooking.findById(req.params.id);

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

    const pdfBuffer = await generateReceiptPDF(booking);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=pharmacy-receipt-${booking.bookingReference}.pdf`
    );
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error generating receipt:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate receipt',
    });
  }
};

// Helper function to generate invoice PDF
async function generateInvoicePDF(booking) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const chunks = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // Header with gradient effect
    doc.fillColor('#10b981')
       .fontSize(28)
       .text('PHARMACY INVOICE', { align: 'center' })
       .moveDown(0.5);

    doc.fillColor('#059669')
       .fontSize(12)
       .text('AI Trip Planner - Your Health Partner', { align: 'center' })
       .moveDown(2);

    // Booking reference
    doc.fillColor('#000000')
       .fontSize(10)
       .text(`Invoice No: ${booking.bookingReference}`, 50, 150)
       .text(`Date: ${new Date(booking.createdAt).toLocaleDateString()}`, 50, 165)
       .moveDown(2);

    // Pharmacy details
    doc.fontSize(12)
       .fillColor('#10b981')
       .text('Pharmacy Details:', 50, 200);
    
    doc.fontSize(10)
       .fillColor('#000000')
       .text(`Name: ${booking.pharmacyDetails.name}`, 50, 220)
       .text(`Address: ${booking.pharmacyDetails.address}`, 50, 235)
       .text(`Contact: ${booking.pharmacyDetails.contact || 'N/A'}`, 50, 250)
       .moveDown(1.5);

    // Customer details
    doc.fontSize(12)
       .fillColor('#10b981')
       .text('Customer Details:', 50, 285);
    
    doc.fontSize(10)
       .fillColor('#000000')
       .text(`Name: ${booking.customerDetails.name}`, 50, 305)
       .text(`Email: ${booking.customerDetails.email}`, 50, 320)
       .text(`Phone: ${booking.customerDetails.phone}`, 50, 335)
       .moveDown(1.5);

    // Order details
    doc.fontSize(12)
       .fillColor('#10b981')
       .text('Order Details:', 50, 370);
    
    doc.fontSize(10)
       .fillColor('#000000')
       .text(`Service: ${booking.orderDetails.serviceName}`, 50, 390)
       .text(`Item: ${booking.orderDetails.itemDescription}`, 50, 405)
       .text(`Quantity: ${booking.orderDetails.quantity}`, 50, 420)
       .text(`Pickup Date: ${new Date(booking.orderDetails.pickupDate).toLocaleDateString()}`, 50, 435)
       .text(`Pickup Time: ${booking.orderDetails.pickupTime}`, 50, 450)
       .moveDown(2);

    // Pricing table
    const tableTop = 490;
    doc.fontSize(12)
       .fillColor('#10b981')
       .text('Pricing Breakdown:', 50, tableTop);

    doc.fontSize(10)
       .fillColor('#000000')
       .text('Base Price:', 50, tableTop + 25)
       .text(`₹${booking.pricing.basePrice}`, 450, tableTop + 25, { align: 'right' });

    if (booking.pricing.deliveryFee > 0) {
      doc.text('Delivery Fee:', 50, tableTop + 45)
         .text(`₹${booking.pricing.deliveryFee}`, 450, tableTop + 45, { align: 'right' });
    }

    doc.text('Convenience Fee:', 50, tableTop + 65)
       .text(`₹${booking.pricing.convenienceFee}`, 450, tableTop + 65, { align: 'right' });

    doc.text('GST (18%):', 50, tableTop + 85)
       .text(`₹${booking.pricing.gst}`, 450, tableTop + 85, { align: 'right' });

    // Total with highlight
    doc.rect(50, tableTop + 105, 500, 30)
       .fillAndStroke('#d1fae5', '#10b981');

    doc.fontSize(14)
       .fillColor('#059669')
       .text('Total Amount:', 60, tableTop + 112)
       .text(`₹${booking.pricing.total}`, 440, tableTop + 112, { align: 'right' });

    // Footer
    doc.fontSize(9)
       .fillColor('#6b7280')
       .text('Thank you for your order!', 50, 700, { align: 'center' })
       .text('For queries, contact: support@aitripplanner.com', 50, 715, { align: 'center' });

    doc.end();
  });
}

// Helper function to generate receipt PDF
async function generateReceiptPDF(booking) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const chunks = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // Header
    doc.fillColor('#059669')
       .fontSize(26)
       .text('PAYMENT RECEIPT', { align: 'center' })
       .moveDown(0.5);

    doc.fillColor('#10b981')
       .fontSize(11)
       .text('Pharmacy Order Payment Confirmation', { align: 'center' })
       .moveDown(2);

    // Receipt details
    doc.fillColor('#000000')
       .fontSize(10)
       .text(`Receipt No: ${booking.bookingReference}`, 50, 150)
       .text(`Transaction ID: ${booking.payment.transactionId}`, 50, 165)
       .text(`Payment Date: ${new Date(booking.payment.paidAt).toLocaleString()}`, 50, 180)
       .text (`Payment Method: ${booking.payment.method.toUpperCase()}`, 50, 195)
       .moveDown(2);

    // Customer info
    doc.fontSize(12)
       .fillColor('#059669')
       .text('Paid By:', 50, 230);
    
    doc.fontSize(10)
       .fillColor('#000000')
       .text(booking.customerDetails.name, 50, 250)
       .text(booking.customerDetails.email, 50, 265)
       .text(booking.customerDetails.phone, 50, 280)
       .moveDown(2);

    // Payment summary box
    const summaryTop = 320;
    doc.rect(50, summaryTop, 500, 150)
       .fillAndStroke('#f0fdf4', '#10b981');

    doc.fontSize(14)
       .fillColor('#059669')
       .text('Payment Summary', 70, summaryTop + 20);

    doc.fontSize(11)
       .fillColor('#000000')
       .text('Order Details:', 70, summaryTop + 50)
       .fontSize(10)
       .text(`${booking.orderDetails.serviceName}`, 70, summaryTop + 70)
       .text(`${booking.orderDetails.itemDescription} (Qty: ${booking.orderDetails.quantity})`, 70, summaryTop + 85);

    doc.fontSize(16)
       .fillColor('#059669')
       .text('Amount Paid:', 70, summaryTop + 110)
       .fillColor('#10b981')
       .text(`₹${booking.pricing.total}`, 400, summaryTop + 110, { align: 'right' });

    // Status
    doc.fontSize(12)
       .fillColor('#10b981')
       .text('Payment Status: SUCCESSFUL', 50, 510)
       .moveDown(3);

    // Footer
    doc.fontSize(9)
       .fillColor('#6b7280')
       .text('This is a computer-generated receipt and does not require a signature.', 50, 680, { align: 'center' })
       .text('Keep this receipt for your records.', 50, 695, { align: 'center' })
       .text('AI Trip Planner | support@aitripplanner.com', 50, 710, { align: 'center' });

    doc.end();
  });
}
