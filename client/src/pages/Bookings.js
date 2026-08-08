import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import jsPDF from 'jspdf';
import {
  FaHotel,
  FaUtensils,
  FaCar,
  FaMotorcycle,
  FaBus,
  FaTrain,
  FaPlane,
  FaShip,
  FaCalendar,
  FaRupeeSign,
  FaCheckCircle,
  FaTimesCircle,
  FaMapMarkerAlt,
  FaTicketAlt,
  FaTrash,
  FaTimes,
  FaUsers,
  FaEnvelope,
  FaPhone,
  FaStar,
  FaCreditCard,
  FaSuitcase,
  FaDownload,
  FaFileInvoice,
  FaGasPump,
  FaShoppingBag,
  FaHospital,
  FaPrescription,
  FaMusic,
  FaHeart,
} from 'react-icons/fa';
import { bookingAPI } from '../services/api';
import { Card, LoadingSpinner } from '../components/ui';

const Bookings = () => {
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [stats, setStats] = useState({});
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const bookingIcons = {
    hotel: FaHotel,
    resort: FaHotel,
    restaurant: FaUtensils,
    car: FaCar,
    bike: FaMotorcycle,
    bus: FaBus,
    train: FaTrain,
    flight: FaPlane,
    ship: FaShip,
    package: FaSuitcase,
    gas_station: FaGasPump,
    gas_agency: FaGasPump,
    shopping_mall: FaShoppingBag,
    hospital: FaHospital,
    pharmacy: FaPrescription,
    event: FaMusic,
    wellness: FaHeart,
  };

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    confirmed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    completed: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  };

  useEffect(() => {
    fetchBookings();
    fetchStats();

    // Refetch when user returns to this page
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchBookings();
        fetchStats();
      }
    };

    const handleFocus = () => {
      fetchBookings();
      fetchStats();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  useEffect(() => {
    filterBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookings, activeTab, selectedType]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      
      // Fetch from all sources in parallel
      const [regularBookings, gasAgencyBookings, shoppingMallBookings, hospitalBookings, pharmacyBookings, eventBookings, wellnessBookings, activityBookings] = await Promise.allSettled([
        bookingAPI.getBookings(),
        bookingAPI.getGasAgencyBookings(),
        bookingAPI.getShoppingMallBookings(),
        bookingAPI.getHospitalBookings(),
        bookingAPI.getPharmacyBookings(),
        bookingAPI.getEventBookings(),
        bookingAPI.getWellnessBookings(),
        bookingAPI.getActivityBookings(),
      ]);
      
      let allBookings = [];
      
      // Add regular bookings
      if (regularBookings.status === 'fulfilled' && regularBookings.value?.data?.success) {
        allBookings = [...regularBookings.value.data.data];
      }
      
      // Add and normalize gas agency bookings
      if (gasAgencyBookings.status === 'fulfilled' && gasAgencyBookings.value?.data?.success) {
        const gasBookings = gasAgencyBookings.value.data.bookings.map(booking => ({
          ...booking,
          bookingType: 'gas_agency',
          status: booking.bookingStatus,
          bookingDetails: {
            name: `${booking.providerDetails.providerName} - Gas Cylinder Booking`,
            location: {
              address: booking.deliveryAddress.fullAddress || 
                       `${booking.deliveryAddress.street}, ${booking.deliveryAddress.city}`
            }
          },
          bookingDate: booking.deliveryDate,
          bookingTime: booking.deliveryTimeSlot,
          pricing: {
            ...booking.pricing,
            totalPrice: booking.pricing.total,
            basePrice: booking.pricing.basePrice || 0,
            taxes: booking.pricing.gst || 0,
            serviceFee: booking.pricing.convenienceFee || 0,
          },
          gasAgencyDetails: {
            providerName: booking.providerDetails.providerName,
            cylinderType: booking.cylinderDetails.cylinderType,
            quantity: booking.cylinderDetails.quantity,
            totalPrice: booking.pricing.total,
          },
        }));
        allBookings = [...allBookings, ...gasBookings];
      }
      
      // Add and normalize shopping mall bookings
      if (shoppingMallBookings.status === 'fulfilled' && shoppingMallBookings.value?.data?.success) {
        const mallBookings = shoppingMallBookings.value.data.bookings.map(booking => ({
          ...booking,
          bookingType: 'shopping_mall',
          status: booking.bookingStatus,
          bookingDetails: {
            name: `${booking.mallDetails.name} - ${booking.bookingDetails.serviceName}`,
            location: {
              address: booking.mallDetails.address
            }
          },
          bookingDate: booking.bookingDetails.visitDate,
          bookingTime: booking.bookingDetails.visitTime,
          pricing: {
            ...booking.pricing,
            totalPrice: booking.pricing.total,
            basePrice: booking.pricing.basePrice || 0,
            taxes: booking.pricing.gst || 0,
            serviceFee: booking.pricing.convenienceFee || 0,
          },
          shoppingMallDetails: {
            mallName: booking.mallDetails.name,
            serviceName: booking.bookingDetails.serviceName,
            numberOfPeople: booking.bookingDetails.numberOfPeople,
            totalPrice: booking.pricing.total,
          },
        }));
        allBookings = [...allBookings, ...mallBookings];
      }
      
      // Add and normalize hospital bookings
      if (hospitalBookings.status === 'fulfilled' && hospitalBookings.value?.data?.success) {
        const hospBookings = hospitalBookings.value.data.bookings.map(booking => ({
          ...booking,
          bookingType: 'hospital',
          status: booking.bookingStatus,
          bookingDetails: {
            name: `${booking.hospitalDetails.name} - ${booking.appointmentDetails.serviceName}`,
            location: {
              address: booking.hospitalDetails.address
            }
          },
          bookingDate: booking.appointmentDetails.appointmentDate,
          bookingTime: booking.appointmentDetails.appointmentTime,
          pricing: {
            ...booking.pricing,
            totalPrice: booking.pricing.total,
            basePrice: booking.pricing.basePrice || 0,
            taxes: booking.pricing.gst || 0,
            serviceFee: booking.pricing.convenienceFee || 0,
          },
          hospitalDetails: {
            hospitalName: booking.hospitalDetails.name,
            serviceName: booking.appointmentDetails.serviceName,
            departmentName: booking.appointmentDetails.departmentName,
            patientName: booking.patientDetails.name,
            totalPrice: booking.pricing.total,
          },
        }));
        allBookings = [...allBookings, ...hospBookings];
      }
      
      // Add and normalize pharmacy bookings
      if (pharmacyBookings.status === 'fulfilled' && pharmacyBookings.value?.data?.success) {
        const pharmBookings = pharmacyBookings.value.data.bookings.map(booking => ({
          ...booking,
          bookingType: 'pharmacy',
          status: booking.bookingStatus,
          bookingDetails: {
            name: `${booking.pharmacyDetails.name} - ${booking.orderDetails.serviceName}`,
            location: {
              address: booking.pharmacyDetails.address
            }
          },
          bookingDate: booking.orderDetails.pickupDate,
          bookingTime: booking.orderDetails.pickupTime,
          pricing: {
            ...booking.pricing,
            totalPrice: booking.pricing.total,
            basePrice: booking.pricing.basePrice || 0,
            taxes: booking.pricing.gst || 0,
            serviceFee: booking.pricing.convenienceFee || 0,
          },
          pharmacyDetails: {
            pharmacyName: booking.pharmacyDetails.name,
            serviceName: booking.orderDetails.serviceName,
            itemDescription: booking.orderDetails.itemDescription,
            quantity: booking.orderDetails.quantity,
            totalPrice: booking.pricing.total,
          },
        }));
        allBookings = [...allBookings, ...pharmBookings];
      }
      
      // Add and normalize event bookings
      if (eventBookings.status === 'fulfilled' && eventBookings.value?.data?.success) {
        const evtBookings = eventBookings.value.data.bookings.map(booking => ({
          ...booking,
          bookingType: 'event',
          status: booking.bookingStatus,
          bookingDetails: {
            name: `${booking.venueDetails.name} - ${booking.eventDetails.eventName}`,
            location: {
              address: booking.venueDetails.address
            }
          },
          bookingDate: booking.eventDetails.eventDate,
          bookingTime: booking.eventDetails.eventTime,
          pricing: {
            ...booking.pricing,
            totalPrice: booking.pricing.total,
            basePrice: booking.pricing.ticketPrice || 0,
            taxes: booking.pricing.gst || 0,
            serviceFee: booking.pricing.convenienceFee || 0,
          },
          eventDetails: {
            venueName: booking.venueDetails.name,
            eventName: booking.eventDetails.eventName,
            eventType: booking.eventDetails.eventType,
            seatingCategory: booking.eventDetails.seatingCategory,
            numberOfTickets: booking.eventDetails.numberOfTickets,
            totalPrice: booking.pricing.total,
          },
        }));
        allBookings = [...allBookings, ...evtBookings];
      }

      // Add and normalize wellness bookings
      if (wellnessBookings.status === 'fulfilled' && wellnessBookings.value?.data?.success) {
        const welBookings = wellnessBookings.value.data.bookings.map(booking => ({
          ...booking,
          bookingType: 'wellness',
          status: booking.bookingStatus,
          bookingDetails: {
            name: `${booking.centerDetails.name} - ${booking.serviceDetails.serviceName}`,
            location: {
              address: booking.centerDetails.address
            }
          },
          bookingDate: booking.serviceDetails.appointmentDate,
          bookingTime: booking.serviceDetails.appointmentTime,
          pricing: {
            ...booking.pricing,
            totalPrice: booking.pricing.total,
            basePrice: booking.pricing.servicePrice || 0,
            taxes: booking.pricing.gst || 0,
            serviceFee: booking.pricing.convenienceFee || 0,
          },
          wellnessDetails: {
            centerName: booking.centerDetails.name,
            serviceName: booking.serviceDetails.serviceName,
            serviceType: booking.serviceDetails.serviceType,
            duration: booking.serviceDetails.duration,
            numberOfPeople: booking.serviceDetails.numberOfPeople,
            therapist: booking.serviceDetails.therapist,
            totalPrice: booking.pricing.total,
          },
        }));
        allBookings = [...allBookings, ...welBookings];
      }

      // Add and normalize activity bookings (Adventure, Theme Parks, Tours, Cruise, Boat Ride, Hostel, Resort, Homestay)
      if (activityBookings.status === 'fulfilled' && activityBookings.value?.data?.success) {
        const actBookings = activityBookings.value.data.bookings.map(booking => ({
          ...booking,
          bookingType: booking.activityType,
          status: booking.bookingStatus,
          bookingDetails: {
            name: `${booking.placeDetails.name} - ${booking.bookingDetails.activityName}`,
            location: {
              address: booking.placeDetails.address
            }
          },
          bookingDate: booking.bookingDetails.bookingDate,
          bookingTime: booking.bookingDetails.bookingTime,
          pricing: {
            ...booking.pricing,
            totalPrice: booking.pricing.total,
            taxes: booking.pricing.gst || 0,
            serviceFee: booking.pricing.convenienceFee || 0,
          },
          activityDetails: {
            placeName: booking.placeDetails.name,
            activityName: booking.bookingDetails.activityName,
            activityType: booking.activityType,
            numberOfPeople: booking.bookingDetails.numberOfPeople,
            duration: booking.bookingDetails.duration,
            checkInDate: booking.bookingDetails.checkInDate,
            checkOutDate: booking.bookingDetails.checkOutDate,
            totalPrice: booking.pricing.total,
          },
        }));
        allBookings = [...allBookings, ...actBookings];
      }
      
      // Sort by creation date (newest first)
      allBookings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      setBookings(allBookings);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast.error('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await bookingAPI.getBookingStats();
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const filterBookings = () => {
    let filtered = [...bookings];

    // Filter by tab (status-based)
    if (activeTab === 'upcoming') {
      filtered = filtered.filter(b => b.status === 'pending' || b.status === 'confirmed');
    } else if (activeTab === 'past') {
      filtered = filtered.filter(b => b.status === 'completed' || b.status === 'cancelled');
    }

    // Filter by type
    if (selectedType !== 'all') {
      filtered = filtered.filter(b => b.bookingType === selectedType);
    }

    setFilteredBookings(filtered);
  };

  const handleCancelBooking = async (bookingId, bookingType) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;

    try {
      let response;
      
      // Route to correct API based on booking type
      if (bookingType === 'gas_agency') {
        response = await bookingAPI.cancelGasAgencyBooking(bookingId);
      } else if (bookingType === 'shopping_mall') {
        response = await bookingAPI.cancelShoppingMallBooking(bookingId);
      } else if (bookingType === 'hospital') {
        response = await bookingAPI.cancelHospitalBooking(bookingId);
      } else if (bookingType === 'pharmacy') {
        response = await bookingAPI.cancelPharmacyBooking(bookingId);
      } else if (bookingType === 'event') {
        response = await bookingAPI.cancelEventBooking(bookingId);
      } else if (bookingType === 'wellness') {
        response = await bookingAPI.cancelWellnessBooking(bookingId);
      } else if (['adventure', 'theme_park', 'guided_tour', 'cruise', 'boat_ride', 'hostel', 'resort', 'homestay'].includes(bookingType)) {
        response = await bookingAPI.cancelActivityBooking(bookingId);
      } else {
        response = await bookingAPI.cancelBooking(bookingId, 'User requested cancellation');
      }
      
      if (response.data.success) {
        const refund = response.data.data?.refundAmount || response.data.booking?.pricing?.total || 0;
        if (refund > 0) {
          toast.success(`Booking cancelled. Refund: ₹${refund.toLocaleString()}`);
        } else {
          toast.success('Booking cancelled successfully');
        }
        fetchBookings();
        fetchStats();
      }
    } catch (error) {
      console.error('Error cancelling booking:', error);
      toast.error(error.response?.data?.message || 'Failed to cancel booking');
    }
  };

  const handleDeleteBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to delete this booking?')) return;

    try {
      const response = await bookingAPI.deleteBooking(bookingId);
      if (response.data.success) {
        toast.success('Booking deleted successfully');
        fetchBookings();
        fetchStats();
      }
    } catch (error) {
      console.error('Error deleting booking:', error);
      toast.error(error.response?.data?.message || 'Failed to delete booking');
    }
  };

  const handleMarkAsCompleted = async (bookingId) => {
    if (!window.confirm('Mark this booking as completed?')) return;

    try {
      const response = await bookingAPI.updateBookingStatus(bookingId, 'completed');
      if (response.data.success) {
        toast.success('Booking marked as completed!');
        fetchBookings();
        fetchStats();
      }
    } catch (error) {
      console.error('Error updating booking:', error);
      toast.error(error.response?.data?.message || 'Failed to update booking');
    }
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

  const renderOrderedItemsTable = (booking) => {
    const orderedItems = getOrderedItems(booking);

    if (!orderedItems.length) {
      return null;
    }

    const totalItems = booking?.restaurantDetails?.totalItems ?? booking?.bookingDetails?.totalItems ?? booking?.orderDetails?.totalItems ?? orderedItems.length;

    return (
      <div className="mt-2 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
        <div className="text-xs font-semibold text-orange-800 dark:text-orange-200 mb-2 flex items-center gap-1">
          <FaUtensils className="inline" />
          Ordered Items ({totalItems})
        </div>
        <div className="overflow-hidden rounded-lg border border-orange-200 dark:border-orange-700">
          <div className="grid grid-cols-[2fr_0.7fr_0.9fr_0.9fr] gap-0 bg-orange-100 dark:bg-orange-900/40 text-[11px] font-semibold text-orange-900 dark:text-orange-100">
            <div className="px-3 py-2">Item</div>
            <div className="px-3 py-2 text-right">Qty</div>
            <div className="px-3 py-2 text-right">Unit Price</div>
            <div className="px-3 py-2 text-right">Total</div>
          </div>
          <div className="divide-y divide-orange-200 dark:divide-orange-700">
            {orderedItems.map((item, idx) => {
              const itemName = item?.itemName || item?.name || item?.title || (typeof item === 'string' ? item : 'Item');
              const quantity = Number(item?.quantity ?? item?.qty ?? 1);
              const unitPrice = Number(item?.price ?? item?.unitPrice ?? 0);
              const lineTotal = Number.isFinite(unitPrice * quantity) ? unitPrice * quantity : 0;

              return (
                <div key={idx} className="grid grid-cols-[2fr_0.7fr_0.9fr_0.9fr] text-[11px] text-orange-800 dark:text-orange-200">
                  <div className="px-3 py-2 font-medium">{itemName}</div>
                  <div className="px-3 py-2 text-right">{quantity}</div>
                  <div className="px-3 py-2 text-right">₹{unitPrice.toLocaleString()}</div>
                  <div className="px-3 py-2 text-right font-semibold">₹{lineTotal.toLocaleString()}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const handleResendEmail = async (bookingId /*, bookingType - kept for compatibility */) => {
    try {
      const response = await bookingAPI.resendBookingEmail(bookingId);

      if (response.data.success && response.data.emailSent) {
        toast.success('Confirmation email sent successfully!');
        fetchBookings();
      } else {
        toast.error(response.data.message || 'Failed to send confirmation email');
      }
    } catch (error) {
      console.error('Error resending email:', error);
      toast.error(error.response?.data?.message || 'Failed to send email');
    }
  };

  const generatePaymentReceipt = (booking) => {
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    
    // Header - Company Info
    pdf.setFillColor(37, 99, 235); // Blue
    pdf.rect(0, 0, pageWidth, 40, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(24);
    pdf.setFont(undefined, 'bold');
    pdf.text('AI Trip Planner', pageWidth / 2, 20, { align: 'center' });
    pdf.setFontSize(12);
    pdf.setFont(undefined, 'normal');
    pdf.text('PAYMENT RECEIPT', pageWidth / 2, 30, { align: 'center' });

    // Receipt Info
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(10);
    let yPos = 55;
    
    pdf.setFont(undefined, 'bold');
    pdf.text('Payment Receipt', 20, yPos);
    pdf.setFont(undefined, 'normal');
    yPos += 7;
    
    pdf.text(`Receipt No: ${booking.bookingReference}`, 20, yPos);
    pdf.text(`Date: ${new Date(booking.paymentDetails?.paidAt || booking.createdAt).toLocaleDateString('en-IN')}`, 120, yPos);
    yPos += 10;

    // Customer Details
    pdf.setFont(undefined, 'bold');
    pdf.setFillColor(240, 240, 240);
    pdf.rect(15, yPos, pageWidth - 30, 8, 'F');
    pdf.text('Customer Details', 20, yPos + 5);
    yPos += 13;
    
    pdf.setFont(undefined, 'normal');
    pdf.text(`Name: ${booking.customerDetails?.name || 'N/A'}`, 20, yPos);
    yPos += 6;
    pdf.text(`Email: ${booking.customerDetails?.email || 'N/A'}`, 20, yPos);
    yPos += 6;
    pdf.text(`Phone: ${booking.customerDetails?.phone || 'N/A'}`, 20, yPos);
    yPos += 12;

    // Booking Details
    pdf.setFont(undefined, 'bold');
    pdf.setFillColor(240, 240, 240);
    pdf.rect(15, yPos, pageWidth - 30, 8, 'F');
    pdf.text('Booking Details', 20, yPos + 5);
    yPos += 13;
    
    pdf.setFont(undefined, 'normal');
    pdf.text(`Type: ${booking.bookingType.charAt(0).toUpperCase() + booking.bookingType.slice(1)}`, 20, yPos);
    yPos += 6;
    pdf.text(`Location: ${booking.location?.name || 'N/A'}`, 20, yPos);
    yPos += 6;
    
    const checkInDate = booking.checkInDate || booking.departureDate || booking.date;
    const checkOutDate = booking.checkOutDate || booking.returnDate;
    
    if (checkInDate) {
      pdf.text(`Date: ${new Date(checkInDate).toLocaleDateString('en-IN')}`, 20, yPos);
      if (checkOutDate) {
        pdf.text(` - ${new Date(checkOutDate).toLocaleDateString('en-IN')}`, 45, yPos);
      }
      yPos += 6;
    }
    
    if (booking.numberOfGuests) {
      pdf.text(`Guests: ${booking.numberOfGuests}`, 20, yPos);
      yPos += 6;
    }
    yPos += 6;

    // Payment Details
    pdf.setFont(undefined, 'bold');
    pdf.setFillColor(240, 240, 240);
    pdf.rect(15, yPos, pageWidth - 30, 8, 'F');
    pdf.text('Payment Details', 20, yPos + 5);
    yPos += 13;
    
    pdf.setFont(undefined, 'normal');
    pdf.text(`Payment Method: ${booking.paymentMethod?.toUpperCase() || 'N/A'}`, 20, yPos);
    yPos += 6;
    
    if (booking.paymentDetails?.gateway) {
      pdf.text(`Gateway: ${booking.paymentDetails.gateway.toUpperCase()}`, 20, yPos);
      yPos += 6;
    }
    
    if (booking.paymentDetails?.orderId) {
      pdf.text(`Order ID: ${booking.paymentDetails.orderId}`, 20, yPos);
      yPos += 6;
    }
    
    if (booking.paymentDetails?.paymentId) {
      pdf.text(`Payment ID: ${booking.paymentDetails.paymentId}`, 20, yPos);
      yPos += 6;
    }
    
    pdf.setFont(undefined, 'bold');
    pdf.setTextColor(22, 163, 74); // Green
    pdf.text(`Status: ${booking.paymentStatus?.toUpperCase() || 'PENDING'}`, 20, yPos);
    pdf.setTextColor(0, 0, 0);
    yPos += 12;

    // Amount Details
    pdf.setFont(undefined, 'bold');
    pdf.setFillColor(240, 240, 240);
    pdf.rect(15, yPos, pageWidth - 30, 8, 'F');
    pdf.text('Amount Details', 20, yPos + 5);
    yPos += 13;
    
    pdf.setFont(undefined, 'normal');
    const basePrice = booking.pricing?.basePrice || booking.totalPrice || 0;
    const taxes = booking.pricing?.taxes || 0;
    const serviceFee = booking.pricing?.serviceFee || 0;
    const totalPrice = booking.pricing?.totalPrice || booking.totalPrice || 0;
    
    pdf.text('Base Price:', 20, yPos);
    pdf.text(`₹${basePrice.toLocaleString('en-IN')}`, 150, yPos, { align: 'right' });
    yPos += 6;
    
    pdf.text('Taxes (18%):', 20, yPos);
    pdf.text(`₹${taxes.toLocaleString('en-IN')}`, 150, yPos, { align: 'right' });
    yPos += 6;
    
    pdf.text('Service Fee:', 20, yPos);
    pdf.text(`₹${serviceFee.toLocaleString('en-IN')}`, 150, yPos, { align: 'right' });
    yPos += 8;
    
    // Total
    pdf.setFont(undefined, 'bold');
    pdf.setFontSize(14);
    pdf.setFillColor(37, 99, 235);
    pdf.rect(15, yPos - 2, pageWidth - 30, 10, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.text('TOTAL PAID:', 20, yPos + 5);
    pdf.text(`₹${totalPrice.toLocaleString('en-IN')}`, 150, yPos + 5, { align: 'right' });
    pdf.setTextColor(0, 0, 0);
    
    // Footer
    yPos += 20;
    pdf.setFontSize(9);
    pdf.setFont(undefined, 'italic');
    pdf.setTextColor(100, 100, 100);
    pdf.text('This is a computer-generated receipt and does not require a signature.', pageWidth / 2, yPos, { align: 'center' });
    pdf.text('Thank you for choosing AI Trip Planner!', pageWidth / 2, yPos + 5, { align: 'center' });
    
    // Save PDF
    pdf.save(`Payment-Receipt-${booking.bookingReference}.pdf`);
    toast.success('Payment receipt downloaded successfully!');
  };

  const generateInvoice = (booking) => {
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    
    // Header - Company Info
    pdf.setFillColor(79, 70, 229); // Indigo
    pdf.rect(0, 0, pageWidth, 45, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(26);
    pdf.setFont(undefined, 'bold');
    pdf.text('AI Trip Planner', pageWidth / 2, 18, { align: 'center' });
    pdf.setFontSize(11);
    pdf.setFont(undefined, 'normal');
    pdf.text('Travel Booking & Planning Services', pageWidth / 2, 26, { align: 'center' });
    pdf.setFontSize(10);
    pdf.text('Email: support@aitripplanner.com | Phone: +91-1800-123-4567', pageWidth / 2, 33, { align: 'center' });
    pdf.setFontSize(14);
    pdf.setFont(undefined, 'bold');
    pdf.text('INVOICE', pageWidth / 2, 41, { align: 'center' });

    // Invoice Info
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(10);
    let yPos = 60;
    
    pdf.setFont(undefined, 'bold');
    pdf.text('Tax Invoice', 20, yPos);
    pdf.setFont(undefined, 'normal');
    yPos += 7;
    
    pdf.text(`Invoice No: INV-${booking.bookingReference}`, 20, yPos);
    pdf.text(`Date: ${new Date(booking.createdAt).toLocaleDateString('en-IN')}`, 120, yPos);
    yPos += 5;
    pdf.text(`Booking ID: ${booking.bookingReference}`, 20, yPos);
    pdf.text(`Status: ${booking.status.toUpperCase()}`, 120, yPos);
    yPos += 12;

    // Bill To
    pdf.setFont(undefined, 'bold');
    pdf.setFillColor(240, 240, 240);
    pdf.rect(15, yPos, 85, 8, 'F');
    pdf.text('Bill To:', 20, yPos + 5);
    yPos += 13;
    
    pdf.setFont(undefined, 'normal');
    pdf.text(booking.customerDetails?.name || 'N/A', 20, yPos);
    yPos += 5;
    pdf.text(booking.customerDetails?.email || '', 20, yPos);
    yPos += 5;
    pdf.text(booking.customerDetails?.phone || '', 20, yPos);
    yPos += 12;

    // Service Details Header
    pdf.setFont(undefined, 'bold');
    pdf.setFillColor(79, 70, 229);
    pdf.rect(15, yPos, pageWidth - 30, 10, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.text('Description', 20, yPos + 7);
    pdf.text('Quantity', 110, yPos + 7);
    pdf.text('Rate', 140, yPos + 7);
    pdf.text('Amount', 165, yPos + 7, { align: 'right' });
    yPos += 15;
    
    // Service Items
    pdf.setTextColor(0, 0, 0);
    pdf.setFont(undefined, 'normal');
    
    const serviceDesc = `${booking.bookingType.charAt(0).toUpperCase() + booking.bookingType.slice(1)} Booking`;
    pdf.text(serviceDesc, 20, yPos);
    
    const checkInDate = booking.checkInDate || booking.departureDate || booking.date;
    const checkOutDate = booking.checkOutDate || booking.returnDate;
    if (checkInDate) {
      yPos += 5;
      pdf.setFontSize(9);
      pdf.setTextColor(100, 100, 100);
      pdf.text(`${new Date(checkInDate).toLocaleDateString('en-IN')}${checkOutDate ? ' - ' + new Date(checkOutDate).toLocaleDateString('en-IN') : ''}`, 20, yPos);
      pdf.setFontSize(10);
      pdf.setTextColor(0, 0, 0);
    }
    
    yPos += 5;
    if (booking.location?.name) {
      pdf.setFontSize(9);
      pdf.setTextColor(100, 100, 100);
      pdf.text(booking.location.name, 20, yPos);
      pdf.setFontSize(10);
      pdf.setTextColor(0, 0, 0);
    }
    
    yPos -= 5;
    const quantity = booking.numberOfGuests || booking.roomDetails?.numberOfRooms || 1;
    const itemBasePrice = booking.pricing?.basePrice || booking.totalPrice || 0;
    pdf.text(`${quantity}`, 110, yPos);
    pdf.text(`₹${(itemBasePrice / quantity).toLocaleString('en-IN')}`, 140, yPos);
    pdf.text(`₹${itemBasePrice.toLocaleString('en-IN')}`, 165, yPos, { align: 'right' });
    yPos += 15;

    // Additional Details (if any)
    if (booking.roomDetails?.roomType) {
      pdf.setFontSize(9);
      pdf.setTextColor(100, 100, 100);
      pdf.text(`Room Type: ${booking.roomDetails.roomType}`, 20, yPos);
      yPos += 5;
    }
    
    if (booking.transportDetails?.transportType) {
      pdf.setFontSize(9);
      pdf.setTextColor(100, 100, 100);
      pdf.text(`Transport: ${booking.transportDetails.transportType}`, 20, yPos);
      yPos += 5;
    }
    
    yPos += 5;
    pdf.setFontSize(10);
    pdf.setTextColor(0, 0, 0);

    // Subtotal and Tax Breakdown
    pdf.setDrawColor(200, 200, 200);
    pdf.line(15, yPos, pageWidth - 15, yPos);
    yPos += 8;
    
    const invBasePrice = booking.pricing?.basePrice || booking.totalPrice || 0;
    const invTaxes = booking.pricing?.taxes || 0;
    const invServiceFee = booking.pricing?.serviceFee || 0;
    const invTotalPrice = booking.pricing?.totalPrice || booking.totalPrice || 0;
    
    pdf.setFont(undefined, 'normal');
    pdf.text('Subtotal:', 110, yPos);
    pdf.text(`₹${invBasePrice.toLocaleString('en-IN')}`, 165, yPos, { align: 'right' });
    yPos += 7;
    
    pdf.text('GST (18%):', 110, yPos);
    pdf.text(`₹${invTaxes.toLocaleString('en-IN')}`, 165, yPos, { align: 'right' });
    yPos += 7;
    
    pdf.text('Service Fee (5%):', 110, yPos);
    pdf.text(`₹${invServiceFee.toLocaleString('en-IN')}`, 165, yPos, { align: 'right' });
    yPos += 10;
    
    // Grand Total
    pdf.setFont(undefined, 'bold');
    pdf.setFillColor(79, 70, 229);
    pdf.rect(105, yPos - 3, pageWidth - 120, 10, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(12);
    pdf.text('GRAND TOTAL:', 110, yPos + 4);
    pdf.text(`₹${invTotalPrice.toLocaleString('en-IN')}`, 165, yPos + 4, { align: 'right' });
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(10);
    yPos += 18;

    // Payment Status
    pdf.setFont(undefined, 'bold');
    const paymentStatus = booking.paymentStatus || 'pending';
    const statusColor = paymentStatus === 'paid' ? [22, 163, 74] : [234, 179, 8];
    pdf.setTextColor(...statusColor);
    pdf.text(`Payment Status: ${paymentStatus.toUpperCase()}`, 20, yPos);
    pdf.setTextColor(0, 0, 0);
    yPos += 10;

    // Terms & Conditions
    pdf.setFont(undefined, 'bold');
    pdf.text('Terms & Conditions:', 20, yPos);
    yPos += 6;
    pdf.setFont(undefined, 'normal');
    pdf.setFontSize(8);
    pdf.text('1. Cancellation charges apply as per booking policy.', 20, yPos);
    yPos += 4;
    pdf.text('2. Prices are inclusive of all applicable taxes.', 20, yPos);
    yPos += 4;
    pdf.text('3. This invoice is subject to realization of payment.', 20, yPos);
    yPos += 10;

    // Footer
    pdf.setFontSize(9);
    pdf.setFont(undefined, 'italic');
    pdf.setTextColor(100, 100, 100);
    pdf.text('This is a computer-generated invoice and does not require a signature.', pageWidth / 2, yPos, { align: 'center' });
    yPos += 4;
    pdf.text('For any queries, please contact support@aitripplanner.com', pageWidth / 2, yPos, { align: 'center' });
    
    // Save PDF
    pdf.save(`Invoice-${booking.bookingReference}.pdf`);
    toast.success('Invoice downloaded successfully!');
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
            My Bookings
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage all your travel bookings in one place
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Bookings</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              {stats.totalBookings || 0}
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">Upcoming</div>
            <div className="text-2xl font-bold text-blue-600 mt-1">
              {stats.upcomingBookings || 0}
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">Completed</div>
            <div className="text-2xl font-bold text-green-600 mt-1">
              {stats.completedBookings || 0}
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Spent</div>
            <div className="text-2xl font-bold text-purple-600 mt-1">
              <FaRupeeSign className="inline text-lg" />
              {(stats.totalSpent || 0).toLocaleString()}
            </div>
          </Card>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {['all', 'upcoming', 'past'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2 rounded-lg font-semibold whitespace-nowrap transition-colors ${
                activeTab === tab
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Type Filter */}
        <div className="mb-6">
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Types</option>
            <option value="hotel">Hotels</option>
            <option value="resort">Resorts</option>
            <option value="restaurant">Restaurants</option>
            <option value="car">Car Rentals</option>
            <option value="bike">Bike Rentals</option>
            <option value="bus">Bus</option>
            <option value="train">Train</option>
            <option value="flight">Flights</option>
            <option value="ship">Ships</option>
            <option value="package">Trip Packages</option>
            <option value="gas_station">Gas Stations</option>
          </select>
        </div>

        {/* Bookings List */}
        {filteredBookings.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-gray-500 dark:text-gray-400 text-lg">
              No bookings found
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredBookings.map((booking) => {
              const Icon = bookingIcons[booking.bookingType] || FaHotel;
              return (
                <motion.div
                  key={booking._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card 
                    className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => {
                      setSelectedBooking(booking);
                      setShowDetailsModal(true);
                    }}
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg text-white">
                          <Icon className="text-2xl" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                              {booking.bookingDetails.name}
                            </h3>
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                statusColors[booking.status]
                              }`}
                            >
                              {booking.status}
                            </span>
                          </div>
                          <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                            <div className="flex items-center gap-2">
                              <FaTicketAlt className="text-blue-500" />
                              <span className="font-mono">{booking.bookingReference}</span>
                            </div>
                            {(booking.bookingDetails.location?.address || (booking.bookingType === 'gas_station' && booking.gasStationDetails?.stationAddress)) && (
                              <div className="flex items-center gap-2">
                                <FaMapMarkerAlt className="text-red-500" />
                                <span>
                                  {booking.bookingType === 'gas_station' 
                                    ? (booking.gasStationDetails?.stationAddress || booking.bookingDetails.location?.address)
                                    : booking.bookingDetails.location.address
                                  }
                                </span>
                              </div>
                            )}
                            <div className="flex items-center gap-2">
                              <FaCalendar className="text-green-500" />
                              <span>
                                {booking.checkInDate && `${formatDate(booking.checkInDate)} - ${formatDate(booking.checkOutDate)}`}
                                {booking.departureDate && !booking.returnDate && formatDate(booking.departureDate)}
                                {booking.departureDate && booking.returnDate && `${formatDate(booking.departureDate)} - ${formatDate(booking.returnDate)}`}
                                {booking.bookingDate && `${formatDate(booking.bookingDate)} at ${booking.bookingTime}`}
                                {booking.bookingType === 'gas_station' && booking.gasStationDetails?.fillDateTime && formatDate(booking.gasStationDetails.fillDateTime)}
                              </span>
                            </div>
                            {(['hotel', 'resort'].includes(booking.bookingType)) && booking.roomDetails && (
                              <div className="mt-2 p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                                <div className="text-xs font-semibold text-purple-800 dark:text-purple-200 mb-1">
                                  <FaHotel className="inline mr-1" />
                                  Room: {booking.roomDetails.roomType} × {booking.roomDetails.numberOfRooms}
                                </div>
                                {booking.roomDetails.pricePerNight && (
                                  <div className="text-xs text-purple-700 dark:text-purple-300">
                                    ₹{booking.roomDetails.pricePerNight}/night
                                  </div>
                                )}
                                {booking.roomDetails.amenities?.length > 0 && (
                                  <div className="text-xs text-purple-700 dark:text-purple-300 mt-1">
                                    <span className="font-semibold">Amenities:</span> {booking.roomDetails.amenities.join(', ')}
                                  </div>
                                )}
                              </div>
                            )}
                            {(['car', 'bike', 'bus', 'train', 'flight', 'ship'].includes(booking.bookingType)) && booking.transportDetails && (
                              <div className="mt-2 p-2 bg-teal-50 dark:bg-teal-900/20 rounded-lg">
                                <div className="text-xs font-semibold text-teal-800 dark:text-teal-200 mb-1">
                                  {booking.bookingType === 'car' && <FaCar className="inline mr-1" />}
                                  {booking.bookingType === 'bike' && <FaMotorcycle className="inline mr-1" />}
                                  {booking.bookingType === 'bus' && <FaBus className="inline mr-1" />}
                                  {booking.bookingType === 'train' && <FaTrain className="inline mr-1" />}
                                  {booking.bookingType === 'flight' && <FaPlane className="inline mr-1" />}
                                  {booking.bookingType === 'ship' && <FaShip className="inline mr-1" />}
                                  {booking.transportDetails.vehicleType}
                                  {(['bus', 'train', 'flight', 'ship'].includes(booking.bookingType)) && (
                                    <span className="ml-2 px-2 py-0.5 bg-teal-200 dark:bg-teal-700 rounded-full text-xs">
                                      {booking.returnDate ? 'Round Trip' : 'One Way'}
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs text-teal-700 dark:text-teal-300">
                                  Route: {booking.transportDetails.from?.location} → {booking.transportDetails.to?.location}
                                </div>
                                {booking.transportDetails.pricePerUnit && (
                                  <div className="text-xs text-teal-700 dark:text-teal-300 mt-1">
                                    ₹{booking.transportDetails.pricePerUnit}/{['car', 'bike'].includes(booking.bookingType) ? 'day' : 'ticket'}
                                    {(['bus', 'train', 'flight', 'ship'].includes(booking.bookingType)) && booking.returnDate && ' × 2 (round trip)'}
                                  </div>
                                )}
                                {booking.transportDetails.features?.length > 0 && (
                                  <div className="text-xs text-teal-700 dark:text-teal-300 mt-1">
                                    <span className="font-semibold">Features:</span> {booking.transportDetails.features.join(', ')}
                                  </div>
                                )}
                              </div>
                            )}
                            {(booking.bookingType === 'restaurant' || booking.bookingType === 'cafe') && renderOrderedItemsTable(booking)}
                            {booking.bookingType === 'gas_station' && booking.gasStationDetails && (
                              <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                <div className="text-xs font-semibold text-green-800 dark:text-green-200 mb-1">
                                  <FaGasPump className="inline mr-1" />
                                  Fuel Booking
                                </div>
                                <div className="text-xs text-green-700 dark:text-green-300 space-y-0.5">
                                  <div>
                                    <span className="font-semibold uppercase">{booking.gasStationDetails.fuelType}</span> - {booking.gasStationDetails.quantity}L @ ₹{booking.gasStationDetails.pricePerUnit}/L
                                  </div>
                                  <div>Vehicle: <span className="font-semibold uppercase">{booking.gasStationDetails.vehicleNumber}</span></div>
                                  {booking.gasStationDetails.vehicleModel && (
                                    <div>Model: {booking.gasStationDetails.vehicleModel}</div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                          <FaRupeeSign className="inline text-lg" />
                          {booking.pricing.totalPrice.toLocaleString()}
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          {booking.status === 'pending' || booking.status === 'confirmed' ? (
                            <>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMarkAsCompleted(booking._id);
                                }}
                                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-semibold flex items-center gap-2"
                              >
                                <FaCheckCircle />
                                Complete
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleResendEmail(booking._id);
                                }}
                                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-semibold flex items-center gap-2"
                              >
                                <FaEnvelope />
                                Resend Email
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCancelBooking(booking._id, booking.bookingType);
                                }}
                                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-semibold flex items-center gap-2"
                              >
                                <FaTimesCircle />
                                Cancel
                              </button>
                            </>
                          ) : booking.status === 'cancelled' ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteBooking(booking._id);
                              }}
                              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm font-semibold flex items-center gap-2"
                            >
                              <FaTrash />
                              Delete
                            </button>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Booking Details Modal */}
        <AnimatePresence mode="wait">
          {showDetailsModal && selectedBooking && (
            <motion.div
              key="booking-details-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
              onClick={() => setShowDetailsModal(false)}
            >
              <motion.div
                key="booking-details-content"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col"
                onClick={(e) => e.stopPropagation()}
              >
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {React.createElement(bookingIcons[selectedBooking.bookingType] || FaHotel, { className: 'text-3xl text-white' })}
                  <div>
                    <h2 className="text-2xl font-bold text-white">{selectedBooking.bookingDetails.name}</h2>
                    <p className="text-blue-100 text-sm">Booking Reference: {selectedBooking.bookingReference}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
                >
                  <FaTimes className="text-xl" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto flex-1">
                <div className="space-y-6">
                  {/* Status Badge */}
                  <div className="flex items-center justify-between">
                    <span className={`px-4 py-2 rounded-full text-sm font-semibold ${statusColors[selectedBooking.status]}`}>
                      {selectedBooking.status.toUpperCase()}
                    </span>
                    <div className="text-3xl font-bold text-gray-900 dark:text-white">
                      <FaRupeeSign className="inline text-2xl" />
                      {selectedBooking.pricing.totalPrice.toLocaleString()}
                    </div>
                  </div>

                  {/* Booking Information */}
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg space-y-3">
                    <h3 className="font-semibold text-gray-900 dark:text-white text-lg mb-3">Booking Information</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="flex items-start gap-3">
                        <FaMapMarkerAlt className="text-red-500 mt-1" />
                        <div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">Location</div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {selectedBooking.bookingType === 'gas_station' 
                              ? (selectedBooking.gasStationDetails?.stationAddress || selectedBooking.bookingDetails.location?.address || 'N/A')
                              : (selectedBooking.bookingDetails.location?.address || 'N/A')
                            }
                          </div>
                          {selectedBooking.bookingDetails.location?.city && (
                            <div className="text-xs text-gray-600 dark:text-gray-400">
                              {selectedBooking.bookingDetails.location?.city}, {selectedBooking.bookingDetails.location?.country}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <FaCalendar className="text-green-500 mt-1" />
                        <div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">Date</div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {selectedBooking.checkInDate && `${formatDate(selectedBooking.checkInDate)} - ${formatDate(selectedBooking.checkOutDate)}`}
                            {selectedBooking.departureDate && !selectedBooking.returnDate && formatDate(selectedBooking.departureDate)}
                            {selectedBooking.departureDate && selectedBooking.returnDate && `${formatDate(selectedBooking.departureDate)} - ${formatDate(selectedBooking.returnDate)}`}
                            {selectedBooking.bookingDate && `${formatDate(selectedBooking.bookingDate)} at ${selectedBooking.bookingTime}`}
                            {selectedBooking.bookingType === 'gas_station' && selectedBooking.gasStationDetails?.fillDateTime && formatDate(selectedBooking.gasStationDetails.fillDateTime)}
                          </div>
                        </div>
                      </div>

                      {selectedBooking.bookingDetails.rating > 0 && (
                        <div className="flex items-start gap-3">
                          <FaStar className="text-yellow-500 mt-1" />
                          <div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">Rating</div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {selectedBooking.bookingDetails.rating} / 5
                            </div>
                          </div>
                        </div>
                      )}

                      {selectedBooking.guestDetails && (
                        <div className="flex items-start gap-3">
                          <FaUsers className="text-blue-500 mt-1" />
                          <div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">Guests</div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {selectedBooking.guestDetails.adults} Adults, {selectedBooking.guestDetails.children} Children, {selectedBooking.guestDetails.infants} Infants
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {selectedBooking.bookingDetails.contactInfo?.phone && (
                      <div className="flex items-start gap-3 pt-2 border-t border-gray-200 dark:border-gray-600">
                        <FaPhone className="text-green-500 mt-1" />
                        <div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">Contact</div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {selectedBooking.bookingDetails.contactInfo.phone}
                          </div>
                          {selectedBooking.bookingDetails.contactInfo.email && (
                            <div className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1">
                              <FaEnvelope className="text-xs" />
                              {selectedBooking.bookingDetails.contactInfo.email}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Room Details (Hotels/Resorts) */}
                  {(['hotel', 'resort'].includes(selectedBooking.bookingType)) && selectedBooking.roomDetails && (
                    <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                      <h3 className="font-semibold text-purple-900 dark:text-purple-100 text-lg mb-3 flex items-center gap-2">
                        <FaHotel />
                        Room Details
                      </h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-purple-700 dark:text-purple-300">Room Type:</span>
                          <span className="text-sm font-semibold text-purple-900 dark:text-purple-100">{selectedBooking.roomDetails.roomType}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-purple-700 dark:text-purple-300">Number of Rooms:</span>
                          <span className="text-sm font-semibold text-purple-900 dark:text-purple-100">{selectedBooking.roomDetails.numberOfRooms}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-purple-700 dark:text-purple-300">Price per Night:</span>
                          <span className="text-sm font-semibold text-purple-900 dark:text-purple-100">₹{selectedBooking.roomDetails.pricePerNight?.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-purple-700 dark:text-purple-300">Capacity:</span>
                          <span className="text-sm font-semibold text-purple-900 dark:text-purple-100">{selectedBooking.roomDetails.capacity} persons</span>
                        </div>
                        {selectedBooking.roomDetails.amenities?.length > 0 && (
                          <div className="pt-2 border-t border-purple-200 dark:border-purple-700">
                            <div className="text-sm text-purple-700 dark:text-purple-300 mb-2">Amenities:</div>
                            <div className="flex flex-wrap gap-2">
                              {selectedBooking.roomDetails.amenities.map((amenity, idx) => (
                                <span key={idx} className="px-2 py-1 bg-purple-200 dark:bg-purple-800 text-purple-800 dark:text-purple-200 rounded-full text-xs font-medium">
                                  {amenity}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Transport Details */}
                  {(['car', 'bike', 'bus', 'train', 'flight', 'ship'].includes(selectedBooking.bookingType)) && selectedBooking.transportDetails && (
                    <div className="bg-teal-50 dark:bg-teal-900/20 p-4 rounded-lg">
                      <h3 className="font-semibold text-teal-900 dark:text-teal-100 text-lg mb-3 flex items-center gap-2">
                        {selectedBooking.bookingType === 'car' && <FaCar />}
                        {selectedBooking.bookingType === 'bike' && <FaMotorcycle />}
                        {selectedBooking.bookingType === 'bus' && <FaBus />}
                        {selectedBooking.bookingType === 'train' && <FaTrain />}
                        {selectedBooking.bookingType === 'flight' && <FaPlane />}
                        {selectedBooking.bookingType === 'ship' && <FaShip />}
                        Transport Details
                      </h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-teal-700 dark:text-teal-300">Vehicle Type:</span>
                          <span className="text-sm font-semibold text-teal-900 dark:text-teal-100">{selectedBooking.transportDetails.vehicleType}</span>
                        </div>
                        {(['bus', 'train', 'flight', 'ship'].includes(selectedBooking.bookingType)) && (
                          <div className="flex justify-between">
                            <span className="text-sm text-teal-700 dark:text-teal-300">Trip Type:</span>
                            <span className="px-2 py-1 bg-teal-200 dark:bg-teal-700 text-teal-900 dark:text-teal-100 rounded-full text-xs font-semibold">
                              {selectedBooking.returnDate ? 'Round Trip' : 'One Way'}
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-sm text-teal-700 dark:text-teal-300">Route:</span>
                          <span className="text-sm font-semibold text-teal-900 dark:text-teal-100">
                            {selectedBooking.transportDetails.from?.location} → {selectedBooking.transportDetails.to?.location}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-teal-700 dark:text-teal-300">Price per Unit:</span>
                          <span className="text-sm font-semibold text-teal-900 dark:text-teal-100">
                            ₹{selectedBooking.transportDetails.pricePerUnit?.toLocaleString()}/{['car', 'bike'].includes(selectedBooking.bookingType) ? 'day' : 'ticket'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-teal-700 dark:text-teal-300">Capacity:</span>
                          <span className="text-sm font-semibold text-teal-900 dark:text-teal-100">{selectedBooking.transportDetails.capacity} persons</span>
                        </div>
                        {selectedBooking.transportDetails.features?.length > 0 && (
                          <div className="pt-2 border-t border-teal-200 dark:border-teal-700">
                            <div className="text-sm text-teal-700 dark:text-teal-300 mb-2">Features:</div>
                            <div className="flex flex-wrap gap-2">
                              {selectedBooking.transportDetails.features.map((feature, idx) => (
                                <span key={idx} className="px-2 py-1 bg-teal-200 dark:bg-teal-800 text-teal-800 dark:text-teal-200 rounded-full text-xs font-medium">
                                  {feature}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Ordered Items */}
                  {(selectedBooking.bookingType === 'restaurant' || selectedBooking.bookingType === 'cafe') && renderOrderedItemsTable(selectedBooking)}

                  {/* Gas Station Details */}
                  {selectedBooking.bookingType === 'gas_station' && selectedBooking.gasStationDetails && (
                    <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                      <h3 className="font-semibold text-green-900 dark:text-green-100 text-lg mb-3 flex items-center gap-2">
                        <FaGasPump />
                        Fuel Booking Details
                      </h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-green-700 dark:text-green-300">Fuel Type:</span>
                          <span className="text-sm font-semibold text-green-900 dark:text-green-100 uppercase">
                            {selectedBooking.gasStationDetails.fuelType}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-green-700 dark:text-green-300">Quantity:</span>
                          <span className="text-sm font-semibold text-green-900 dark:text-green-100">
                            {selectedBooking.gasStationDetails.quantity} Liters
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-green-700 dark:text-green-300">Price per Liter:</span>
                          <span className="text-sm font-semibold text-green-900 dark:text-green-100">
                            ₹{selectedBooking.gasStationDetails.pricePerUnit?.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-green-700 dark:text-green-300">Vehicle Number:</span>
                          <span className="text-sm font-semibold text-green-900 dark:text-green-100 uppercase">
                            {selectedBooking.gasStationDetails.vehicleNumber}
                          </span>
                        </div>
                        {selectedBooking.gasStationDetails.vehicleModel && (
                          <div className="flex justify-between">
                            <span className="text-sm text-green-700 dark:text-green-300">Vehicle Model:</span>
                            <span className="text-sm font-semibold text-green-900 dark:text-green-100">
                              {selectedBooking.gasStationDetails.vehicleModel}
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-sm text-green-700 dark:text-green-300">Station:</span>
                          <span className="text-sm font-semibold text-green-900 dark:text-green-100">
                            {selectedBooking.gasStationDetails.stationName}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Price Breakdown */}
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-900 dark:text-white text-lg mb-3">Price Breakdown</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Base Price:</span>
                        <span className="font-medium text-gray-900 dark:text-white">₹{selectedBooking.pricing.basePrice?.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Taxes:</span>
                        <span className="font-medium text-gray-900 dark:text-white">₹{selectedBooking.pricing.taxes?.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Service Fee:</span>
                        <span className="font-medium text-gray-900 dark:text-white">₹{selectedBooking.pricing.serviceFee?.toLocaleString()}</span>
                      </div>
                      <div className="border-t border-gray-300 dark:border-gray-600 pt-2 mt-2 flex justify-between">
                        <span className="font-bold text-gray-900 dark:text-white">Total:</span>
                        <span className="font-bold text-blue-600 dark:text-blue-400 text-lg">₹{selectedBooking.pricing.totalPrice?.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Payment Details */}
                  {selectedBooking.payment && (
                    <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                      <h3 className="font-semibold text-green-900 dark:text-green-100 text-lg mb-3 flex items-center gap-2">
                        <FaCreditCard />
                        Payment Details
                      </h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-green-700 dark:text-green-300">Payment Status:</span>
                          <span className="text-sm font-semibold text-green-900 dark:text-green-100 uppercase">{selectedBooking.payment.paymentStatus}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-green-700 dark:text-green-300">Payment Method:</span>
                          <span className="text-sm font-semibold text-green-900 dark:text-green-100 uppercase">{selectedBooking.payment.paymentMethod}</span>
                        </div>
                        {selectedBooking.payment.paymentDetails?.gateway && (
                          <div className="flex justify-between">
                            <span className="text-sm text-green-700 dark:text-green-300">Gateway:</span>
                            <span className="text-sm font-semibold text-green-900 dark:text-green-100 uppercase">{selectedBooking.payment.paymentDetails.gateway}</span>
                          </div>
                        )}
                        {selectedBooking.payment.paymentDetails?.orderId && (
                          <div className="flex justify-between">
                            <span className="text-sm text-green-700 dark:text-green-300">Order ID:</span>
                            <span className="text-xs font-mono text-green-900 dark:text-green-100">{selectedBooking.payment.paymentDetails.orderId}</span>
                          </div>
                        )}
                        {selectedBooking.payment.paymentDetails?.paymentId && (
                          <div className="flex justify-between">
                            <span className="text-sm text-green-700 dark:text-green-300">Payment ID:</span>
                            <span className="text-xs font-mono text-green-900 dark:text-green-100">{selectedBooking.payment.paymentDetails.paymentId}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Special Requests */}
                  {selectedBooking.specialRequests && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                      <h3 className="font-semibold text-blue-900 dark:text-blue-100 text-lg mb-2">Special Requests</h3>
                      <p className="text-sm text-blue-800 dark:text-blue-200">{selectedBooking.specialRequests}</p>
                    </div>
                  )}

                  {/* Booking Metadata */}
                  <div className="text-xs text-gray-500 dark:text-gray-400 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div>Booked on: {new Date(selectedBooking.createdAt).toLocaleString()}</div>
                    {selectedBooking.updatedAt !== selectedBooking.createdAt && (
                      <div>Last updated: {new Date(selectedBooking.updatedAt).toLocaleString()}</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="p-6 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
                {/* Download Buttons */}
                <div className="flex gap-3 justify-start mb-4 pb-4 border-b border-gray-200 dark:border-gray-600">
                  <button
                    onClick={() => generatePaymentReceipt(selectedBooking)}
                    className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all font-semibold flex items-center gap-2 shadow-md hover:shadow-lg"
                  >
                    <FaDownload />
                    Download Receipt
                  </button>
                  <button
                    onClick={() => generateInvoice(selectedBooking)}
                    className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all font-semibold flex items-center gap-2 shadow-md hover:shadow-lg"
                  >
                    <FaFileInvoice />
                    Download Invoice
                  </button>
                </div>
                
                {/* Action Buttons */}
                <div className="flex gap-3 justify-end">
                  {selectedBooking.status === 'pending' || selectedBooking.status === 'confirmed' ? (
                    <>
                      <button
                        onClick={() => {
                          handleResendEmail(selectedBooking._id);
                        }}
                        className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-semibold flex items-center gap-2"
                      >
                        <FaEnvelope />
                        Resend Email
                      </button>
                      <button
                        onClick={() => {
                          handleMarkAsCompleted(selectedBooking._id);
                          setShowDetailsModal(false);
                        }}
                        className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-semibold flex items-center gap-2"
                      >
                        <FaCheckCircle />
                        Mark as Completed
                      </button>
                      <button
                        onClick={() => {
                          handleCancelBooking(selectedBooking._id, selectedBooking.bookingType);
                          setShowDetailsModal(false);
                        }}
                        className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-semibold flex items-center gap-2"
                      >
                        <FaTimesCircle />
                        Cancel Booking
                      </button>
                    </>
                  ) : selectedBooking.status === 'cancelled' ? (
                    <button
                      onClick={() => {
                        handleDeleteBooking(selectedBooking._id);
                        setShowDetailsModal(false);
                      }}
                      className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-semibold flex items-center gap-2"
                    >
                      <FaTrash />
                      Delete Booking
                    </button>
                  ) : null}
                  <button
                    onClick={() => setShowDetailsModal(false)}
                    className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg font-semibold hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Bookings;
