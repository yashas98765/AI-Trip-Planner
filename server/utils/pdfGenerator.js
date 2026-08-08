const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// Helper function to format currency
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
  }).format(amount || 0);
};

// Helper function to format date
const formatDate = (date) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

// Helper function to format time
const formatTime = (time) => {
  if (!time) return 'N/A';
  // If time is a full date object
  if (time instanceof Date || !isNaN(Date.parse(time))) {
    return new Date(time).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }
  return time;
};

// Helper to write a list of label/value pairs and handle page breaks
const writeDetailRows = (doc, rows, startY) => {
  let yPos = startY;
  rows.forEach(([label, value]) => {
    if (value === undefined || value === null || value === '') return;
    // Ensure space on page
    if (yPos > 720) {
      doc.addPage();
      yPos = 50;
    }
    doc.font('Helvetica-Bold').fontSize(8).fillColor('#111827').text(label + ':', 50, yPos);
    doc.font('Helvetica').fontSize(8).fillColor('#111827').text(String(value), 175, yPos, { width: 385 });
    yPos += 10;
  });
  return yPos;
};

const getOrderedItems = (booking) => {
  const candidates = [
    booking?.restaurantDetails?.orderedItems,
    booking?.bookingDetails?.orderedItems,
    booking?.bookingDetails?.orderItems,
    booking?.bookingDetails?.items,
    booking?.orderDetails?.items,
    booking?.orderItems,
    booking?.items,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate) && candidate.length > 0) {
      return candidate;
    }
  }

  return [];
};

const formatOrderedItems = (booking) => {
  const orderedItems = getOrderedItems(booking);

  if (!orderedItems.length) {
    return null;
  }

  return orderedItems
    .map((item) => {
      if (typeof item === 'string') {
        return item;
      }

      const itemName = item?.itemName || item?.name || item?.title || 'Item';
      const quantity = Number(item?.quantity ?? item?.qty ?? 1);
      const price = Number(item?.price ?? item?.unitPrice ?? 0);
      const total = Number.isFinite(price * quantity) ? price * quantity : 0;

      return `${itemName} x ${quantity} = ${formatCurrency(total)}`;
    })
    .join('\n');
};

const getOrderedItemsTotal = (booking) => {
  const orderedItems = getOrderedItems(booking);
  if (!orderedItems.length) return null;

  const total = orderedItems.reduce((sum, item) => {
    if (typeof item === 'string') return sum;
    const quantity = Number(item?.quantity ?? item?.qty ?? 1);
    const price = Number(item?.price ?? item?.unitPrice ?? 0);
    return sum + (Number.isFinite(price * quantity) ? price * quantity : 0);
  }, 0);

  return total > 0 ? total : null;
};

const writeOrderedItemsSection = (doc, booking, startY) => {
  const orderedItems = getOrderedItems(booking);
  if (!orderedItems.length) {
    return startY;
  }

  let yPos = startY;
  const totalItems = booking.restaurantDetails?.totalItems ?? booking.bookingDetails?.totalItems ?? booking.orderDetails?.totalItems ?? orderedItems.length;

  if (yPos > 650) {
    doc.addPage();
    yPos = 50;
  }

  doc.fontSize(11).font('Helvetica-Bold').fillColor('#111827').text('ORDERED ITEMS:', 50, yPos);
  yPos += 14;

  doc.rect(50, yPos, 512, 16).fillAndStroke('#FFF7ED', '#FB923C');
  doc.fillColor('#111827')
    .fontSize(7)
    .font('Helvetica-Bold')
    .text('Item', 60, yPos + 4)
    .text('Qty', 500, yPos + 4, { width: 50, align: 'right' });

  yPos += 16;
  let orderTotal = 0;

  orderedItems.forEach((item) => {
    if (yPos > 720) {
      doc.addPage();
      yPos = 50;
    }

    if (typeof item === 'string') {
      doc.rect(50, yPos, 512, 12).stroke();
      doc.fontSize(7).font('Helvetica').fillColor('#111827').text(item, 60, yPos + 3, { width: 430 });
      yPos += 12;
      return;
    }

    const itemName = item?.itemName || item?.name || item?.title || 'Item';
    const quantity = Number(item?.quantity ?? item?.qty ?? 1);
    const unitPrice = Number(item?.price ?? item?.unitPrice ?? 0);
    const lineTotal = Number.isFinite(unitPrice * quantity) ? unitPrice * quantity : 0;
    orderTotal += lineTotal;

    doc.rect(50, yPos, 512, 12).stroke();
    doc.fontSize(7).font('Helvetica').fillColor('#111827').text(itemName, 60, yPos + 3, { width: 430 });
    doc.text(String(quantity), 500, yPos + 3, { width: 50, align: 'right' });
    yPos += 12;
  });

  doc.fontSize(7).font('Helvetica-Bold').fillColor('#7C2D12').text(`Total Items: ${totalItems}`, 50, yPos + 4);
  doc.text(`Order Total: ${formatCurrency(orderTotal)}`, 400, yPos + 4, { width: 162, align: 'right' });
  return yPos + 14;
};

/**
 * Generate Booking Invoice PDF
 */
async function generateBookingInvoice(booking, userName, userEmail) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const chunks = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const bookingType = booking.bookingType || 'service';
      const details = booking.bookingDetails || {};
      const pricing = booking.pricing || {};
      const basePrice = pricing.basePrice ?? booking.basePrice ?? booking.amount ?? 0;
      const taxes = pricing.taxes ?? booking.taxes ?? 0;
      const serviceFee = pricing.serviceFee ?? booking.serviceFee ?? 0;
      const totalAmount = pricing.totalPrice ?? booking.totalAmount ?? booking.amount ?? (basePrice + taxes + serviceFee);
      const displayAmount = getOrderedItemsTotal(booking) ?? totalAmount;
      const bookingRef = booking.bookingReference || 'N/A';

      // Header with gradient effect (simulated with rectangles)
      doc.rect(0, 0, 612, 150).fill('#4F46E5');
      
      // Company name and invoice title
      doc.fillColor('#FFFFFF')
         .fontSize(28)
         .font('Helvetica-Bold')
         .text('AI TRIP PLANNER', 50, 40);
      
      doc.fontSize(14)
         .font('Helvetica')
         .text('Your Journey, Our Priority', 50, 75);
      
      doc.fontSize(20)
         .font('Helvetica-Bold')
         .text('INVOICE', 50, 110);

      // Reset to black for body
      doc.fillColor('#000000');

      // Invoice details box
      let yPos = 180;
      doc.fontSize(10)
         .font('Helvetica-Bold')
         .text('Invoice Number:', 50, yPos)
         .font('Helvetica')
         .text(bookingRef, 150, yPos);

      yPos += 20;
      doc.font('Helvetica-Bold')
         .text('Invoice Date:', 50, yPos)
         .font('Helvetica')
         .text(formatDate(booking.createdAt || new Date()), 150, yPos);

      yPos += 20;
      doc.font('Helvetica-Bold')
         .text('Booking Type:', 50, yPos)
         .font('Helvetica')
         .text(bookingType.toUpperCase(), 150, yPos);

      // Customer details
      yPos += 40;
      doc.fontSize(14)
         .font('Helvetica-Bold')
         .text('BILL TO:', 50, yPos);

      yPos += 25;
      doc.fontSize(10)
         .font('Helvetica')
         .text(userName || 'Valued Customer', 50, yPos);

      yPos += 15;
      doc.text(userEmail, 50, yPos);

      // Booking details
      yPos += 40;
      doc.fontSize(14)
         .font('Helvetica-Bold')
         .text('BOOKING DETAILS:', 50, yPos);

      yPos += 25;
      doc.fontSize(10)
         .font('Helvetica');

      // Generic booking details (always present when available)
      const genericRows = [];
      genericRows.push(['Booking Reference', bookingRef]);
      if (details.name) genericRows.push(['Booking Name', details.name]);
      if (details.description) genericRows.push(['Description', details.description]);
      if (details.location?.address) genericRows.push(['Address', details.location.address]);
      if (details.location?.city) genericRows.push(['City', details.location.city]);
      if (bookingType === 'hotel' || bookingType === 'resort') {
        if (booking.checkInDate) genericRows.push(['Check-in Date', formatDate(booking.checkInDate)]);
        if (booking.checkOutDate) genericRows.push(['Check-out Date', formatDate(booking.checkOutDate)]);
        if (booking.numberOfGuests) genericRows.push(['Guests', `${booking.numberOfGuests} guest(s)`]);
      } else if (bookingType === 'restaurant' || bookingType === 'cafe') {
        if (booking.bookingDate) genericRows.push(['Booking Date', formatDate(booking.bookingDate)]);
        if (booking.bookingTime) genericRows.push(['Booking Time', formatTime(booking.bookingTime)]);
        if (booking.numberOfGuests) genericRows.push(['Guests', `${booking.numberOfGuests} person(s)`]);
      } else if (['car', 'bike', 'bus', 'train', 'flight', 'ship'].includes(bookingType)) {
        if (booking.transportDetails?.from?.location || booking.from || booking.pickup) {
          genericRows.push(['From', booking.transportDetails?.from?.location || booking.from || booking.pickup]);
        }
        if (booking.transportDetails?.to?.location || booking.to || booking.dropoff) {
          genericRows.push(['To', booking.transportDetails?.to?.location || booking.to || booking.dropoff]);
        }
        if (booking.travelDate || booking.checkInDate) {
          genericRows.push(['Travel Date', formatDate(booking.travelDate || booking.checkInDate)]);
        }
        if (booking.numberOfPassengers) genericRows.push(['Passengers', `${booking.numberOfPassengers} person(s)`]);
      } else if (bookingType === 'package') {
        if (details.destination) genericRows.push(['Destination', details.destination]);
        if (booking.checkInDate) genericRows.push(['Start Date', formatDate(booking.checkInDate)]);
        if (booking.checkOutDate) genericRows.push(['End Date', formatDate(booking.checkOutDate)]);
      } else if (bookingType === 'gas_station') {
        const gasDetails = booking.gasStationDetails || {};
        if (gasDetails.stationName || details.name) genericRows.push(['Station', gasDetails.stationName || details.name]);
        if (gasDetails.stationAddress || details.location) genericRows.push(['Location', gasDetails.stationAddress || details.location]);
        if (gasDetails.fuelType) genericRows.push(['Fuel Type', gasDetails.fuelType.toUpperCase()]);
        if (gasDetails.quantity !== undefined) genericRows.push(['Quantity', `${gasDetails.quantity} Liters`]);
        if (gasDetails.pricePerUnit !== undefined) genericRows.push(['Price per Liter', formatCurrency(gasDetails.pricePerUnit)]);
        if (gasDetails.vehicleNumber) genericRows.push(['Vehicle Number', gasDetails.vehicleNumber]);
        if (gasDetails.fillDateTime) genericRows.push(['Fill Date/Time', formatDate(gasDetails.fillDateTime)]);
      }
      if (booking.guestDetails) {
        genericRows.push(['Adults', booking.guestDetails.adults ?? 0]);
        genericRows.push(['Children', booking.guestDetails.children ?? 0]);
        genericRows.push(['Infants', booking.guestDetails.infants ?? 0]);
      }
      if (booking.transportDetails) {
        if (booking.transportDetails.from?.location) genericRows.push(['From', booking.transportDetails.from.location]);
        if (booking.transportDetails.to?.location) genericRows.push(['To', booking.transportDetails.to.location]);
        if (booking.transportDetails.vehicleModel) genericRows.push(['Vehicle Model', booking.transportDetails.vehicleModel]);
        if (booking.transportDetails.flightNumber) genericRows.push(['Flight No.', booking.transportDetails.flightNumber]);
      }
      if (booking.roomDetails) {
        if (booking.roomDetails.roomType) genericRows.push(['Room Type', booking.roomDetails.roomType]);
        if (booking.roomDetails.numberOfRooms) genericRows.push(['Number of Rooms', booking.roomDetails.numberOfRooms]);
      }
      if (booking.gasStationDetails) {
        const g = booking.gasStationDetails;
        if (g.fuelType) genericRows.push(['Fuel Type', g.fuelType.toUpperCase()]);
        if (g.quantity) genericRows.push(['Quantity (L)', g.quantity]);
        if (g.pricePerUnit) genericRows.push(['Price per Unit', formatCurrency(g.pricePerUnit)]);
      }
      if (booking.specialRequests) genericRows.push(['Special Requests', booking.specialRequests]);

      yPos = writeDetailRows(doc, genericRows, yPos + 6);

      yPos = writeOrderedItemsSection(doc, booking, yPos + 6);

      // Payment breakdown table
      yPos += 18;
      doc.fontSize(12)
         .font('Helvetica-Bold')
         .text('PAYMENT SUMMARY:', 50, yPos);

      yPos += 16;
      
      // Table header
      doc.rect(50, yPos, 512, 20).fillAndStroke('#4F46E5', '#4F46E5');
      doc.fillColor('#FFFFFF')
        .fontSize(8)
         .font('Helvetica-Bold')
        .text('Description', 60, yPos + 6)
        .text('Amount', 450, yPos + 6);

      yPos += 20;
      doc.fillColor('#000000');

      // Payment breakdown rows (use pricing fields when available)
      const descriptionLabel = `${bookingType.charAt(0).toUpperCase() + bookingType.slice(1)} Booking`;

      // Base amount row
      doc.rect(50, yPos, 512, 16).stroke();
      doc.font('Helvetica')
        .fontSize(8)
        .text(descriptionLabel, 60, yPos + 4)
        .text(formatCurrency(basePrice), 450, yPos + 4);

      yPos += 16;

      // Taxes row
      doc.rect(50, yPos, 512, 16).stroke();
      doc.text('Taxes', 60, yPos + 4)
        .text(formatCurrency(taxes), 450, yPos + 4);

      yPos += 16;

      // Service fee row
      doc.rect(50, yPos, 512, 16).stroke();
      doc.text('Service Fee', 60, yPos + 4)
        .text(formatCurrency(serviceFee), 450, yPos + 4);

      yPos += 16;

      // Total row
      doc.rect(50, yPos, 512, 18).fillAndStroke('#F3F4F6', '#E5E7EB');
      doc.font('Helvetica-Bold')
        .fontSize(8)
        .text('TOTAL AMOUNT', 60, yPos + 5)
        .text(formatCurrency(displayAmount), 450, yPos + 5);

      // Payment status
      yPos += 24;
      const paymentStatus = booking.paymentDetails?.status || booking.paymentStatus || 'pending';
      doc.fontSize(9)
        .font('Helvetica-Bold')
        .fillColor('#111827')
        .text('Payment Status:', 50, yPos)
        .font('Helvetica-Bold')
        .fillColor(paymentStatus === 'completed' || paymentStatus === 'paid' ? '#10B981' : '#F59E0B')
        .text(paymentStatus.toUpperCase(), 150, yPos);

      // Footer
      yPos = 760;
      doc.fillColor('#6B7280')
         .fontSize(8)
         .font('Helvetica')
         .text('Thank you for choosing AI Trip Planner!', 50, yPos, { align: 'center', width: 512 });
      
      yPos += 12;
      doc.text('For support, contact us at support@aitripplanner.com', 50, yPos, { align: 'center', width: 512 });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Generate Booking Receipt PDF
 */
async function generateBookingReceipt(booking, userName, userEmail) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const chunks = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const bookingType = booking.bookingType || 'service';
      const details = booking.bookingDetails || {};
      const pricing = booking.pricing || {};
      const basePrice = pricing.basePrice ?? booking.basePrice ?? booking.amount ?? 0;
      const taxes = pricing.taxes ?? booking.taxes ?? 0;
      const serviceFee = pricing.serviceFee ?? booking.serviceFee ?? 0;
      const totalAmount = pricing.totalPrice ?? booking.totalAmount ?? booking.amount ?? (basePrice + taxes + serviceFee);
      const displayAmount = getOrderedItemsTotal(booking) ?? totalAmount;
      const bookingRef = booking.bookingReference || 'N/A';

      // Header
      doc.rect(0, 0, 612, 120).fill('#10B981');
      
      doc.fillColor('#FFFFFF')
         .fontSize(28)
         .font('Helvetica-Bold')
         .text('PAYMENT RECEIPT', 50, 40);
      
      doc.fontSize(12)
         .font('Helvetica')
         .text('This is a computer-generated receipt', 50, 80);

      doc.fillColor('#000000');

      // Receipt details
      let yPos = 150;
      doc.fontSize(10)
         .font('Helvetica-Bold')
         .text('Receipt Number:', 50, yPos)
         .font('Helvetica')
         .text(bookingRef, 180, yPos);

      yPos += 20;
      const paidDate = booking.paymentDetails?.paidAt || booking.createdAt || new Date();
      doc.font('Helvetica-Bold')
         .text('Payment Date:', 50, yPos)
         .font('Helvetica')
         .text(formatDate(paidDate), 180, yPos);

      yPos += 20;
      const paymentMethod = booking.paymentDetails?.method || 'Online Payment';
      doc.font('Helvetica-Bold')
        .fontSize(9)
        .fillColor('#111827')
        .text('Payment Method:', 50, yPos)
        .font('Helvetica-Bold')
        .text(paymentMethod, 180, yPos);

      // Customer details
      yPos += 40;
      doc.fontSize(11)
         .font('Helvetica-Bold')
        .text('CUSTOMER DETAILS:', 50, yPos);

      yPos += 16;

      // Generic booking details for receipt
      const receiptGenericRows = [];
      receiptGenericRows.push(['Name', userName || 'Valued Customer']);
      receiptGenericRows.push(['Email', userEmail || 'N/A']);
      receiptGenericRows.push(['Booking Reference', bookingRef]);
      if (details.name) receiptGenericRows.push(['Booking Name', details.name]);
      if (details.description) receiptGenericRows.push(['Description', details.description]);
      if (details.location?.address) receiptGenericRows.push(['Address', details.location.address]);
      if (details.location?.city) receiptGenericRows.push(['City', details.location.city]);
      if (booking.numberOfGuests) receiptGenericRows.push(['Number of Guests', booking.numberOfGuests]);
      if (booking.guestDetails) {
        receiptGenericRows.push(['Adults', booking.guestDetails.adults ?? 0]);
        receiptGenericRows.push(['Children', booking.guestDetails.children ?? 0]);
        receiptGenericRows.push(['Infants', booking.guestDetails.infants ?? 0]);
      }
      if (booking.transportDetails) {
        if (booking.transportDetails.from?.location) receiptGenericRows.push(['From', booking.transportDetails.from.location]);
        if (booking.transportDetails.to?.location) receiptGenericRows.push(['To', booking.transportDetails.to.location]);
        if (booking.transportDetails.vehicleModel) receiptGenericRows.push(['Vehicle Model', booking.transportDetails.vehicleModel]);
      }
      if (booking.roomDetails && booking.roomDetails.roomType) receiptGenericRows.push(['Room Type', booking.roomDetails.roomType]);
      if (booking.specialRequests) receiptGenericRows.push(['Special Requests', booking.specialRequests]);

      yPos = writeDetailRows(doc, receiptGenericRows, yPos);

      yPos = writeOrderedItemsSection(doc, booking, yPos + 10);

      // Amount box
      yPos += 30;
      doc.rect(50, yPos, 512, 60).fillAndStroke('#EFF6FF', '#3B82F6');
      
      yPos += 20;
      doc.fillColor('#1E40AF')
         .fontSize(12)
         .font('Helvetica-Bold')
         .text('AMOUNT PAID:', 60, yPos);
      
      yPos += 20;
      // Display breakdown on receipt as well
      doc.fontSize(24)
        .text(formatCurrency(displayAmount), 60, yPos);

      // Payment confirmation
      yPos += 60;
      doc.fillColor('#000000')
         .fontSize(10)
         .font('Helvetica')
         .text('This receipt confirms that the above amount has been received successfully.', 50, yPos, { width: 512 });

      // Footer
      yPos = 720;
      doc.rect(50, yPos, 512, 1).fillAndStroke('#E5E7EB', '#E5E7EB');
      
      yPos += 15;
      doc.fillColor('#6B7280')
         .fontSize(8)
         .font('Helvetica')
         .text('AI Trip Planner | www.aitripplanner.com | support@aitripplanner.com', 50, yPos, { align: 'center', width: 512 });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Generate Trip Invoice PDF
 */
async function generateTripInvoice(trip, userName, userEmail) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const chunks = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const tripTitle = trip.title || 'Trip Plan';
      const destination = trip.destination || 'Multiple Destinations';
      const budget = trip.budget || 0;
      const tripId = trip._id || 'N/A';

      // Header
      doc.rect(0, 0, 612, 150).fill('#8B5CF6');
      
      doc.fillColor('#FFFFFF')
         .fontSize(28)
         .font('Helvetica-Bold')
         .text('AI TRIP PLANNER', 50, 40);
      
      doc.fontSize(14)
         .font('Helvetica')
         .text('Trip Planning Invoice', 50, 75);
      
      doc.fontSize(20)
         .font('Helvetica-Bold')
         .text('INVOICE', 50, 110);

      doc.fillColor('#000000');

      // Invoice details
      let yPos = 180;
      doc.fontSize(10)
         .font('Helvetica-Bold')
         .text('Invoice Number:', 50, yPos)
         .font('Helvetica')
         .text(`TRIP-${tripId.toString().substring(0, 12).toUpperCase()}`, 150, yPos);

      yPos += 20;
      doc.font('Helvetica-Bold')
         .text('Invoice Date:', 50, yPos)
         .font('Helvetica')
         .text(formatDate(trip.createdAt || new Date()), 150, yPos);

      yPos += 20;
      doc.font('Helvetica-Bold')
         .text('Trip Status:', 50, yPos)
         .font('Helvetica')
         .text((trip.status || 'draft').toUpperCase(), 150, yPos);

      // Customer details
      yPos += 40;
      doc.fontSize(14)
         .font('Helvetica-Bold')
         .text('BILL TO:', 50, yPos);

      yPos += 25;
      doc.fontSize(10)
         .font('Helvetica')
         .text(userName || 'Valued Customer', 50, yPos);

      yPos += 15;
      doc.text(userEmail, 50, yPos);

      // Trip details
      yPos += 40;
      doc.fontSize(14)
         .font('Helvetica-Bold')
         .text('TRIP DETAILS:', 50, yPos);

      yPos += 25;
      doc.fontSize(10);

      doc.font('Helvetica-Bold').text('Trip Name:', 50, yPos)
         .font('Helvetica').text(tripTitle, 150, yPos);
      yPos += 15;

      doc.font('Helvetica-Bold').text('Destination:', 50, yPos)
         .font('Helvetica').text(destination, 150, yPos);
      yPos += 15;

      if (trip.startDate) {
        doc.font('Helvetica-Bold').text('Start Date:', 50, yPos)
           .font('Helvetica').text(formatDate(trip.startDate), 150, yPos);
        yPos += 15;
      }

      if (trip.endDate) {
        doc.font('Helvetica-Bold').text('End Date:', 50, yPos)
           .font('Helvetica').text(formatDate(trip.endDate), 150, yPos);
        yPos += 15;
      }

      if (trip.duration) {
        doc.font('Helvetica-Bold').text('Duration:', 50, yPos)
           .font('Helvetica').text(`${trip.duration} days`, 150, yPos);
        yPos += 15;
      }

      if (trip.travelers) {
        doc.font('Helvetica-Bold').text('Travelers:', 50, yPos)
           .font('Helvetica').text(`${trip.travelers} person(s)`, 150, yPos);
        yPos += 15;
      }

      // Budget summary
      yPos += 30;
      doc.fontSize(14)
         .font('Helvetica-Bold')
         .text('BUDGET SUMMARY:', 50, yPos);

      yPos += 25;

      // Table header
      doc.rect(50, yPos, 512, 25).fillAndStroke('#8B5CF6', '#8B5CF6');
      doc.fillColor('#FFFFFF')
         .fontSize(10)
         .font('Helvetica-Bold')
         .text('Description', 60, yPos + 8)
         .text('Amount', 450, yPos + 8);

      yPos += 25;
      doc.fillColor('#000000');

      // Trip planning service
      doc.rect(50, yPos, 512, 20).stroke();
      doc.font('Helvetica')
         .text('Trip Planning Service', 60, yPos + 5)
         .text(formatCurrency(budget * 0.7), 450, yPos + 5);

      yPos += 20;

      // Booking assistance
      doc.rect(50, yPos, 512, 20).stroke();
      doc.text('Booking & Coordination', 60, yPos + 5)
         .text(formatCurrency(budget * 0.2), 450, yPos + 5);

      yPos += 20;

      // Service charges
      doc.rect(50, yPos, 512, 20).stroke();
      doc.text('Service Charges', 60, yPos + 5)
         .text(formatCurrency(budget * 0.1), 450, yPos + 5);

      yPos += 20;

      // Total
      doc.rect(50, yPos, 512, 25).fillAndStroke('#F3F4F6', '#E5E7EB');
      doc.font('Helvetica-Bold')
         .text('ESTIMATED TOTAL', 60, yPos + 7)
         .text(formatCurrency(budget), 450, yPos + 7);

      // Footer
      yPos = 750;
      doc.fillColor('#6B7280')
         .fontSize(8)
         .font('Helvetica')
         .text('Thank you for planning with AI Trip Planner!', 50, yPos, { align: 'center', width: 512 });
      
      yPos += 12;
      doc.text('For support, contact us at support@aitripplanner.com', 50, yPos, { align: 'center', width: 512 });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Generate Trip Receipt PDF
 */
async function generateTripReceipt(trip, userName, userEmail) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const chunks = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const tripTitle = trip.title || 'Trip Plan';
      const destination = trip.destination || 'Multiple Destinations';
      const tripId = trip._id || 'N/A';

      // Header
      doc.rect(0, 0, 612, 120).fill('#10B981');
      
      doc.fillColor('#FFFFFF')
         .fontSize(28)
         .font('Helvetica-Bold')
         .text('TRIP CONFIRMATION', 50, 40);
      
      doc.fontSize(12)
         .font('Helvetica')
         .text('Your trip has been successfully saved', 50, 80);

      doc.fillColor('#000000');

      // Receipt details
      let yPos = 150;
      doc.fontSize(10)
         .font('Helvetica-Bold')
         .text('Trip ID:', 50, yPos)
         .font('Helvetica')
         .text(tripId.toString(), 180, yPos);

      yPos += 20;
      doc.font('Helvetica-Bold')
         .text('Created On:', 50, yPos)
         .font('Helvetica')
         .text(formatDate(trip.createdAt || new Date()), 180, yPos);

      yPos += 20;
      doc.font('Helvetica-Bold')
         .text('Status:', 50, yPos)
         .font('Helvetica')
         .fillColor(trip.status === 'upcoming' ? '#10B981' : '#F59E0B')
         .text((trip.status || 'draft').toUpperCase(), 180, yPos);

      // Customer details
      doc.fillColor('#000000');
      yPos += 40;
      doc.fontSize(12)
         .font('Helvetica-Bold')
         .text('PLANNED FOR:', 50, yPos);

      yPos += 25;
      doc.fontSize(10)
         .font('Helvetica')
         .text(userName || 'Valued Customer', 50, yPos);

      yPos += 15;
      doc.text(userEmail, 50, yPos);

      // Trip summary box
      yPos += 40;
      doc.rect(50, yPos, 512, 120).fillAndStroke('#EEF2FF', '#818CF8');
      
      yPos += 20;
      doc.fillColor('#000000')
         .fontSize(16)
         .font('Helvetica-Bold')
         .text(tripTitle, 60, yPos, { width: 492 });

      yPos += 30;
      doc.fontSize(10)
         .font('Helvetica')
         .text(`📍 ${destination}`, 60, yPos);

      yPos += 20;
      if (trip.startDate && trip.endDate) {
        doc.text(`🗓️ ${formatDate(trip.startDate)} - ${formatDate(trip.endDate)}`, 60, yPos);
      }

      yPos += 20;
      if (trip.duration) {
        doc.text(`⏱️ ${trip.duration} days`, 60, yPos);
      }

      // Footer
      yPos = 720;
      doc.rect(50, yPos, 512, 1).fillAndStroke('#E5E7EB', '#E5E7EB');
      
      yPos += 15;
      doc.fillColor('#6B7280')
         .fontSize(8)
         .font('Helvetica')
         .text('AI Trip Planner | www.aitripplanner.com | support@aitripplanner.com', 50, yPos, { align: 'center', width: 512 });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Generate Invoice PDF for Gas Agency Booking
 */
async function generateGasAgencyInvoice(booking) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const chunks = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header - Company Logo and Details
      doc
        .fontSize(28)
        .fillColor('#FF6B35')
        .text('GAS AGENCY', 50, 50, { bold: true });

      doc
        .fontSize(10)
        .fillColor('#666666')
        .text('Fast & Safe LPG Delivery', 50, 85)
        .text('Customer Care: 1800-XXX-XXXX', 50, 100)
        .text('Email: support@gasagency.com', 50, 115);

      // Invoice Title
      doc
        .fontSize(24)
        .fillColor('#FF6B35')
        .text('INVOICE', 400, 50, { align: 'right' });

      // Invoice Details Box
      doc
        .fontSize(10)
        .fillColor('#333333')
        .text(`Invoice No: ${booking.bookingReference}`, 400, 85, { align: 'right' })
        .text(`Date: ${formatDate(booking.createdAt)}`, 400, 100, { align: 'right' })
        .text(`Transaction ID: ${booking.payment.transactionId}`, 400, 115, { align: 'right' });

      // Horizontal Line
      doc
        .strokeColor('#FF6B35')
        .lineWidth(2)
        .moveTo(50, 150)
        .lineTo(545, 150)
        .stroke();

      // Customer Details Section
      doc
        .fontSize(14)
        .fillColor('#FF6B35')
        .text('BILL TO:', 50, 170);

      doc
        .fontSize(11)
        .fillColor('#333333')
        .font('Helvetica-Bold')
        .text(booking.customerDetails.name, 50, 195)
        .font('Helvetica')
        .text(booking.customerDetails.deliveryAddress, 50, 212, { width: 250 })
        .text(`${booking.customerDetails.city}, ${booking.customerDetails.pincode}`, 50, 245)
        .text(`Phone: ${booking.customerDetails.phone}`, 50, 260)
        .text(`Email: ${booking.customerDetails.email}`, 50, 275);

      // Delivery Details Section
      doc
        .fontSize(14)
        .fillColor('#FF6B35')
        .text('DELIVERY DETAILS:', 320, 170);

      doc
        .fontSize(11)
        .fillColor('#333333')
        .text(`Date: ${formatDate(booking.orderDetails.deliveryDate)}`, 320, 195)
        .text(`Time: ${booking.orderDetails.deliveryTime.charAt(0).toUpperCase() + booking.orderDetails.deliveryTime.slice(1)}`, 320, 212)
        .text(`Connection Type: ${booking.orderDetails.connectionType.toUpperCase()}`, 320, 229);

      if (booking.orderDetails.connectionNumber) {
        doc.text(`Connection No: ${booking.orderDetails.connectionNumber}`, 320, 246);
      }

      // Order Items Table
      const tableTop = 330;
      
      // Table Header
      doc
        .rect(50, tableTop, 495, 30)
        .fillAndStroke('#FF6B35', '#FF6B35');

      doc
        .fontSize(11)
        .fillColor('#FFFFFF')
        .font('Helvetica-Bold')
        .text('ITEM DESCRIPTION', 60, tableTop + 10)
        .text('QTY', 340, tableTop + 10)
        .text('RATE', 400, tableTop + 10)
        .text('AMOUNT', 480, tableTop + 10, { align: 'right' });

      // Table Row - Cylinder Details
      let yPosition = tableTop + 40;
      
      doc
        .font('Helvetica')
        .fillColor('#333333')
        .text(booking.orderDetails.cylinderType, 60, yPosition)
        .text(booking.orderDetails.quantity.toString(), 340, yPosition)
        .text(formatCurrency(booking.pricing.basePrice / booking.orderDetails.quantity), 400, yPosition)
        .text(formatCurrency(booking.pricing.basePrice), 480, yPosition, { align: 'right' });

      yPosition += 25;

      // Deposit Row (if applicable)
      if (booking.pricing.deposit > 0) {
        doc
          .text('Security Deposit (Refundable)', 60, yPosition)
          .text('-', 340, yPosition)
          .text('-', 400, yPosition)
          .text(formatCurrency(booking.pricing.deposit), 480, yPosition, { align: 'right' });
        
        yPosition += 25;
      }

      // Delivery Charges Row
      doc
        .text('Delivery Charges', 60, yPosition)
        .text('-', 340, yPosition)
        .text('-', 400, yPosition)
        .text(formatCurrency(booking.pricing.deliveryCharges), 480, yPosition, { align: 'right' });

      yPosition += 25;

      // Subtotal Line
      doc
        .strokeColor('#CCCCCC')
        .lineWidth(1)
        .moveTo(50, yPosition)
        .lineTo(545, yPosition)
        .stroke();

      yPosition += 15;

      // Subtotal
      const subtotal = booking.pricing.basePrice + booking.pricing.deposit + booking.pricing.deliveryCharges;
      doc
        .font('Helvetica-Bold')
        .text('Subtotal:', 380, yPosition)
        .text(formatCurrency(subtotal), 480, yPosition, { align: 'right' });

      yPosition += 20;

      // GST
      doc
        .font('Helvetica')
        .text('GST (5%):', 380, yPosition)
        .text(formatCurrency(booking.pricing.gst), 480, yPosition, { align: 'right' });

      yPosition += 25;

      // Total Line
      doc
        .strokeColor('#FF6B35')
        .lineWidth(2)
        .moveTo(50, yPosition)
        .lineTo(545, yPosition)
        .stroke();

      yPosition += 15;

      // Total Amount
      doc
        .rect(350, yPosition, 195, 35)
        .fillAndStroke('#FF6B35', '#FF6B35');

      doc
        .fontSize(14)
        .fillColor('#FFFFFF')
        .font('Helvetica-Bold')
        .text('TOTAL AMOUNT:', 360, yPosition + 10)
        .fontSize(16)
        .text(formatCurrency(booking.pricing.totalPrice), 480, yPosition + 10, { align: 'right' });

      yPosition += 50;

      // Payment Details
      doc
        .fontSize(12)
        .fillColor('#FF6B35')
        .font('Helvetica-Bold')
        .text('PAYMENT DETAILS:', 50, yPosition + 10);

      yPosition += 30;

      doc
        .fontSize(10)
        .fillColor('#333333')
        .font('Helvetica')
        .text(`Payment Method: ${booking.payment.method.toUpperCase()}`, 50, yPosition)
        .text(`Payment Status: PAID`, 50, yPosition + 15)
        .text(`Transaction ID: ${booking.payment.transactionId}`, 50, yPosition + 30)
        .text(`Paid On: ${formatDate(booking.payment.paidAt)} ${formatTime(booking.payment.paidAt)}`, 50, yPosition + 45);

      // Terms and Conditions
      yPosition += 80;
      
      if (yPosition > 650) {
        doc.addPage();
        yPosition = 50;
      }

      doc
        .fontSize(10)
        .fillColor('#FF6B35')
        .font('Helvetica-Bold')
        .text('Terms & Conditions:', 50, yPosition);

      doc
        .fontSize(9)
        .fillColor('#666666')
        .font('Helvetica')
        .text('• Security deposit is refundable upon returning the empty cylinder.', 50, yPosition + 20)
        .text('• Please keep this invoice for future reference.', 50, yPosition + 35)
        .text('• Delivery will be made during the selected time slot.', 50, yPosition + 50)
        .text('• In case of any issues, contact customer care within 24 hours.', 50, yPosition + 65);

      // Footer
      doc
        .fontSize(8)
        .fillColor('#999999')
        .text(
          'This is a computer-generated invoice and does not require a signature.',
          50,
          750,
          { align: 'center', width: 495 }
        )
        .text('Thank you for choosing our service!', 50, 765, { align: 'center', width: 495 });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Generate Payment Receipt PDF for Gas Agency Booking
 */
async function generateGasAgencyReceipt(booking) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const chunks = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      doc
        .fontSize(28)
        .fillColor('#4CAF50')
        .text('GAS AGENCY', 50, 50, { bold: true });

      doc
        .fontSize(10)
        .fillColor('#666666')
        .text('Fast & Safe LPG Delivery', 50, 85)
        .text('Customer Care: 1800-XXX-XXXX', 50, 100);

      // Receipt Title
      doc
        .fontSize(24)
        .fillColor('#4CAF50')
        .text('PAYMENT RECEIPT', 350, 50, { align: 'right' });

      // Success Icon (using text symbol)
      doc
        .fontSize(60)
        .fillColor('#4CAF50')
        .text('✓', 270, 150, { align: 'center' });

      // Payment Confirmed Text
      doc
        .fontSize(18)
        .fillColor('#333333')
        .font('Helvetica-Bold')
        .text('PAYMENT SUCCESSFUL', 50, 230, { align: 'center', width: 495 });

      // Horizontal Line
      doc
        .strokeColor('#4CAF50')
        .lineWidth(2)
        .moveTo(50, 270)
        .lineTo(545, 270)
        .stroke();

      // Receipt Details Box
      const boxTop = 290;
      doc
        .rect(50, boxTop, 495, 280)
        .stroke('#CCCCCC');

      let yPos = boxTop + 20;

      // Receipt Number
      doc
        .fontSize(12)
        .fillColor('#4CAF50')
        .font('Helvetica-Bold')
        .text('Receipt No:', 70, yPos)
        .fillColor('#333333')
        .font('Helvetica')
        .text(booking.bookingReference, 300, yPos);

      yPos += 25;

      // Transaction ID
      doc
        .fillColor('#4CAF50')
        .font('Helvetica-Bold')
        .text('Transaction ID:', 70, yPos)
        .fillColor('#333333')
        .font('Helvetica')
        .text(booking.payment.transactionId, 300, yPos);

      yPos += 25;

      // Payment Date
      doc
        .fillColor('#4CAF50')
        .font('Helvetica-Bold')
        .text('Payment Date:', 70, yPos)
        .fillColor('#333333')
        .font('Helvetica')
        .text(`${formatDate(booking.payment.paidAt)} ${formatTime(booking.payment.paidAt)}`, 300, yPos);

      yPos += 25;

      // Payment Method
      doc
        .fillColor('#4CAF50')
        .font('Helvetica-Bold')
        .text('Payment Method:', 70, yPos)
        .fillColor('#333333')
        .font('Helvetica')
        .text(booking.payment.method.toUpperCase(), 300, yPos);

      yPos += 35;

      // Separator Line
      doc
        .strokeColor('#EEEEEE')
        .lineWidth(1)
        .moveTo(70, yPos)
        .lineTo(525, yPos)
        .stroke();

      yPos += 20;

      // Customer Name
      doc
        .fillColor('#4CAF50')
        .font('Helvetica-Bold')
        .text('Customer Name:', 70, yPos)
        .fillColor('#333333')
        .font('Helvetica')
        .text(booking.customerDetails.name, 300, yPos);

      yPos += 25;

      // Email
      doc
        .fillColor('#4CAF50')
        .font('Helvetica-Bold')
        .text('Email:', 70, yPos)
        .fillColor('#333333')
        .font('Helvetica')
        .text(booking.customerDetails.email, 300, yPos);

      yPos += 25;

      // Phone
      doc
        .fillColor('#4CAF50')
        .font('Helvetica-Bold')
        .text('Phone:', 70, yPos)
        .fillColor('#333333')
        .font('Helvetica')
        .text(booking.customerDetails.phone, 300, yPos);

      yPos += 35;

      // Separator Line
      doc
        .strokeColor('#EEEEEE')
        .lineWidth(1)
        .moveTo(70, yPos)
        .lineTo(525, yPos)
        .stroke();

      yPos += 20;

      // Item Description
      doc
        .fillColor('#4CAF50')
        .font('Helvetica-Bold')
        .text('Item:', 70, yPos)
        .fillColor('#333333')
        .font('Helvetica')
        .text(booking.orderDetails.cylinderType, 300, yPos);

      yPos += 25;

      // Quantity
      doc
        .fillColor('#4CAF50')
        .font('Helvetica-Bold')
        .text('Quantity:', 70, yPos)
        .fillColor('#333333')
        .font('Helvetica')
        .text(booking.orderDetails.quantity.toString(), 300, yPos);

      // Amount Paid Box
      yPos += 50;
      doc
        .rect(70, yPos, 455, 50)
        .fillAndStroke('#4CAF50', '#4CAF50');

      doc
        .fontSize(14)
        .fillColor('#FFFFFF')
        .font('Helvetica-Bold')
        .text('AMOUNT PAID:', 90, yPos + 17)
        .fontSize(18)
        .text(formatCurrency(booking.pricing.totalPrice), 300, yPos + 15);

      // Order Summary
      yPos = 610;
      doc
        .fontSize(12)
        .fillColor('#4CAF50')
        .font('Helvetica-Bold')
        .text('ORDER SUMMARY:', 50, yPos);

      yPos += 30;

      doc
        .fontSize(10)
        .fillColor('#333333')
        .font('Helvetica')
        .text('Base Amount:', 70, yPos)
        .text(formatCurrency(booking.pricing.basePrice), 480, yPos, { align: 'right' });

      yPos += 20;

      if (booking.pricing.deposit > 0) {
        doc
          .text('Security Deposit:', 70, yPos)
          .text(formatCurrency(booking.pricing.deposit), 480, yPos, { align: 'right' });
        
        yPos += 20;
      }

      doc
        .text('Delivery Charges:', 70, yPos)
        .text(formatCurrency(booking.pricing.deliveryCharges), 480, yPos, { align: 'right' });

      yPos += 20;

      doc
        .text('GST (5%):', 70, yPos)
        .text(formatCurrency(booking.pricing.gst), 480, yPos, { align: 'right' });

      // Footer Note
      doc
        .fontSize(9)
        .fillColor('#999999')
        .text(
          'Please retain this receipt for your records. For any queries, contact customer support.',
          50,
          730,
          { align: 'center', width: 495 }
        )
        .text('Thank you for your payment!', 50, 750, { align: 'center', width: 495 });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

module.exports = {
  generateBookingInvoice,
  generateBookingReceipt,
  generateTripInvoice,
  generateTripReceipt,
  generateGasAgencyInvoice,
  generateGasAgencyReceipt,
};
