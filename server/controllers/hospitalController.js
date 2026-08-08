const HospitalBooking = require('../models/HospitalBooking');
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
async function sendHospitalConfirmation(booking) {
  try {
    const invoicePDF = await generateInvoicePDF(booking);
    const receiptPDF = await generateReceiptPDF(booking);

    const mailOptions = {
      from: process.env.EMAIL_FROM || 'AI Trip Planner <noreply@tripplanner.com>',
      to: booking.patientDetails.email,
      subject: `Hospital Appointment Confirmed - ${booking.bookingReference}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #2563eb 0%, #06b6d4 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .booking-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
            .label { font-weight: bold; color: #6b7280; }
            .value { color: #111827; }
            .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
            .highlight { color: #2563eb; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">🏥 Hospital Appointment Confirmed!</h1>
              <p style="margin: 10px 0 0 0;">Your healthcare appointment has been successfully booked</p>
            </div>
            <div class="content">
              <p>Dear <strong>${booking.patientDetails.name}</strong>,</p>
              <p>Thank you for booking your hospital appointment through AI Trip Planner. Your appointment has been confirmed.</p>
              
              <div class="booking-details">
                <h3 style="margin-top: 0; color: #2563eb;">Appointment Details</h3>
                <div class="detail-row">
                  <span class="label">Booking Reference:</span>
                  <span class="value highlight">${booking.bookingReference}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Hospital:</span>
                  <span class="value">${booking.hospitalDetails.name}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Service:</span>
                  <span class="value">${booking.appointmentDetails.serviceName}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Department:</span>
                  <span class="value">${booking.appointmentDetails.departmentName}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Date:</span>
                  <span class="value">${new Date(booking.appointmentDetails.appointmentDate).toLocaleDateString('en-IN', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Time:</span>
                  <span class="value">${booking.appointmentDetails.appointmentTime.charAt(0).toUpperCase() + booking.appointmentDetails.appointmentTime.slice(1)}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Total Amount Paid:</span>
                  <span class="value highlight">₹${booking.pricing.total}</span>
                </div>
                <div class="detail-row" style="border-bottom: none;">
                  <span class="label">Payment Status:</span>
                  <span class="value" style="color: #10b981; font-weight: bold;">✓ ${booking.payment.status.toUpperCase()}</span>
                </div>
              </div>

              <div style="background: #dbeafe; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <strong>📋 Important Instructions:</strong>
                <ul style="margin: 10px 0;">
                  <li>Please arrive 15 minutes before your appointment time</li>
                  <li>Bring a valid ID proof and insurance card (if applicable)</li>
                  <li>Carry any previous medical reports or prescriptions</li>
                  <li>Fasting may be required for certain tests - please check with the hospital</li>
                </ul>
              </div>

              <p>The invoice and payment receipt are attached to this email for your records.</p>
              
              <p style="margin-top: 30px;">If you have any questions or need to reschedule, please contact us.</p>
              
              <div class="footer">
                <p>Thank you for choosing AI Trip Planner Healthcare Services</p>
                <p style="color: #9ca3af; font-size: 12px;">This is an automated email. Please do not reply to this message.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
      attachments: [
        {
          filename: `hospital-invoice-${booking.bookingReference}.pdf`,
          content: invoicePDF,
        },
        {
          filename: `hospital-receipt-${booking.bookingReference}.pdf`,
          content: receiptPDF,
        },
      ],
    };

    await transporter.sendMail(mailOptions);
    console.log(`Confirmation email sent to ${booking.patientDetails.email}`);
  } catch (error) {
    console.error('Error sending confirmation email:', error);
  }
}

// Helper function to generate invoice PDF
function generateInvoicePDF(booking) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const chunks = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header with gradient effect (simulated with colors)
      doc.rect(0, 0, doc.page.width, 120).fill('#2563eb');
      
      doc.fontSize(32).fillColor('#ffffff').text('INVOICE', 50, 40, { align: 'left' });
      doc.fontSize(12).text('Hospital Appointment Booking', 50, 75);
      doc.fontSize(10).text(`Invoice #${booking.bookingReference}`, 50, 95);

      // Hospital Details
      doc.fontSize(14).fillColor('#111827').text('Hospital Details', 50, 150);
      doc.fontSize(10).fillColor('#4b5563')
        .text(booking.hospitalDetails.name, 50, 175)
        .text(booking.hospitalDetails.address, 50, 190);
      if (booking.hospitalDetails.contact) {
        doc.text(`Contact: ${booking.hospitalDetails.contact}`, 50, 205);
      }

      // Patient Details
      doc.fontSize(14).fillColor('#111827').text('Patient Details', 50, 240);
      doc.fontSize(10).fillColor('#4b5563')
        .text(`Name: ${booking.patientDetails.name}`, 50, 265)
        .text(`Email: ${booking.patientDetails.email}`, 50, 280)
        .text(`Phone: ${booking.patientDetails.phone}`, 50, 295)
        .text(`Age: ${booking.patientDetails.age} years | Gender: ${booking.patientDetails.gender}`, 50, 310);

      // Appointment Details
      doc.fontSize(14).fillColor('#111827').text('Appointment Details', 50, 345);
      doc.fontSize(10).fillColor('#4b5563')
        .text(`Service: ${booking.appointmentDetails.serviceName}`, 50, 370)
        .text(`Department: ${booking.appointmentDetails.departmentName}`, 50, 385)
        .text(`Date: ${new Date(booking.appointmentDetails.appointmentDate).toLocaleDateString('en-IN')}`, 50, 400)
        .text(`Time: ${booking.appointmentDetails.appointmentTime.charAt(0).toUpperCase() + booking.appointmentDetails.appointmentTime.slice(1)}`, 50, 415);

      // Invoice Table
      const tableTop = 460;
      doc.fontSize(12).fillColor('#111827');
      
      // Table Header
      doc.rect(50, tableTop, doc.page.width - 100, 30).fill('#f3f4f6');
      doc.fillColor('#111827')
        .text('Description', 60, tableTop + 10)
        .text('Amount', doc.page.width - 150, tableTop + 10);

      // Table Rows
      let yPos = tableTop + 40;
      doc.fontSize(10).fillColor('#4b5563');
      
      doc.text('Service Fee', 60, yPos)
        .text(`₹${booking.pricing.basePrice}`, doc.page.width - 150, yPos);
      yPos += 25;
      
      doc.text('Convenience Fee', 60, yPos)
        .text(`₹${booking.pricing.convenienceFee}`, doc.page.width - 150, yPos);
      yPos += 25;
      
      doc.text('GST (18%)', 60, yPos)
        .text(`₹${booking.pricing.gst}`, doc.page.width - 150, yPos);
      yPos += 30;

      // Total
      doc.rect(50, yPos - 5, doc.page.width - 100, 35).fill('#dbeafe');
      doc.fontSize(14).fillColor('#2563eb')
        .text('Total Amount', 60, yPos + 5)
        .text(`₹${booking.pricing.total}`, doc.page.width - 150, yPos + 5);

      // Payment Information
      yPos += 60;
      doc.fontSize(14).fillColor('#111827').text('Payment Information', 50, yPos);
      yPos += 25;
      doc.fontSize(10).fillColor('#4b5563')
        .text(`Payment Method: ${booking.payment.method.toUpperCase()}`, 50, yPos)
        .text(`Transaction ID: ${booking.payment.transactionId}`, 50, yPos + 15)
        .text(`Status: ${booking.payment.status.toUpperCase()}`, 50, yPos + 30);

      // Footer
      doc.fontSize(8).fillColor('#9ca3af')
        .text('Thank you for choosing AI Trip Planner Healthcare Services', 50, doc.page.height - 80, {
          align: 'center',
          width: doc.page.width - 100,
        })
        .text(`Generated on ${new Date().toLocaleDateString('en-IN')} at ${new Date().toLocaleTimeString('en-IN')}`, 50, doc.page.height - 60, {
          align: 'center',
          width: doc.page.width - 100,
        });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

// Helper function to generate receipt PDF
function generateReceiptPDF(booking) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const chunks = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      doc.rect(0, 0, doc.page.width, 100).fill('#06b6d4');
      
      doc.fontSize(28).fillColor('#ffffff').text('PAYMENT RECEIPT', 50, 35, { align: 'center' });
      doc.fontSize(10).text(booking.bookingReference, 50, 70, { align: 'center' });

      // Receipt Number and Date
      doc.fontSize(12).fillColor('#111827')
        .text(`Receipt Date: ${new Date().toLocaleDateString('en-IN')}`, 50, 130)
        .text(`Receipt #: ${booking.bookingReference}`, 50, 145);

      // Billing Information
      doc.fontSize(14).fillColor('#111827').text('Billed To:', 50, 180);
      doc.fontSize(10).fillColor('#4b5563')
        .text(booking.patientDetails.name, 50, 205)
        .text(booking.patientDetails.email, 50, 220)
        .text(booking.patientDetails.phone, 50, 235);

      // Service Information
      doc.fontSize(14).fillColor('#111827').text('Service Information:', 50, 270);
      doc.fontSize(10).fillColor('#4b5563')
        .text(`Hospital: ${booking.hospitalDetails.name}`, 50, 295)
        .text(`Service: ${booking.appointmentDetails.serviceName}`, 50, 310)
        .text(`Department: ${booking.appointmentDetails.departmentName}`, 50, 325);

      // Payment Details Box
      const boxTop = 370;
      doc.rect(50, boxTop, doc.page.width - 100, 180).stroke('#e5e7eb');
      
      doc.fontSize(14).fillColor('#111827').text('Payment Details', 60, boxTop + 15);
      
      doc.fontSize(11).fillColor('#4b5563');
      let yPos = boxTop + 45;
      
      doc.text('Service Fee:', 60, yPos)
        .text(`₹${booking.pricing.basePrice}`, doc.page.width - 150, yPos, { align: 'right' });
      yPos += 25;
      
      doc.text('Convenience Fee:', 60, yPos)
        .text(`₹${booking.pricing.convenienceFee}`, doc.page.width - 150, yPos, { align: 'right' });
      yPos += 25;
      
      doc.text('GST (18%):', 60, yPos)
        .text(`₹${booking.pricing.gst}`, doc.page.width - 150, yPos, { align: 'right' });
      yPos += 30;

      // Total Amount
      doc.fontSize(16).fillColor('#06b6d4')
        .text('Total Paid:', 60, yPos)
        .text(`₹${booking.pricing.total}`, doc.page.width - 150, yPos, { align: 'right' });

      // Payment Method
      yPos += 40;
      doc.fontSize(10).fillColor('#4b5563')
        .text(`Payment Method: ${booking.payment.method.toUpperCase()}`, 60, yPos)
        .text(`Transaction ID: ${booking.payment.transactionId}`, 60, yPos + 15);

      // Payment Status Badge
      yPos += 50;
      doc.rect(60, yPos, 150, 30).fill('#10b981').stroke();
      doc.fontSize(14).fillColor('#ffffff')
        .text('✓ PAYMENT COMPLETED', 70, yPos + 8);

      // Footer
      doc.fontSize(8).fillColor('#9ca3af')
        .text('This is a computer-generated receipt and does not require a signature.', 50, doc.page.height - 80, {
          align: 'center',
          width: doc.page.width - 100,
        })
        .text('For any queries, please contact our support team.', 50, doc.page.height - 65, {
          align: 'center',
          width: doc.page.width - 100,
        })
        .text('AI Trip Planner Healthcare Services', 50, doc.page.height - 50, {
          align: 'center',
          width: doc.page.width - 100,
        });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

// Create a new hospital booking
exports.createHospitalBooking = async (req, res) => {
  try {
    const bookingData = {
      user: req.user._id,
      ...req.body,
    };

    if (bookingData.payment && bookingData.payment.status === 'completed') {
      bookingData.payment.paidAt = new Date();
    }

    const booking = new HospitalBooking(bookingData);
    await booking.save();

    // Send confirmation email with PDFs
    await sendHospitalConfirmation(booking);

    res.status(201).json({
      success: true,
      message: 'Hospital appointment booked successfully',
      booking,
    });
  } catch (error) {
    console.error('Error creating hospital booking:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create booking',
    });
  }
};

// Get hospital booking by ID
exports.getHospitalBookingById = async (req, res) => {
  try {
    const booking = await HospitalBooking.findById(req.params.id);

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
        message: 'Unauthorized access',
      });
    }

    res.json({
      success: true,
      booking,
    });
  } catch (error) {
    console.error('Error fetching hospital booking:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch booking',
    });
  }
};

// Get all hospital bookings for a user
exports.getUserHospitalBookings = async (req, res) => {
  try {
    const bookings = await HospitalBooking.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({
      success: true,
      count: bookings.length,
      bookings,
    });
  } catch (error) {
    console.error('Error fetching user hospital bookings:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch bookings',
    });
  }
};

// Cancel hospital booking
exports.cancelHospitalBooking = async (req, res) => {
  try {
    const booking = await HospitalBooking.findById(req.params.id);

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
        message: 'Unauthorized access',
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

    res.json({
      success: true,
      message: 'Booking cancelled successfully',
      booking,
    });
  } catch (error) {
    console.error('Error cancelling hospital booking:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to cancel booking',
    });
  }
};

// Generate and download invoice
exports.generateInvoice = async (req, res) => {
  try {
    const booking = await HospitalBooking.findById(req.params.id);

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
        message: 'Unauthorized access',
      });
    }

    const pdfBuffer = await generateInvoicePDF(booking);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=hospital-invoice-${booking.bookingReference}.pdf`
    );
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error generating invoice:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate invoice',
    });
  }
};

// Generate and download receipt
exports.generateReceipt = async (req, res) => {
  try {
    const booking = await HospitalBooking.findById(req.params.id);

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
        message: 'Unauthorized access',
      });
    }

    const pdfBuffer = await generateReceiptPDF(booking);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=hospital-receipt-${booking.bookingReference}.pdf`
    );
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error generating receipt:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate receipt',
    });
  }
};
