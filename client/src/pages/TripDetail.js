import React, { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";
import { useQueryClient } from "@tanstack/react-query";
import jsPDF from "jspdf";
import { useApi } from "../hooks/useApi";
import { tripAPI, mapsAPI } from "../services/api";
import { Card, Button, LoadingSpinner, Badge } from "../components/ui";
import BookingModal from "../components/booking/BookingModal";
import SmartBudgetBreakdown from "../components/trip/SmartBudgetBreakdown";
import EditableItinerary from "../components/trip/EditableItinerary";
import {
  FaRoute,
  FaCalendar,
  FaMapMarkedAlt,
  FaUsers,
  FaDollarSign,
  FaHeart,
  FaShare,
  FaEdit,
  FaTrash,
  FaDownload,
  FaClock,
  FaStar,
  FaArrowLeft,
  FaMapMarkerAlt,
  FaCheckCircle,
  FaShoppingCart,
  FaFileInvoice,
  FaReceipt,
  FaChevronDown,
  FaChevronUp,
} from "react-icons/fa";

const TripDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("overview"); // overview, itinerary, details
  const [optimizedRoute, setOptimizedRoute] = useState(null);
  const [optimizingRoute, setOptimizingRoute] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [expandedDays, setExpandedDays] = useState([0]); // First day expanded by default

  const {
    data: trip,
    isLoading,
    error,
  } = useApi(["trip", id], () =>
    tripAPI.getTripById(id).then((res) => res.data.trip)
  );

  const toggleDay = (index) => {
    setExpandedDays((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this trip?")) {
      try {
        await tripAPI.deleteTrip(id);
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ["trips"] }),
          queryClient.invalidateQueries({ queryKey: ["trips", "stats"] }),
          queryClient.invalidateQueries({ queryKey: ["trips", "upcoming"] }),
          queryClient.invalidateQueries({ queryKey: ["trips", "past"] }),
          queryClient.invalidateQueries({ queryKey: ["userTrips"] }),
          queryClient.removeQueries({ queryKey: ["trip", id] }),
        ]);
        toast.success("Trip deleted successfully");
        navigate("/trips");
      } catch (error) {
        toast.error("Failed to delete trip");
      }
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      await tripAPI.updateTripStatus(id, newStatus);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["trip", id] }),
        queryClient.invalidateQueries({ queryKey: ["trips"] }),
        queryClient.invalidateQueries({ queryKey: ["trips", "stats"] }),
        queryClient.invalidateQueries({ queryKey: ["trips", "upcoming"] }),
        queryClient.invalidateQueries({ queryKey: ["trips", "past"] }),
        queryClient.invalidateQueries({ queryKey: ["userTrips"] }),
      ]);
      const statusLabel = newStatus.charAt(0).toUpperCase() + newStatus.slice(1);
      toast.success(`Trip marked as ${statusLabel}`);
      // Refresh the trip data
      window.location.reload();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update trip status");
    }
  };

  const handleOptimizeRoute = async () => {
    if (!trip?.itinerary?.days && !trip?.itinerary?.dailyPlans) {
      toast.error("No itinerary to optimize");
      return;
    }

    try {
      setOptimizingRoute(true);
      
      // Extract waypoints from itinerary
      const days = trip.itinerary.days || trip.itinerary.dailyPlans;
      const waypoints = [];
      
      days.forEach((day) => {
        if (day.activities) {
          day.activities.forEach((activity) => {
            if (activity.location?.lat && activity.location?.lng) {
              waypoints.push({
                lat: activity.location.lat,
                lng: activity.location.lng,
                name: activity.activity || activity.title || activity.name,
              });
            }
          });
        }
      });

      console.log("Extracted waypoints:", waypoints);

      if (waypoints.length < 2) {
        toast.error("Need at least 2 locations with coordinates to optimize");
        setOptimizingRoute(false);
        return;
      }

      const { data } = await mapsAPI.optimizeRoute({ waypoints });
      
      if (data.success) {
        setOptimizedRoute(data.data);
        toast.success(`Route optimized! Saved ${data.data.timeSaved || 0} minutes`);
      }
    } catch (error) {
      console.error("Route optimization error:", error);
      toast.error(error.response?.data?.message || "Failed to optimize route");
    } finally {
      setOptimizingRoute(false);
    }
  };

  const handleShare = () => {
    const destName = trip?.destination?.city 
      ? `${trip.destination.city}, ${trip.destination.country}`
      : (trip?.destination || "Unknown Destination");

    if (navigator.share) {
      navigator.share({
        title: `Trip to ${destName}`,
        text: `Check out my trip to ${destName}!`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard!");
    }
  };

  const handleDownload = () => {
    try {
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;
      let yPosition = margin;

      // Header
      pdf.setFillColor(79, 70, 229);
      pdf.rect(0, 0, pageWidth, 40, "F");
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(24);
      pdf.setFont("helvetica", "bold");
      pdf.text(trip.title || "My Trip", margin, 25);

      yPosition = 50;

      // Destination
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(16);
      pdf.setFont("helvetica", "bold");
      pdf.text("Destination:", margin, yPosition);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(12);
      const destination =
        trip.destination?.city && trip.destination?.country
          ? `${trip.destination.city}, ${trip.destination.country}`
          : trip.destination?.city || trip.destination || "Not specified";
      pdf.text(destination, margin + 40, yPosition);
      yPosition += 10;

      // Duration and Budget
      pdf.setFont("helvetica", "bold");
      pdf.text("Duration:", margin, yPosition);
      pdf.setFont("helvetica", "normal");
      pdf.text(getDuration(), margin + 40, yPosition);
      yPosition += 7;

      pdf.setFont("helvetica", "bold");
      pdf.text("Budget:", margin, yPosition);
      pdf.setFont("helvetica", "normal");
      const budget = trip.preferences?.budget?.max
        ? `Rs ${trip.preferences.budget.max}`
        : "Not specified";
      pdf.text(budget, margin + 40, yPosition);
      yPosition += 7;

      pdf.setFont("helvetica", "bold");
      pdf.text("Travelers:", margin, yPosition);
      pdf.setFont("helvetica", "normal");
      const travelers = trip.preferences?.groupSize || trip.groupSize || 1;
      pdf.text(
        `${travelers} traveler${travelers > 1 ? "s" : ""}`,
        margin + 40,
        yPosition
      );
      yPosition += 15;

      // Itinerary
      if (
        trip.itinerary &&
        (trip.itinerary.days || trip.itinerary.dailyPlans)
      ) {
        pdf.setFontSize(16);
        pdf.setFont("helvetica", "bold");
        pdf.text("Itinerary:", margin, yPosition);
        yPosition += 10;

        const days = trip.itinerary.days || trip.itinerary.dailyPlans;
        days.forEach((day) => {
          if (yPosition > pageHeight - 40) {
            pdf.addPage();
            yPosition = margin;
          }

          pdf.setFontSize(14);
          pdf.setFont("helvetica", "bold");
          pdf.text(
            `Day ${day.day}: ${day.title || day.theme || "Adventure Day"}`,
            margin,
            yPosition
          );
          yPosition += 8;

          if (day.activities && day.activities.length > 0) {
            pdf.setFontSize(10);
            pdf.setFont("helvetica", "normal");

            day.activities.forEach((activity) => {
              if (yPosition > pageHeight - 30) {
                pdf.addPage();
                yPosition = margin;
              }

              const activityText = `${activity.time || ""} - ${
                activity.activity || activity.title || activity.name
              }`;
              const splitText = pdf.splitTextToSize(
                activityText,
                pageWidth - 2 * margin - 10
              );
              pdf.text(splitText, margin + 5, yPosition);
              yPosition += splitText.length * 5;

              if (activity.location?.name) {
                pdf.setFont("helvetica", "italic");
                pdf.text(
                  `  @ ${activity.location.name}`,
                  margin + 5,
                  yPosition
                );
                pdf.setFont("helvetica", "normal");
                yPosition += 5;
              }
            });
          }
          yPosition += 5;
        });
      }

      // Save PDF
      const fileName = `${
        trip.title?.replace(/[^a-z0-9]/gi, "_") || "trip"
      }_itinerary.pdf`;
      pdf.save(fileName);
      toast.success("PDF downloaded successfully!");
    } catch (error) {
      console.error("PDF generation error:", error);
      toast.error("Failed to generate PDF");
    }
  };

  const generateTripPaymentReceipt = () => {
    try {
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
      pdf.text('TRIP PAYMENT RECEIPT', pageWidth / 2, 30, { align: 'center' });

      // Receipt Info
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(10);
      let yPos = 55;
      
      pdf.setFont(undefined, 'bold');
      pdf.text('Payment Receipt', 20, yPos);
      pdf.setFont(undefined, 'normal');
      yPos += 7;
      
      const receiptId = `TR-${trip._id?.substring(trip._id.length - 8).toUpperCase()}`;
      pdf.text(`Receipt No: ${receiptId}`, 20, yPos);
      pdf.text(`Date: ${new Date().toLocaleDateString('en-IN')}`, 120, yPos);
      yPos += 10;

      // Customer Details
      pdf.setFont(undefined, 'bold');
      pdf.setFillColor(240, 240, 240);
      pdf.rect(15, yPos, pageWidth - 30, 8, 'F');
      pdf.text('Customer Details', 20, yPos + 5);
      yPos += 13;
      
      pdf.setFont(undefined, 'normal');
      const userName = trip.user?.name || trip.createdBy?.name || 'Valued Customer';
      pdf.text(`Name: ${userName}`, 20, yPos);
      yPos += 6;
      if (trip.user?.email || trip.createdBy?.email) {
        pdf.text(`Email: ${trip.user?.email || trip.createdBy?.email}`, 20, yPos);
        yPos += 6;
      }
      yPos += 6;

      // Trip Details
      pdf.setFont(undefined, 'bold');
      pdf.setFillColor(240, 240, 240);
      pdf.rect(15, yPos, pageWidth - 30, 8, 'F');
      pdf.text('Trip Details', 20, yPos + 5);
      yPos += 13;
      
      pdf.setFont(undefined, 'normal');
      const destination = trip.destination?.city || trip.destination || 'N/A';
      pdf.text(`Destination: ${destination}`, 20, yPos);
      yPos += 6;
      pdf.text(`Trip Title: ${trip.title || 'Trip Package'}`, 20, yPos);
      yPos += 6;
      
      if (trip.startDate && trip.endDate) {
        const startDate = new Date(trip.startDate).toLocaleDateString('en-IN');
        const endDate = new Date(trip.endDate).toLocaleDateString('en-IN');
        pdf.text(`Travel Dates: ${startDate} - ${endDate}`, 20, yPos);
        yPos += 6;
      }
      
      if (trip.travelers) {
        pdf.text(`Travelers: ${trip.travelers}`, 20, yPos);
        yPos += 6;
      }
      yPos += 6;

      // Package Details
      pdf.setFont(undefined, 'bold');
      pdf.setFillColor(240, 240, 240);
      pdf.rect(15, yPos, pageWidth - 30, 8, 'F');
      pdf.text('Package Inclusions', 20, yPos + 5);
      yPos += 13;
      
      pdf.setFont(undefined, 'normal');
      pdf.text('• Accommodation as per itinerary', 20, yPos);
      yPos += 6;
      pdf.text('• Daily meals and refreshments', 20, yPos);
      yPos += 6;
      pdf.text('• Transportation and transfers', 20, yPos);
      yPos += 6;
      pdf.text('• Sightseeing and activities', 20, yPos);
      yPos += 6;
      pdf.text('• Professional tour guide', 20, yPos);
      yPos += 10;

      // Payment Details
      pdf.setFont(undefined, 'bold');
      pdf.setFillColor(240, 240, 240);
      pdf.rect(15, yPos, pageWidth - 30, 8, 'F');
      pdf.text('Payment Details', 20, yPos + 5);
      yPos += 13;
      
      pdf.setFont(undefined, 'normal');
      pdf.text('Payment Method: Online Payment', 20, yPos);
      yPos += 6;
      pdf.setFont(undefined, 'bold');
      pdf.setTextColor(22, 163, 74); // Green
      pdf.text('Status: PAID', 20, yPos);
      pdf.setTextColor(0, 0, 0);
      yPos += 12;

      // Amount Details
      pdf.setFont(undefined, 'bold');
      pdf.setFillColor(240, 240, 240);
      pdf.rect(15, yPos, pageWidth - 30, 8, 'F');
      pdf.text('Amount Details', 20, yPos + 5);
      yPos += 13;
      
      const tripCost = trip.itinerary?.totalCost?.amount || trip.itinerary?.totalEstimatedCost?.amount || trip.preferences?.budget?.max || trip.preferences?.budget?.min || 0;
      const basePrice = tripCost;
      const taxes = Math.round(basePrice * 0.18);
      const serviceFee = Math.round(basePrice * 0.05);
      const totalPrice = basePrice + taxes + serviceFee;
      
      pdf.setFont(undefined, 'normal');
      pdf.text('Package Cost:', 20, yPos);
      pdf.text(`₹${basePrice.toLocaleString('en-IN')}`, 150, yPos, { align: 'right' });
      yPos += 6;
      
      pdf.text('Taxes (18%):', 20, yPos);
      pdf.text(`₹${taxes.toLocaleString('en-IN')}`, 150, yPos, { align: 'right' });
      yPos += 6;
      
      pdf.text('Service Fee (5%):', 20, yPos);
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
      pdf.save(`Trip-Payment-Receipt-${receiptId}.pdf`);
      toast.success('Payment receipt downloaded successfully!');
    } catch (error) {
      console.error('Receipt generation error:', error);
      toast.error('Failed to generate payment receipt');
    }
  };

  const generateTripInvoice = () => {
    try {
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
      pdf.text('TAX INVOICE', pageWidth / 2, 41, { align: 'center' });

      // Invoice Info
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(10);
      let yPos = 60;
      
      const invoiceId = `INV-TR-${trip._id?.substring(trip._id.length - 8).toUpperCase()}`;
      
      pdf.setFont(undefined, 'bold');
      pdf.text('Tax Invoice', 20, yPos);
      pdf.setFont(undefined, 'normal');
      yPos += 7;
      
      pdf.text(`Invoice No: ${invoiceId}`, 20, yPos);
      pdf.text(`Date: ${new Date(trip.createdAt || Date.now()).toLocaleDateString('en-IN')}`, 120, yPos);
      yPos += 5;
      pdf.text(`Trip ID: ${trip._id?.substring(trip._id.length - 8).toUpperCase()}`, 20, yPos);
      pdf.text(`Status: ${trip.status?.toUpperCase() || 'CONFIRMED'}`, 120, yPos);
      yPos += 12;

      // Bill To
      pdf.setFont(undefined, 'bold');
      pdf.setFillColor(240, 240, 240);
      pdf.rect(15, yPos, 85, 8, 'F');
      pdf.text('Bill To:', 20, yPos + 5);
      yPos += 13;
      
      pdf.setFont(undefined, 'normal');
      const userName = trip.user?.name || trip.createdBy?.name || 'Valued Customer';
      pdf.text(userName, 20, yPos);
      yPos += 5;
      if (trip.user?.email || trip.createdBy?.email) {
        pdf.text(trip.user?.email || trip.createdBy?.email, 20, yPos);
        yPos += 5;
      }
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
      
      const destination = trip.destination?.city || trip.destination || 'Destination';
      const serviceDesc = `${destination} Trip Package`;
      pdf.text(serviceDesc, 20, yPos);
      
      if (trip.startDate && trip.endDate) {
        yPos += 5;
        pdf.setFontSize(9);
        pdf.setTextColor(100, 100, 100);
        const startDate = new Date(trip.startDate).toLocaleDateString('en-IN');
        const endDate = new Date(trip.endDate).toLocaleDateString('en-IN');
        pdf.text(`${startDate} - ${endDate}`, 20, yPos);
        pdf.setFontSize(10);
        pdf.setTextColor(0, 0, 0);
      }
      
      yPos += 5;
      if (trip.title) {
        pdf.setFontSize(9);
        pdf.setTextColor(100, 100, 100);
        pdf.text(trip.title, 20, yPos);
        pdf.setFontSize(10);
        pdf.setTextColor(0, 0, 0);
      }
      
      yPos -= 5;
      const quantity = trip.travelers || trip.preferences?.groupSize || 1;
      const tripCost = trip.itinerary?.totalCost?.amount || trip.itinerary?.totalEstimatedCost?.amount || trip.preferences?.budget?.max || trip.preferences?.budget?.min || 0;
      const basePrice = tripCost;
      
      pdf.text(`${quantity}`, 110, yPos);
      pdf.text(`₹${(basePrice / quantity).toLocaleString('en-IN')}`, 140, yPos);
      pdf.text(`₹${basePrice.toLocaleString('en-IN')}`, 165, yPos, { align: 'right' });
      yPos += 15;

      // Package Inclusions
      pdf.setFontSize(9);
      pdf.setFont(undefined, 'bold');
      pdf.text('Package Includes:', 20, yPos);
      yPos += 5;
      pdf.setFont(undefined, 'normal');
      pdf.setTextColor(100, 100, 100);
      pdf.text('• Accommodation • Meals • Transportation • Sightseeing • Guide Services', 20, yPos);
      yPos += 10;
      pdf.setFontSize(10);
      pdf.setTextColor(0, 0, 0);

      // Subtotal and Tax Breakdown
      pdf.setDrawColor(200, 200, 200);
      pdf.line(15, yPos, pageWidth - 15, yPos);
      yPos += 8;
      
      const taxes = Math.round(basePrice * 0.18);
      const serviceFee = Math.round(basePrice * 0.05);
      const totalPrice = basePrice + taxes + serviceFee;
      
      pdf.setFont(undefined, 'normal');
      pdf.text('Subtotal:', 110, yPos);
      pdf.text(`₹${basePrice.toLocaleString('en-IN')}`, 165, yPos, { align: 'right' });
      yPos += 7;
      
      pdf.text('GST (18%):', 110, yPos);
      pdf.text(`₹${taxes.toLocaleString('en-IN')}`, 165, yPos, { align: 'right' });
      yPos += 7;
      
      pdf.text('Service Fee (5%):', 110, yPos);
      pdf.text(`₹${serviceFee.toLocaleString('en-IN')}`, 165, yPos, { align: 'right' });
      yPos += 10;
      
      // Grand Total
      pdf.setFont(undefined, 'bold');
      pdf.setFillColor(79, 70, 229);
      pdf.rect(105, yPos - 3, pageWidth - 120, 10, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(12);
      pdf.text('GRAND TOTAL:', 110, yPos + 4);
      pdf.text(`₹${totalPrice.toLocaleString('en-IN')}`, 165, yPos + 4, { align: 'right' });
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(10);
      yPos += 18;

      // Payment Status
      pdf.setFont(undefined, 'bold');
      pdf.setTextColor(22, 163, 74);
      pdf.text('Payment Status: PAID', 20, yPos);
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
      pdf.text('3. Services subject to availability and weather conditions.', 20, yPos);
      yPos += 10;

      // Footer
      pdf.setFontSize(9);
      pdf.setFont(undefined, 'italic');
      pdf.setTextColor(100, 100, 100);
      pdf.text('This is a computer-generated invoice and does not require a signature.', pageWidth / 2, yPos, { align: 'center' });
      yPos += 4;
      pdf.text('For any queries, please contact support@aitripplanner.com', pageWidth / 2, yPos, { align: 'center' });
      
      // Save PDF
      pdf.save(`Trip-Invoice-${invoiceId}.pdf`);
      toast.success('Invoice downloaded successfully!');
    } catch (error) {
      console.error('Invoice generation error:', error);
      toast.error('Failed to generate invoice');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-blue-950/50 dark:to-gray-900 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-blue-950/50 dark:to-gray-900 py-6">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="p-12 text-center bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-xl rounded-2xl">
            <FaMapMarkedAlt className="h-20 w-20 mx-auto text-gray-300 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Trip Not Found
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              The trip you're looking for doesn't exist or has been removed.
            </p>
            <Link to="/trips">
              <Button className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 text-white font-bold px-6 py-3 rounded-xl">
                <FaArrowLeft className="mr-2" />
                Back to Trips
              </Button>
            </Link>
          </Card>
        </div>
      </div>
    );
  }

  const getDuration = () => {
    // First try preferences.duration
    if (trip.preferences?.duration) {
      const days = trip.preferences.duration;
      return `${days} day${days > 1 ? "s" : ""}`;
    }

    // Fall back to calculating from dates
    const start = new Date(trip.startDate);
    const end = new Date(trip.endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return "Unknown duration";
    }
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    return `${days} day${days > 1 ? "s" : ""}`;
  };

  const getStatusVariant = () => {
    const now = new Date();
    const startDate = new Date(trip.startDate);
    const endDate = new Date(trip.endDate);

    if (trip.status === "draft") return "secondary";
    if (endDate < now) return "success";
    if (startDate <= now && endDate >= now) return "warning";
    return "primary";
  };

  const getStatusLabel = () => {
    const now = new Date();
    const startDate = new Date(trip.startDate);
    const endDate = new Date(trip.endDate);

    if (trip.status === "draft") return "Draft";
    if (endDate < now) return "Completed";
    if (startDate <= now && endDate >= now) return "In Progress";
    return "Upcoming";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-blue-950/50 dark:to-gray-900 py-4 md:py-6">
      <div className="max-w-6xl mx-auto px-3 md:px-6 lg:px-8">
        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="hidden md:block mb-4"
        >
          <Link to="/trips">
            <Button
              variant="ghost"
              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white pl-0"
            >
              <FaArrowLeft className="mr-2" />
              Back to Trips
            </Button>
          </Link>
        </motion.div>

        {/* Header with Hero Image */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 md:mb-6"
        >
          <Card className="overflow-hidden bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-xl rounded-xl md:rounded-2xl p-2 md:p-0">
            {/* Hero Section */}
            <div className="relative h-48 md:h-80 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-lg md:rounded-none">
              <div className="absolute inset-0 flex items-center justify-center">
                <FaMapMarkedAlt className="h-20 w-20 md:h-32 md:w-32 text-white/20" />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent rounded-lg md:rounded-none"></div>
              
              {/* Mobile Badge - Top Right */}
              <div className="absolute top-2 right-2 md:hidden z-10">
                <Badge
                  variant={getStatusVariant()}
                  className="inline-flex items-center rounded-full px-2.5 py-1 font-bold shadow-lg text-xs"
                >
                  {getStatusLabel()}
                </Badge>
              </div>

              <div className="absolute bottom-0 left-0 right-0 p-3 md:p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <Badge
                      variant={getStatusVariant()}
                      className="hidden md:inline-flex mb-2 md:mb-3 font-bold shadow-lg text-xs md:text-sm"
                    >
                      {getStatusLabel()}
                    </Badge>
                    <h1 className="text-2xl md:text-4xl font-bold text-white mb-1 md:mb-2 line-clamp-1">
                      {trip.destination?.city || trip.destination}
                      {trip.destination?.country &&
                        trip.destination.city !== trip.destination.country &&
                        `, ${trip.destination.country}`}
                    </h1>
                    <div className="flex flex-wrap gap-2 md:gap-4 text-white/90 text-[10px] md:text-sm">
                      <div className="flex items-center">
                        <FaCalendar className="mr-1 md:mr-2" />
                        {new Date(trip.startDate).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}{" "}
                        -{" "}
                        {new Date(trip.endDate).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </div>
                      <div className="flex items-center">
                        <FaClock className="mr-1 md:mr-2" />
                        {getDuration()}
                      </div>
                      <div className="flex items-center">
                        <FaUsers className="mr-1 md:mr-2" />
                        {trip.preferences?.groupSize ||
                          trip.groupSize ||
                          trip.travelers ||
                          1}{" "}
                        travelers
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="p-2 md:p-4 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-t border-gray-200/50 dark:border-gray-700/50">
              <div className="grid grid-cols-2 md:flex md:flex-wrap gap-2 md:gap-3">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.95 }}
                  className="order-1 md:order-none"
                >
                  <Button
                    onClick={handleShare}
                    variant="outline"
                    className="w-full md:w-auto rounded-lg md:rounded-xl border-2 font-semibold text-sm md:text-base py-1.5 px-2"
                  >
                    <FaShare className="mr-1 md:mr-2" />
                    Share
                  </Button>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.95 }}
                  className="order-2 md:order-none"
                >
                  <Button
                    onClick={handleDownload}
                    variant="outline"
                    className="w-full md:w-auto rounded-lg md:rounded-xl border-2 font-semibold text-sm md:text-base py-1.5 px-2"
                  >
                    <FaDownload className="mr-1 md:mr-2" />
                    PDF
                  </Button>
                </motion.div>
                
                {/* Payment Receipt Button */}
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.95 }}
                  className="order-2 md:order-none"
                >
                  <Button
                    onClick={generateTripPaymentReceipt}
                    variant="outline"
                    className="w-full md:w-auto rounded-lg md:rounded-xl border-2 border-blue-300 text-blue-600 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-400 dark:hover:bg-blue-900/20 font-semibold text-sm md:text-base py-1.5 px-2"
                  >
                    <FaReceipt className="mr-1 md:mr-2" />
                    <span className="hidden md:inline">Receipt</span>
                    <span className="md:hidden">Pay</span>
                  </Button>
                </motion.div>
                
                {/* Invoice Button */}
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.95 }}
                  className="order-2 md:order-none"
                >
                  <Button
                    onClick={generateTripInvoice}
                    variant="outline"
                    className="w-full md:w-auto rounded-lg md:rounded-xl border-2 border-indigo-300 text-indigo-600 hover:bg-indigo-50 dark:border-indigo-800 dark:text-indigo-400 dark:hover:bg-indigo-900/20 font-semibold text-sm md:text-base py-1.5 px-2"
                  >
                    <FaFileInvoice className="mr-1 md:mr-2" />
                    <span className="hidden md:inline">Invoice</span>
                    <span className="md:hidden">Inv</span>
                  </Button>
                </motion.div>
                
                {/* Book This Trip Button */}
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.95 }}
                  className="order-3 md:order-none"
                >
                  <Button
                    onClick={() => setShowBookingModal(true)}
                    className="w-full md:w-auto bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold rounded-lg md:rounded-xl text-sm md:text-base py-1.5 px-2"
                  >
                    <FaShoppingCart className="mr-1 md:mr-2" />
                    <span className="hidden md:inline">Book </span>Trip
                  </Button>
                </motion.div>
                
                {/* Mark as Completed Button - Only show if not already completed */}
                {trip.status !== 'completed' && trip.status !== 'cancelled' && (
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.95 }}
                    className="order-3 md:order-none"
                  >
                    <Button
                      onClick={() => handleStatusChange('completed')}
                      variant="outline"
                      className="w-full md:w-auto rounded-lg md:rounded-xl border-2 border-green-300 text-green-600 hover:bg-green-50 dark:border-green-800 dark:text-green-400 dark:hover:bg-green-900/20 font-semibold text-sm md:text-base py-1.5 px-2"
                    >
                      <FaCheckCircle className="mr-1 md:mr-2" />
                      <span className="hidden md:inline">Mark as </span>Completed
                    </Button>
                  </motion.div>
                )}
                
                <div className="col-span-2 md:ml-auto flex gap-2 md:gap-3 order-4 md:order-none">
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex-1 md:flex-none"
                  >
                    <Button
                      onClick={() => navigate(`/trip-planner?edit=${id}`)}
                      className="w-full md:w-auto bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold rounded-lg md:rounded-xl text-sm md:text-base py-1.5"
                    >
                      <FaEdit className="mr-1 md:mr-2" />
                      Edit
                    </Button>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex-1 md:flex-none"
                  >
                    <Button
                      onClick={handleDelete}
                      variant="outline"
                      className="w-full md:w-auto rounded-lg md:rounded-xl border-2 border-red-300 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20 font-semibold text-sm md:text-base py-1.5"
                    >
                      <FaTrash className="mr-1 md:mr-2" />
                      Delete
                    </Button>
                  </motion.div>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-4 md:mb-6"
        >
          <Card className="p-1 md:p-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg rounded-xl md:rounded-2xl">
            <div className="flex gap-1 md:gap-2">
              {["Overview", "Itinerary", "Details"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab.toLowerCase())}
                  className={`flex-1 px-2 md:px-4 py-2 md:py-2.5 rounded-lg md:rounded-xl font-semibold text-xs md:text-sm transition-all duration-300 ${
                    activeTab === tab.toLowerCase()
                      ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Info */}
              <div className="lg:col-span-2 space-y-6">
                <Card className="px-2 py-3 md:p-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg rounded-xl md:rounded-2xl">
                  <h2 className="text-lg md:text-2xl font-bold text-gray-900 dark:text-white mb-3 md:mb-4">
                    About This Trip
                  </h2>
                  <p className="text-sm md:text-base text-gray-600 dark:text-gray-300 leading-relaxed">
                    {trip.description ||
                      `Explore the beautiful destination of ${
                        trip.destination?.city || trip.destination
                      }. This ${getDuration()} adventure will take you through amazing experiences and unforgettable moments.`}
                  </p>

                  {/* Mobile Trip Details Integration */}
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 lg:hidden">
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <div className="text-[10px] uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
                            Budget
                          </div>
                          <div className="flex items-center text-sm font-bold text-gray-900 dark:text-white">
                            <FaDollarSign className="mr-1 text-green-600 text-xs" />
                            {trip.preferences?.budget?.max
                              ? `₹${trip.preferences.budget.max}`
                              : trip.budget?.max
                              ? `₹${trip.budget.max}`
                              : (typeof trip.budget === 'string' || typeof trip.budget === 'number') ? trip.budget : "Not specified"}
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
                            Travel Style
                          </div>
                          <div className="text-gray-900 dark:text-white font-semibold capitalize text-sm">
                            {trip.travelStyle || "Mid-range"}
                          </div>
                        </div>
                      </div>
                      
                      {trip.accommodation && typeof trip.accommodation === 'string' && (
                        <div>
                          <div className="text-[10px] uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
                            Accommodation
                          </div>
                          <div className="text-gray-900 dark:text-white font-semibold capitalize text-sm">
                            {trip.accommodation}
                          </div>
                        </div>
                      )}
                      
                      {trip.interests && trip.interests.length > 0 && (
                        <div>
                          <div className="text-[10px] uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
                            Interests
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {trip.interests.map((interest, idx) => (
                              <span
                                key={idx}
                                className="px-2.5 py-1 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 text-blue-700 dark:text-blue-300 rounded-lg text-[10px] font-semibold"
                              >
                                {interest}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>

                {trip.itinerary &&
                  (trip.itinerary.days || trip.itinerary.dailyPlans) && (
                    <Card className="px-2 py-3 md:p-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg rounded-xl md:rounded-2xl">
                      <h2 className="text-lg md:text-2xl font-bold text-gray-900 dark:text-white mb-3 md:mb-4 flex items-center">
                        <FaRoute className="mr-2 md:mr-3 text-purple-600" />
                        Daily Highlights
                      </h2>
                      <div className="space-y-3 md:max-h-[600px] md:overflow-y-auto md:pr-2">
                        {(trip.itinerary.days || trip.itinerary.dailyPlans).map(
                          (day, index) => (
                            <div
                              key={index}
                              className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden"
                            >
                              <button
                                onClick={() => toggleDay(index)}
                                className="w-full flex items-start p-2 md:p-5 hover:bg-white/50 dark:hover:bg-gray-700/50 transition-all text-left"
                              >
                                <div className="flex-shrink-0 w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm md:text-base mr-3">
                                  {day.day}
                                </div>
                                <div className="flex-1">
                                  <h4 className="font-bold text-sm md:text-base text-gray-900 dark:text-white">
                                    Day {day.day}:{" "}
                                    {day.title || day.theme || "Activities"}
                                  </h4>
                                  <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 mt-1">
                                    {day.activities?.[0]?.activity ||
                                      day.activities?.[0]?.title ||
                                      day.activities?.[0]?.name ||
                                      "Exciting activities planned"}
                                  </p>
                                  {day.activities &&
                                    day.activities.length > 1 && (
                                      <p className="text-[10px] md:text-xs text-purple-600 dark:text-purple-400 mt-1">
                                        +{day.activities.length - 1} more
                                        activities
                                      </p>
                                    )}
                                </div>
                                <div className="flex-shrink-0 ml-2">
                                  {expandedDays.includes(index) ? (
                                    <FaChevronUp className="text-gray-400 text-sm md:text-base" />
                                  ) : (
                                    <FaChevronDown className="text-gray-400 text-sm md:text-base" />
                                  )}
                                </div>
                              </button>
                              
                              <AnimatePresence>
                                {expandedDays.includes(index) && day.activities && day.activities.length > 1 && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className="border-t border-gray-200 dark:border-gray-700"
                                  >
                                    <div className="p-2 md:p-5 space-y-2 bg-white/50 dark:bg-gray-800/50">
                                      {day.activities.slice(1).map((activity, actIdx) => (
                                        <div
                                          key={actIdx}
                                          className="flex items-start gap-2 p-2 md:p-3 bg-white dark:bg-gray-700 rounded-lg"
                                        >
                                          <FaMapMarkerAlt className="text-purple-600 mt-1 flex-shrink-0 text-xs md:text-sm" />
                                          <div className="flex-1">
                                            <p className="font-semibold text-xs md:text-sm text-gray-900 dark:text-white">
                                              {activity.activity || activity.title || activity.name}
                                            </p>
                                            {activity.location?.name && (
                                              <p className="text-[10px] md:text-xs text-blue-600 dark:text-blue-400 mt-1">
                                                📍 {activity.location.name}
                                              </p>
                                            )}
                                            {activity.description && typeof activity.description === 'string' && (
                                              <p className="text-[10px] md:text-xs text-gray-600 dark:text-gray-400 mt-1">
                                                {activity.description}
                                              </p>
                                            )}
                                            {activity.duration && typeof activity.duration === 'string' && (
                                              <p className="text-[10px] md:text-xs text-purple-600 dark:text-purple-400 mt-1 flex items-center gap-1">
                                                <FaClock className="text-[8px] md:text-xs" />
                                                {activity.duration}
                                              </p>
                                            )}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          )
                        )}
                      </div>
                    </Card>
                  )}
              </div>

              {/* Sidebar Info */}
              <div className="space-y-6">
                <Card className="hidden lg:block px-2 py-3 md:p-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg rounded-xl md:rounded-2xl">
                  <h3 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white mb-4">
                    Trip Details
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                        Budget
                      </div>
                      <div className="flex items-center text-lg font-bold text-gray-900 dark:text-white">
                        <FaDollarSign className="mr-2 text-green-600" />
                        {trip.preferences?.budget?.max
                          ? `₹${trip.preferences.budget.max}`
                          : trip.budget?.max
                          ? `₹${trip.budget.max}`
                          : (typeof trip.budget === 'string' || typeof trip.budget === 'number') ? trip.budget : "Not specified"}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                        Travel Style
                      </div>
                      <div className="text-gray-900 dark:text-white font-semibold capitalize">
                        {trip.travelStyle || "Mid-range"}
                      </div>
                    </div>
                    {trip.accommodation && typeof trip.accommodation === 'string' && (
                      <div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                          Accommodation
                        </div>
                        <div className="text-gray-900 dark:text-white font-semibold capitalize">
                          {trip.accommodation}
                        </div>
                      </div>
                    )}
                    {trip.interests && trip.interests.length > 0 && (
                      <div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                          Interests
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {trip.interests.map((interest, idx) => (
                            <span
                              key={idx}
                              className="px-3 py-1 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 text-blue-700 dark:text-blue-300 rounded-lg text-xs font-semibold"
                            >
                              {interest}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </Card>

                {trip.rating && (
                  <Card className="p-4 md:p-6 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 backdrop-blur-sm border-0 shadow-lg rounded-xl md:rounded-2xl">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-base md:text-lg font-bold text-gray-900 dark:text-white">
                        Your Rating
                      </h3>
                      <div className="flex items-center">
                        <FaStar className="h-6 w-6 text-yellow-400 mr-2" />
                        <span className="text-2xl font-bold text-gray-900 dark:text-white">
                          {trip.rating}
                        </span>
                        <span className="text-gray-500 dark:text-gray-400 ml-1">
                          / 5.0
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Share your experience with others!
                    </p>
                  </Card>
                )}
              </div>
            </div>
          )}

          {activeTab === "itinerary" && (
            <Card className="px-2 py-3 md:p-8 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg rounded-xl md:rounded-2xl">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-3 md:mb-6">
                <h2 className="text-lg md:text-2xl font-bold text-gray-900 dark:text-white mb-3 md:mb-0">
                  Day-by-Day Itinerary
                </h2>
                {trip.itinerary && 
                 ((trip.itinerary.days && trip.itinerary.days.length > 0) || 
                  (trip.itinerary.dailyPlans && trip.itinerary.dailyPlans.length > 0)) && (
                  <button
                    onClick={handleOptimizeRoute}
                    disabled={optimizingRoute}
                    className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold px-4 py-2 rounded-lg transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FaRoute className="h-4 w-4" />
                    <span>{optimizingRoute ? "Optimizing..." : "Optimize Route"}</span>
                  </button>
                )}
              </div>

              {/* Smart Budget Breakdown */}
              {trip.itinerary && (trip.itinerary.days || trip.itinerary.dailyPlans) && (
                <div className="mb-6">
                  <SmartBudgetBreakdown 
                    itinerary={trip.itinerary}
                    onUpdateBreakdown={(updated) => {
                      console.log('Budget breakdown updated:', updated);
                    }}
                  />
                </div>
              )}

              {/* Editable Itinerary */}
              {trip.itinerary && (trip.itinerary.days || trip.itinerary.dailyPlans) && (
                <div className="mb-6">
                  <EditableItinerary
                    itinerary={trip.itinerary}
                    onUpdate={async (updatedItinerary) => {
                      try {
                        await tripAPI.updateTrip(id, { itinerary: updatedItinerary });
                        toast.success('Itinerary updated successfully');
                      } catch (error) {
                        console.error('Error updating itinerary:', error);
                        toast.error('Failed to update itinerary');
                      }
                    }}
                  />
                </div>
              )}

              {/* Optimized Route Display */}
              {optimizedRoute && (
                <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-2 mb-3">
                    <FaCheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                    <h3 className="font-bold text-gray-900 dark:text-white">
                      Optimized Route
                    </h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="bg-white dark:bg-gray-800 p-3 rounded-lg">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total Distance</p>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">
                        {(optimizedRoute.totalDistance / 1000).toFixed(2)} km
                      </p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-3 rounded-lg">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total Time</p>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">
                        {optimizedRoute.totalDuration ? Math.round(optimizedRoute.totalDuration / 60) : 0} min
                      </p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-3 rounded-lg">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Time Saved</p>
                      <p className="text-lg font-bold text-green-600 dark:text-green-400">
                        {optimizedRoute.timeSaved || 0} min
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Suggested Order:</p>
                    {optimizedRoute.orderedWaypoints?.map((waypoint, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 p-2 rounded-lg"
                      >
                        <span className="flex-shrink-0 w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                          {index + 1}
                        </span>
                        <span className="flex-1">{waypoint.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {trip.itinerary &&
              (trip.itinerary.days || trip.itinerary.dailyPlans) ? (
                <div className="space-y-4">
                  {(trip.itinerary.days || trip.itinerary.dailyPlans).map(
                    (day, index) => (
                      <div
                        key={index}
                        className="p-2 md:p-5 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl border border-gray-200/50 dark:border-gray-700/50"
                      >
                        <div className="flex items-start mb-2 md:mb-3">
                          <div className="flex-shrink-0 w-8 h-8 md:w-12 md:h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-sm md:text-base mr-3 md:mr-4">
                            {day.day}
                          </div>
                          <div className="flex-1">
                            <div className="mb-2 md:mb-3">
                              <h3 className="text-sm md:text-xl font-bold text-gray-900 dark:text-white inline">
                                Day {day.day}:{" "}
                              </h3>
                              <span className="text-sm md:text-lg font-semibold text-gray-700 dark:text-gray-300">
                                {day.title ||
                                  day.theme ||
                                  day.activities?.[0]?.activity ||
                                  "Activities planned"}
                              </span>
                            </div>
                            <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                              {day.date && (typeof day.date === 'string' || typeof day.date === 'number') && (
                                <span>
                                  {new Date(day.date).toLocaleDateString(
                                    "en-US",
                                    {
                                      weekday: "long",
                                      month: "long",
                                      day: "numeric",
                                      year: "numeric",
                                    }
                                  )}
                                </span>
                              )}
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200">
                                {day.activities?.length || 0} activities
                              </span>
                            </p>
                            {day.activities && day.activities.length > 0 && (
                              <div className="mt-4 space-y-2">
                                {day.activities.map((activity, actIdx) => (
                                  <div
                                    key={actIdx}
                                    className="flex items-start text-sm text-gray-700 dark:text-gray-300 pl-2 md:pl-4 border-l-2 border-purple-200 dark:border-purple-800"
                                  >
                                    <FaMapMarkerAlt className="mr-2 mt-1 text-purple-600 flex-shrink-0" />
                                    <span>
                                      {activity.time && typeof activity.time === 'string' && (
                                        <strong>{activity.time}:</strong>
                                      )}{" "}
                                      {activity.activity ||
                                        activity.title ||
                                        activity.name}
                                      {activity.location?.name &&
                                        ` at ${activity.location.name}`}
                                      {activity.description && typeof activity.description === 'string' && (
                                        <span className="hidden md:block text-xs text-gray-500 dark:text-gray-400 mt-1">
                                          {activity.description}
                                        </span>
                                      )}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  )}
                </div>
              ) : (
                <div className="text-center py-6 md:py-12">
                  <FaMapMarkedAlt className="h-12 w-12 md:h-16 md:w-16 mx-auto text-gray-300 mb-3 md:mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">
                    No detailed itinerary available for this trip yet.
                  </p>
                </div>
              )}
            </Card>
          )}

          {activeTab === "details" && (
            <div className="space-y-6">
              <Card className="hidden md:block p-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg rounded-2xl">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                  Trip Preferences
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {trip.preferences?.travelStyle && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
                        Travel Style
                      </h3>
                      <p className="text-lg text-gray-900 dark:text-white capitalize">
                        {trip.preferences.travelStyle}
                      </p>
                    </div>
                  )}
                  {trip.preferences?.accommodation && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
                        Accommodation
                      </h3>
                      <p className="text-lg text-gray-900 dark:text-white capitalize">
                        {trip.preferences.accommodation}
                      </p>
                    </div>
                  )}
                  {trip.preferences?.transport &&
                    trip.preferences.transport.length > 0 && (
                      <div>
                        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
                          Transportation
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {trip.preferences.transport.map((mode, idx) => (
                            <span
                              key={idx}
                              className="px-3 py-1 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-full text-sm font-medium text-gray-800 dark:text-gray-200 capitalize"
                            >
                              {mode}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  {trip.preferences?.interests &&
                    trip.preferences.interests.length > 0 && (
                      <div>
                        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
                          Interests
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {trip.preferences.interests.map((interest, idx) => (
                            <span
                              key={idx}
                              className="px-3 py-1 bg-gradient-to-r from-pink-100 to-purple-100 dark:from-pink-900/30 dark:to-purple-900/30 rounded-full text-sm font-medium text-gray-800 dark:text-gray-200 capitalize"
                            >
                              {interest}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                </div>
              </Card>

              {(trip.itinerary?.summary || trip.preferences) && (
                <Card className="p-3 md:p-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg rounded-xl md:rounded-2xl">
                  {trip.itinerary?.summary && (
                    <>
                      <h2 className="text-lg md:text-2xl font-bold text-gray-900 dark:text-white mb-3 md:mb-4">
                        Trip Summary
                      </h2>
                      <p className="text-sm md:text-base text-gray-700 dark:text-gray-300 leading-relaxed">
                        {trip.itinerary.summary}
                      </p>
                    </>
                  )}

                  {/* Mobile Preferences Integration */}
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 md:hidden">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">
                      Trip Preferences
                    </h3>
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        {trip.preferences?.travelStyle && (
                          <div>
                            <div className="text-[10px] uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
                              Travel Style
                            </div>
                            <div className="text-sm font-semibold text-gray-900 dark:text-white capitalize">
                              {trip.preferences.travelStyle}
                            </div>
                          </div>
                        )}
                        {trip.preferences?.accommodation && (
                          <div>
                            <div className="text-[10px] uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
                              Accommodation
                            </div>
                            <div className="text-sm font-semibold text-gray-900 dark:text-white capitalize">
                              {trip.preferences.accommodation}
                            </div>
                          </div>
                        )}
                        {trip.preferences?.transport &&
                          trip.preferences.transport.length > 0 && (
                            <div>
                              <div className="text-[10px] uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
                                Transportation
                              </div>
                              <div className="text-sm font-semibold text-gray-900 dark:text-white capitalize">
                                {trip.preferences.transport.join(", ")}
                              </div>
                            </div>
                          )}
                      </div>
                        
                      {trip.preferences?.interests &&
                        trip.preferences.interests.length > 0 && (
                          <div>
                            <div className="text-[10px] uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
                              Interests
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {trip.preferences.interests.map((interest, idx) => (
                                <span
                                  key={idx}
                                  className="px-2.5 py-1 bg-gradient-to-r from-pink-100 to-purple-100 dark:from-pink-900/30 dark:to-purple-900/30 rounded-full text-[10px] font-semibold text-gray-800 dark:text-gray-200 capitalize"
                                >
                                  {interest}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                    </div>
                  </div>
                </Card>
              )}

              {trip.itinerary?.recommendations && (
                <Card className="px-2 py-3 md:p-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg rounded-xl md:rounded-2xl">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    Recommendations
                  </h2>
                  <div className="space-y-4">
                    {trip.itinerary.recommendations.weather && (
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                          Weather Tips
                        </h3>
                        <p className="text-gray-700 dark:text-gray-300">
                          {trip.itinerary.recommendations.weather}
                        </p>
                      </div>
                    )}
                    {trip.itinerary.recommendations.localTips && (
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                          Local Tips
                        </h3>
                        <p className="text-gray-700 dark:text-gray-300">
                          {trip.itinerary.recommendations.localTips}
                        </p>
                      </div>
                    )}
                    {trip.itinerary.recommendations.budgetTips && (
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                          Budget Tips
                        </h3>
                        <p className="text-gray-700 dark:text-gray-300">
                          {trip.itinerary.recommendations.budgetTips}
                        </p>
                      </div>
                    )}
                    {trip.itinerary.recommendations.safetyTips && (
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                          Safety Tips
                        </h3>
                        <p className="text-gray-700 dark:text-gray-300">
                          {trip.itinerary.recommendations.safetyTips}
                        </p>
                      </div>
                    )}
                  </div>
                </Card>
              )}

              {trip.specialRequests && typeof trip.specialRequests === 'string' && (
                <Card className="px-2 py-3 md:p-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg rounded-xl md:rounded-2xl">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    Special Requests
                  </h2>
                  <p className="text-gray-700 dark:text-gray-300">
                    {trip.specialRequests}
                  </p>
                </Card>
              )}

              {trip.notes && typeof trip.notes === 'string' && (
                <Card className="px-2 py-3 md:p-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg rounded-xl md:rounded-2xl">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    Notes
                  </h2>
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {trip.notes}
                  </p>
                </Card>
              )}
            </div>
          )}
        </motion.div>

        {/* Booking Modal */}
        <BookingModal
          isOpen={showBookingModal}
          onClose={() => setShowBookingModal(false)}
          bookingType="package"
          placeDetails={{
            name: `${trip?.destination?.city || trip?.destination || trip?.title} Trip Package`,
            description: trip?.description || `Complete trip package to ${trip?.destination?.city || trip?.destination || trip?.title}`,
            address: trip?.destination?.city || trip?.destination || '',
            city: trip?.destination?.city || trip?.destination || '',
            country: trip?.destination?.country || 'India',
            basePrice: trip?.itinerary?.totalCost?.amount || trip?.itinerary?.totalEstimatedCost?.amount || trip?.preferences?.budget?.max || trip?.preferences?.budget?.min || 0,
            rating: 4.5,
            phone: '',
            email: '',
            coordinates: { lat: 0, lng: 0 },
          }}
          defaultFormData={{
            checkInDate: trip?.startDate ? new Date(trip.startDate).toISOString().split('T')[0] : '',
            checkOutDate: trip?.endDate ? new Date(trip.endDate).toISOString().split('T')[0] : '',
            numberOfGuests: trip?.travelers || 2,
            adults: trip?.travelers || 2,
            children: 0,
            infants: 0,
          }}
        />
      </div>
    </div>
  );
};

export default TripDetail;
