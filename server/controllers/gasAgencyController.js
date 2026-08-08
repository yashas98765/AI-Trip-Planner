const GasAgencyBooking = require('../models/GasAgencyBooking');
const { generateGasAgencyInvoice, generateGasAgencyReceipt } = require('../utils/pdfGenerator');
const { sendGasAgencyConfirmation } = require('../utils/emailService');

// @desc    Create gas agency booking
// @route   POST /api/gas-agency/book
// @access  Private
exports.createGasAgencyBooking = async (req, res) => {
  try {
    const {
      agencyDetails,
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
    const booking = await GasAgencyBooking.create({
      user: req.user._id,
      agencyDetails: {
        name: agencyDetails?.name || 'Gas Agency',
        address: agencyDetails?.address || '',
        contact: agencyDetails?.contact || '',
      },
      customerDetails: {
        name: customerDetails.name,
        email: customerDetails.email,
        phone: customerDetails.phone,
        deliveryAddress: customerDetails.deliveryAddress,
        city: customerDetails.city,
        pincode: customerDetails.pincode,
        landmark: customerDetails.landmark || '',
      },
      orderDetails: {
        cylinderType: orderDetails.cylinderType,
        cylinderId: orderDetails.cylinderId,
        quantity: orderDetails.quantity,
        connectionType: orderDetails.connectionType,
        connectionNumber: orderDetails.connectionNumber || '',
        deliveryDate: orderDetails.deliveryDate,
        deliveryTime: orderDetails.deliveryTime,
        specialInstructions: orderDetails.specialInstructions || '',
      },
      pricing: {
        basePrice: pricing.basePrice,
        deposit: pricing.deposit || 0,
        deliveryCharges: pricing.deliveryCharges || 0,
        gst: pricing.gst || 0,
        totalPrice: pricing.totalPrice,
      },
      payment: {
        method: payment.method,
        status: payment.status || 'completed',
        transactionId: payment.transactionId,
        paidAt: payment.paidAt || new Date(),
      },
      bookingStatus: 'confirmed',
    });

    // Generate invoice and receipt PDFs (optional - for saving to file system)
    // The email service will generate them on-the-fly
    booking.invoiceGenerated = true;
    booking.receiptGenerated = true;
    await booking.save();

    // Send confirmation email with PDFs
    try {
      await sendGasAgencyConfirmation(booking);
      booking.emailSent = true;
      await booking.save();
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      // Don't fail the booking if email fails
    }

    res.status(201).json({
      success: true,
      message: 'Gas cylinder booking confirmed successfully',
      booking,
    });
  } catch (error) {
    console.error('Gas agency booking error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create booking',
    });
  }
};

// @desc    Get gas agency booking by ID
// @route   GET /api/gas-agency/booking/:id
// @access  Private
exports.getGasAgencyBookingById = async (req, res) => {
  try {
    const booking = await GasAgencyBooking.findById(req.params.id);

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
    console.error('Get booking error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to retrieve booking',
    });
  }
};

// @desc    Get all gas agency bookings for user
// @route   GET /api/gas-agency/bookings
// @access  Private
exports.getUserGasAgencyBookings = async (req, res) => {
  try {
    const bookings = await GasAgencyBooking.find({ user: req.user._id })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: bookings.length,
      bookings,
    });
  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to retrieve bookings',
    });
  }
};

// @desc    Cancel gas agency booking
// @route   PATCH /api/gas-agency/booking/:id/cancel
// @access  Private
exports.cancelGasAgencyBooking = async (req, res) => {
  try {
    const booking = await GasAgencyBooking.findById(req.params.id);

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

    if (booking.bookingStatus === 'delivered') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel a delivered booking',
      });
    }

    booking.bookingStatus = 'cancelled';
    booking.cancelledAt = new Date();
    booking.cancellationReason = req.body.reason || 'Customer requested cancellation';
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
      message: error.message || 'Failed to cancel booking',
    });
  }
};

// @desc    Generate invoice PDF
// @route   GET /api/gas-agency/invoice/:id
// @access  Private
exports.generateInvoice = async (req, res) => {
  try {
    const booking = await GasAgencyBooking.findById(req.params.id);

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
        message: 'Not authorized to access this invoice',
      });
    }

    // Generate PDF buffer
    const pdfBuffer = await generateGasAgencyInvoice(booking);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=invoice_${booking.bookingReference}.pdf`
    );
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Generate invoice error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate invoice',
    });
  }
};

// @desc    Generate receipt PDF
// @route   GET /api/gas-agency/receipt/:id
// @access  Private
exports.generateReceipt = async (req, res) => {
  try {
    const booking = await GasAgencyBooking.findById(req.params.id);

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
        message: 'Not authorized to access this receipt',
      });
    }

    // Generate PDF buffer
    const pdfBuffer = await generateGasAgencyReceipt(booking);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=receipt_${booking.bookingReference}.pdf`
    );
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Generate receipt error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate receipt',
    });
  }
};
