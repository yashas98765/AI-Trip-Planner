const nodemailer = require('nodemailer');
const {
  generateBookingInvoice,
  generateBookingReceipt,
  generateTripInvoice,
  generateTripReceipt,
  generateGasAgencyInvoice,
  generateGasAgencyReceipt,
} = require('./pdfGenerator');

// Configure email transporter using environment variables
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT) || 587,
  secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Format date for display
const formatDate = (date) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

// Format time for display
const formatTime = (time) => {
  if (!time) return 'N/A';
  return time;
};

// Format currency
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
  }).format(amount);
};

// Send booking confirmation email
const sendBookingConfirmation = async (userEmail, userName, bookingDetails) => {
  try {
    const {
      bookingReference,
      bookingType,
      bookingDetails: details,
      numberOfGuests,
      guestDetails,
      checkInDate,
      checkOutDate,
      bookingDate,
      bookingTime,
      departureDate,
      returnDate,
      roomDetails,
      transportDetails,
      restaurantDetails,
      pricing,
      specialRequests,
    } = bookingDetails;

    // Build type-specific details HTML
    let specificDetailsHTML = '';
    
    if (['hotel', 'resort'].includes(bookingType)) {
      specificDetailsHTML = `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Check-in Date:</strong></td>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">${formatDate(checkInDate)}</td>
        </tr>
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Check-out Date:</strong></td>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">${formatDate(checkOutDate)}</td>
        </tr>
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Room Type:</strong></td>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">${roomDetails?.roomType || 'Standard'}</td>
        </tr>
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Number of Rooms:</strong></td>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">${roomDetails?.numberOfRooms || 1}</td>
        </tr>
      `;
    } else if (bookingType === 'restaurant' || bookingType === 'cafe') {
      specificDetailsHTML = `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Booking Date:</strong></td>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">${formatDate(bookingDate)}</td>
        </tr>
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Booking Time:</strong></td>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">${formatTime(bookingTime)}</td>
        </tr>
        ${restaurantDetails?.orderedItems ? `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Total Items:</strong></td>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">${restaurantDetails.totalItems}</td>
        </tr>
        ` : ''}
      `;
    } else if (['car', 'bike', 'bus', 'train', 'flight', 'ship'].includes(bookingType)) {
      specificDetailsHTML = `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>From:</strong></td>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">${transportDetails?.from?.location || 'N/A'}</td>
        </tr>
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>To:</strong></td>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">${transportDetails?.to?.location || 'N/A'}</td>
        </tr>
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Departure Date:</strong></td>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">${formatDate(departureDate)}</td>
        </tr>
        ${returnDate ? `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Return Date:</strong></td>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">${formatDate(returnDate)}</td>
        </tr>
        ` : ''}
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Vehicle Type:</strong></td>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">${transportDetails?.vehicleType || bookingType.toUpperCase()}</td>
        </tr>
      `;
    } else if (bookingType === 'gas_station') {
      const gasDetails = bookingDetails.gasStationDetails || {};
      specificDetailsHTML = `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Fuel Type:</strong></td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-transform: uppercase;">${gasDetails.fuelType || 'Petrol'}</td>
        </tr>
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Quantity:</strong></td>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">${gasDetails.quantity || 0} Liters</td>
        </tr>
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Price per Liter:</strong></td>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">${formatCurrency(gasDetails.pricePerUnit || 0)}</td>
        </tr>
        ${gasDetails.vehicleNumber ? `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Vehicle Number:</strong></td>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">${gasDetails.vehicleNumber}</td>
        </tr>
        ` : ''}
        ${gasDetails.fillDateTime ? `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Fill Date/Time:</strong></td>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">${formatDate(gasDetails.fillDateTime)}</td>
        </tr>
        ` : ''}
      `;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Booking Confirmation</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
        <div style="max-width: 600px; margin: 20px auto; background-color: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #2563eb 0%, #9333ea 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🎉 Booking Confirmed!</h1>
            <p style="color: #e0e7ff; margin: 10px 0 0 0;">Thank you for your booking</p>
          </div>
          
          <!-- Content -->
          <div style="padding: 30px;">
            <p style="font-size: 16px; color: #333; margin-bottom: 20px;">Dear ${userName},</p>
            
            <p style="font-size: 14px; color: #666; margin-bottom: 20px;">
              Your ${bookingType} booking has been successfully confirmed! Here are your booking details:
            </p>
            
            <!-- Booking Reference -->
            <div style="background-color: #f0f9ff; border-left: 4px solid #2563eb; padding: 15px; margin-bottom: 25px; border-radius: 4px;">
              <p style="margin: 0; color: #1e40af; font-size: 14px;"><strong>Booking Reference:</strong></p>
              <p style="margin: 5px 0 0 0; font-size: 20px; font-weight: bold; color: #1e40af;">${bookingReference}</p>
            </div>
            
            <!-- Booking Details Table -->
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px;">
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Booking Type:</strong></td>
                <td style="padding: 10px; border-bottom: 1px solid #eee; text-transform: capitalize;">${bookingType}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Name:</strong></td>
                <td style="padding: 10px; border-bottom: 1px solid #eee;">${details?.name || 'N/A'}</td>
              </tr>
              ${details?.location?.address ? `
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Location:</strong></td>
                <td style="padding: 10px; border-bottom: 1px solid #eee;">${details.location.address}</td>
              </tr>
              ` : ''}
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Number of Guests:</strong></td>
                <td style="padding: 10px; border-bottom: 1px solid #eee;">${numberOfGuests || 0} (Adults: ${guestDetails?.adults || 0}, Children: ${guestDetails?.children || 0})</td>
              </tr>
              ${specificDetailsHTML}
              ${specialRequests ? `
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Special Requests:</strong></td>
                <td style="padding: 10px; border-bottom: 1px solid #eee;">${specialRequests}</td>
              </tr>
              ` : ''}
            </table>
            
            <!-- Pricing Breakdown -->
            <div style="background-color: #fef3c7; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
              <h3 style="margin: 0 0 15px 0; color: #92400e; font-size: 18px;">Payment Summary</h3>
              <table style="width: 100%;">
                <tr>
                  <td style="padding: 5px 0; color: #78350f;">Base Price:</td>
                  <td style="padding: 5px 0; text-align: right; color: #78350f;">${formatCurrency(pricing?.basePrice || 0)}</td>
                </tr>
                <tr>
                  <td style="padding: 5px 0; color: #78350f;">Taxes:</td>
                  <td style="padding: 5px 0; text-align: right; color: #78350f;">${formatCurrency(pricing?.taxes || 0)}</td>
                </tr>
                <tr>
                  <td style="padding: 5px 0; color: #78350f;">Service Fee:</td>
                  <td style="padding: 5px 0; text-align: right; color: #78350f;">${formatCurrency(pricing?.serviceFee || 0)}</td>
                </tr>
                <tr style="border-top: 2px solid #92400e;">
                  <td style="padding: 10px 0 0 0; font-weight: bold; font-size: 16px; color: #78350f;">Total Amount Paid:</td>
                  <td style="padding: 10px 0 0 0; text-align: right; font-weight: bold; font-size: 16px; color: #78350f;">${formatCurrency(pricing?.totalPrice || 0)}</td>
                </tr>
              </table>
            </div>
            
            <!-- Footer Message -->
            <div style="background-color: #ecfdf5; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
              <p style="margin: 0; color: #065f46; font-size: 14px;">
                ✅ <strong>Payment Status:</strong> Confirmed<br>
                📧 <strong>Confirmation sent to:</strong> ${userEmail}
              </p>
            </div>
            
            <p style="font-size: 14px; color: #666; margin-bottom: 10px;">
              If you have any questions or need to make changes to your booking, please contact our support team.
            </p>
            
            <p style="font-size: 14px; color: #666; margin-bottom: 20px;">
              We look forward to serving you!
            </p>
            
            <p style="font-size: 14px; color: #666;">
              Best regards,<br>
              <strong>AI Trip Planner Team</strong>
            </p>
          </div>
          
          <!-- Footer -->
          <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0; font-size: 12px; color: #6b7280;">
              © 2026 AI Trip Planner. All rights reserved.
            </p>
            <p style="margin: 10px 0 0 0; font-size: 12px; color: #6b7280;">
              This is an automated confirmation email. Please do not reply to this email.
            </p>
          </div>
          
        </div>
      </body>
      </html>
    `;

    // Generate PDF attachments
    console.log('Generating invoice and receipt PDFs...');
    const invoicePdf = await generateBookingInvoice(bookingDetails, userName, userEmail);
    const receiptPdf = await generateBookingReceipt(bookingDetails, userName, userEmail);

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER || 'AI Trip Planner <noreply@aitripplanner.com>',
      to: userEmail,
      subject: `🎉 Booking Confirmed - ${bookingReference} - ${details?.name || bookingType.toUpperCase()}`,
      html: htmlContent,
      attachments: [
        {
          filename: `Invoice_${bookingReference}.pdf`,
          content: invoicePdf,
          contentType: 'application/pdf',
        },
        {
          filename: `Receipt_${bookingReference}.pdf`,
          content: receiptPdf,
          contentType: 'application/pdf',
        },
      ],
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Booking confirmation email sent with attachments:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending booking confirmation email:', error);
    return { success: false, error: error.message };
  }
};

// Send trip creation/booking confirmation email
const sendTripConfirmation = async (userEmail, userName, tripDetails) => {
  try {
    const {
      _id,
      title,
      description,
      destination,
      startDate,
      endDate,
      status,
      itinerary,
      preferences,
      createdAt,
    } = tripDetails;

    const tripId = _id?.toString() || 'N/A';
    const days = itinerary?.days?.length || 0;
    const totalCost = itinerary?.totalCost?.amount || preferences?.budget?.max || 0;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Trip Confirmation</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
        <div style="max-width: 600px; margin: 20px auto; background-color: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #2563eb 0%, #9333ea 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">✈️ Trip ${status === 'upcoming' ? 'Confirmed' : 'Saved'}!</h1>
            <p style="color: #e0e7ff; margin: 10px 0 0 0;">Your travel plan is ready</p>
          </div>
          
          <!-- Content -->
          <div style="padding: 30px;">
            <p style="font-size: 16px; color: #333; margin-bottom: 20px;">Dear ${userName},</p>
            
            <p style="font-size: 14px; color: #666; margin-bottom: 20px;">
              ${status === 'upcoming' 
                ? 'Your trip has been successfully planned and confirmed! Here are your trip details:' 
                : 'Your trip draft has been saved successfully! You can continue planning anytime.'
              }
            </p>
            
            <!-- Trip ID -->
            <div style="background-color: #f0f9ff; border-left: 4px solid #2563eb; padding: 15px; margin-bottom: 25px; border-radius: 4px;">
              <p style="margin: 0; color: #1e40af; font-size: 14px;"><strong>Trip ID:</strong></p>
              <p style="margin: 5px 0 0 0; font-size: 16px; font-weight: bold; color: #1e40af;">${tripId}</p>
            </div>
            
            <!-- Trip Details Table -->
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px;">
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Trip Title:</strong></td>
                <td style="padding: 10px; border-bottom: 1px solid #eee;">${title}</td>
              </tr>
              ${description ? `
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Description:</strong></td>
                <td style="padding: 10px; border-bottom: 1px solid #eee;">${description}</td>
              </tr>
              ` : ''}
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Destination:</strong></td>
                <td style="padding: 10px; border-bottom: 1px solid #eee;">${destination?.city || destination || 'N/A'}</td>
              </tr>
              ${startDate ? `
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Start Date:</strong></td>
                <td style="padding: 10px; border-bottom: 1px solid #eee;">${formatDate(startDate)}</td>
              </tr>
              ` : ''}
              ${endDate ? `
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>End Date:</strong></td>
                <td style="padding: 10px; border-bottom: 1px solid #eee;">${formatDate(endDate)}</td>
              </tr>
              ` : ''}
              ${days > 0 ? `
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Duration:</strong></td>
                <td style="padding: 10px; border-bottom: 1px solid #eee;">${days} day${days > 1 ? 's' : ''}</td>
              </tr>
              ` : ''}
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Status:</strong></td>
                <td style="padding: 10px; border-bottom: 1px solid #eee; text-transform: capitalize;">
                  <span style="background-color: ${status === 'upcoming' ? '#dcfce7' : '#fef3c7'}; color: ${status === 'upcoming' ? '#166534' : '#92400e'}; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: bold;">
                    ${status}
                  </span>
                </td>
              </tr>
              ${totalCost > 0 ? `
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Estimated Budget:</strong></td>
                <td style="padding: 10px; border-bottom: 1px solid #eee;">${formatCurrency(totalCost)}</td>
              </tr>
              ` : ''}
            </table>
            
            <!-- Quick Access -->
            <div style="background-color: #ecfdf5; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
              <p style="margin: 0; color: #065f46; font-size: 14px;">
                📱 <strong>Quick Access:</strong><br>
                View and manage your trip in the "My Trips" section of your dashboard.
              </p>
            </div>
            
            <p style="font-size: 14px; color: #666; margin-bottom: 10px;">
              ${status === 'upcoming' 
                ? 'Get ready for an amazing journey! If you need to make any changes, you can edit your trip anytime from your dashboard.'
                : 'Continue planning your trip by adding more details, activities, and bookings whenever you\'re ready.'
              }
            </p>
            
            <p style="font-size: 14px; color: #666; margin-bottom: 20px;">
              Have a wonderful trip!
            </p>
            
            <p style="font-size: 14px; color: #666;">
              Best regards,<br>
              <strong>AI Trip Planner Team</strong>
            </p>
          </div>
          
          <!-- Footer -->
          <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0; font-size: 12px; color: #6b7280;">
              © 2026 AI Trip Planner. All rights reserved.
            </p>
            <p style="margin: 10px 0 0 0; font-size: 12px; color: #6b7280;">
              This is an automated confirmation email. Please do not reply to this email.
            </p>
          </div>
          
        </div>
      </body>
      </html>
    `;

    // Generate PDF attachments
    console.log('Generating trip invoice and receipt PDFs...');
    const tripInvoicePdf = await generateTripInvoice(tripDetails, userName, userEmail);
    const tripReceiptPdf = await generateTripReceipt(tripDetails, userName, userEmail);

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER || 'AI Trip Planner <noreply@aitripplanner.com>',
      to: userEmail,
      subject: `✈️ Trip ${status === 'upcoming' ? 'Confirmed' : 'Saved'} - ${title} - AI Trip Planner`,
      html: htmlContent,
      attachments: [
        {
          filename: `Trip_Invoice_${_id || 'unnamed'}.pdf`,
          content: tripInvoicePdf,
          contentType: 'application/pdf',
        },
        {
          filename: `Trip_Receipt_${_id || 'unnamed'}.pdf`,
          content: tripReceiptPdf,
          contentType: 'application/pdf',
        },
      ],
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Trip confirmation email sent with attachments:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending trip confirmation email:', error);
    return { success: false, error: error.message };
  }
};

// Send gas agency booking confirmation email
const sendGasAgencyConfirmation = async (booking) => {
  try {
    const userEmail = booking.customerDetails.email;
    const userName = booking.customerDetails.name;

    // Generate invoice and receipt PDFs
    const invoicePDF = await generateGasAgencyInvoice(booking);
    const receiptPDF = await generateGasAgencyReceipt(booking);

    // Format delivery date and time
    const deliveryDate = formatDate(booking.orderDetails.deliveryDate);
    const deliveryTime = booking.orderDetails.deliveryTime.charAt(0).toUpperCase() + 
                         booking.orderDetails.deliveryTime.slice(1);

    // Email HTML content
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: linear-gradient(135deg, #FF6B35 0%, #DC2626 100%);
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 10px 10px 0 0;
          }
          .header h1 {
            margin: 0;
            font-size: 28px;
          }
          .success-icon {
            font-size: 60px;
            margin: 20px 0;
          }
          .content {
            background: #fff;
            padding: 30px;
            border: 1px solid #e5e7eb;
            border-top: none;
          }
          .booking-ref {
            background: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
          }
          .details-table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
          }
          .details-table td {
            padding: 12px;
            border-bottom: 1px solid #e5e7eb;
          }
          .details-table td:first-child {
            font-weight: bold;
            color: #FF6B35;
            width: 40%;
          }
          .amount-box {
            background: linear-gradient(135deg, #FF6B35 0%, #DC2626 100%);
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 10px;
            margin: 20px 0;
          }
          .amount-box h2 {
            margin: 0;
            font-size: 32px;
          }
          .info-box {
            background: #ecfdf5;
            border-left: 4px solid #10b981;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
          }
          .footer {
            text-align: center;
            padding: 20px;
            color: #666;
            font-size: 12px;
            border-top: 1px solid #e5e7eb;
          }
          .button {
            display: inline-block;
            padding: 12px 30px;
            background: #FF6B35;
            color: white;
            text-decoration: none;
            border-radius: 6px;
            margin: 10px 5px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔥 Gas Cylinder Booking Confirmed!</h1>
            <div class="success-icon">✓</div>
            <p style="margin: 0; font-size: 16px;">Your booking has been successfully confirmed</p>
          </div>
          
          <div class="content">
            <p>Dear <strong>${userName}</strong>,</p>
            
            <p>Thank you for booking with Gas Agency! Your LPG cylinder order has been confirmed and will be delivered as per your schedule.</p>
            
            <div class="booking-ref">
              <strong>📋 Booking Reference:</strong> ${booking.bookingReference}<br>
              <strong>💳 Transaction ID:</strong> ${booking.payment.transactionId}
            </div>
            
            <h2 style="color: #FF6B35; border-bottom: 2px solid #FF6B35; padding-bottom: 10px;">Order Details</h2>
            <table class="details-table">
              <tr>
                <td>Cylinder Type:</td>
                <td>${booking.orderDetails.cylinderType}</td>
              </tr>
              <tr>
                <td>Quantity:</td>
                <td>${booking.orderDetails.quantity}</td>
              </tr>
              <tr>
                <td>Connection Type:</td>
                <td>${booking.orderDetails.connectionType.toUpperCase()}</td>
              </tr>
              ${booking.orderDetails.connectionNumber ? `
              <tr>
                <td>Connection Number:</td>
                <td>${booking.orderDetails.connectionNumber}</td>
              </tr>
              ` : ''}
              <tr>
                <td>Delivery Date:</td>
                <td>${deliveryDate}</td>
              </tr>
              <tr>
                <td>Delivery Time:</td>
                <td>${deliveryTime}</td>
              </tr>
            </table>
            
            <h2 style="color: #FF6B35; border-bottom: 2px solid #FF6B35; padding-bottom: 10px;">Delivery Address</h2>
            <p>
              <strong>${booking.customerDetails.name}</strong><br>
              ${booking.customerDetails.deliveryAddress}<br>
              ${booking.customerDetails.city}, ${booking.customerDetails.pincode}<br>
              ${booking.customerDetails.landmark ? `Landmark: ${booking.customerDetails.landmark}<br>` : ''}
              Phone: ${booking.customerDetails.phone}
            </p>
            
            <div class="amount-box">
              <div style="font-size: 14px; margin-bottom: 5px;">Total Amount Paid</div>
              <h2>${formatCurrency(booking.pricing.totalPrice)}</h2>
              <div style="font-size: 12px; opacity: 0.9;">Payment Status: SUCCESSFUL</div>
            </div>
            
            <h2 style="color: #FF6B35; border-bottom: 2px solid #FF6B35; padding-bottom: 10px;">Payment Breakdown</h2>
            <table class="details-table">
              <tr>
                <td>Base Price:</td>
                <td>${formatCurrency(booking.pricing.basePrice)}</td>
              </tr>
              ${booking.pricing.deposit > 0 ? `
              <tr>
                <td>Security Deposit:</td>
                <td>${formatCurrency(booking.pricing.deposit)}</td>
              </tr>
              ` : ''}
              <tr>
                <td>Delivery Charges:</td>
                <td>${formatCurrency(booking.pricing.deliveryCharges)}</td>
              </tr>
              <tr>
                <td>GST (5%):</td>
                <td>${formatCurrency(booking.pricing.gst)}</td>
              </tr>
              <tr style="font-weight: bold; background: #f9fafb;">
                <td>Total:</td>
                <td>${formatCurrency(booking.pricing.totalPrice)}</td>
              </tr>
            </table>
            
            <div class="info-box">
              <strong>📄 Documents Attached:</strong><br>
              • Invoice (invoice_${booking.bookingReference}.pdf)<br>
              • Payment Receipt (receipt_${booking.bookingReference}.pdf)
            </div>
            
            ${booking.orderDetails.specialInstructions ? `
            <div style="background: #f9fafb; padding: 15px; border-radius: 6px; margin: 20px 0;">
              <strong>📝 Special Instructions:</strong><br>
              ${booking.orderDetails.specialInstructions}
            </div>
            ` : ''}
            
            <div style="background: #fef3c7; padding: 15px; border-radius: 6px; margin: 20px 0;">
              <strong>⚠️ Important Information:</strong>
              <ul style="margin: 10px 0; padding-left: 20px;">
                <li>Please keep your booking reference handy for delivery confirmation</li>
                ${booking.pricing.deposit > 0 ? '<li>Security deposit is refundable upon returning the empty cylinder</li>' : ''}
                <li>Our delivery partner will call you 30 minutes before arrival</li>
                <li>Please ensure someone is available at the delivery address</li>
                <li>For any queries, contact our customer care: 1800-XXX-XXXX</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin-top: 30px;">
              <p>Need help? Contact us:</p>
              <p>
                📞 Customer Care: 1800-XXX-XXXX<br>
                📧 Email: support@gasagency.com<br>
                🕐 Available 24/7
              </p>
            </div>
          </div>
          
          <div class="footer">
            <p>This is an automated email. Please do not reply to this email.</p>
            <p>© 2024 Gas Agency. All rights reserved.</p>
            <p style="color: #999; font-size: 11px;">
              Fast & Safe LPG Delivery | Serving you with care
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Prepare email options
    const mailOptions = {
      from: `"Gas Agency" <${process.env.EMAIL_USER || 'noreply@gasagency.com'}>`,
      to: userEmail,
      subject: `🔥 Gas Cylinder Booking Confirmed - ${booking.bookingReference}`,
      html: htmlContent,
      attachments: [
        {
          filename: `invoice_${booking.bookingReference}.pdf`,
          content: invoicePDF,
          contentType: 'application/pdf',
        },
        {
          filename: `receipt_${booking.bookingReference}.pdf`,
          content: receiptPDF,
          contentType: 'application/pdf',
        },
      ],
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);
    console.log('Gas agency confirmation email sent with attachments:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending gas agency confirmation email:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendBookingConfirmation,
  sendTripConfirmation,
  sendGasAgencyConfirmation,
};
