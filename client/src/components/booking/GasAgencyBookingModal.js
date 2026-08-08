import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import {
  FaTimes,
  FaFire,
  FaCalendar,
  FaMapMarkerAlt,
  FaPhone,
  FaUser,
  FaEnvelope,
  FaRupeeSign,
  FaCreditCard,
  FaMobileAlt,
  FaUniversity,
  FaWallet,
  FaLock,
  FaCheckCircle,
  FaArrowLeft,
  FaFileInvoice,
  FaReceipt,
  FaDownload,
} from 'react-icons/fa';
import axios from 'axios';

const GasAgencyBookingModal = ({ isOpen, onClose, agencyDetails = {} }) => {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Cylinder Selection, 2: Details, 3: Payment, 4: Confirmation
  const [paymentMethod, setPaymentMethod] = useState('');
  const [processingPayment, setProcessingPayment] = useState(false);
  const [bookingConfirmation, setBookingConfirmation] = useState(null);
  
  const [formData, setFormData] = useState({
    customerName: '',
    email: '',
    phone: '',
    deliveryAddress: '',
    city: '',
    pincode: '',
    landmark: '',
    deliveryDate: '',
    deliveryTime: 'morning', // morning, afternoon, evening
    provider: '', // Gas provider
    cylinderType: '',
    quantity: 1,
    connectionType: 'new', // new, refill, transfer
    connectionNumber: '',
    specialInstructions: '',
  });

  // Gas providers
  const gasProviders = [
    {
      id: 'indane',
      name: 'Indane',
      fullName: 'Indane (IndianOil)',
      description: 'Indian Oil Corporation',
      icon: '🔵',
      color: 'blue',
    },
    {
      id: 'bharat',
      name: 'Bharat Gas',
      fullName: 'Bharat Gas (BPCL)',
      description: 'Bharat Petroleum Corporation Limited',
      icon: '🔴',
      color: 'red',
    },
    {
      id: 'hp',
      name: 'HP Gas',
      fullName: 'HP Gas (Hindustan Petroleum)',
      description: 'Hindustan Petroleum Corporation',
      icon: '🟢',
      color: 'green',
    },
    {
      id: 'jyothi',
      name: 'Jyothi Gas',
      fullName: 'Jyothi Gas',
      description: 'Jyothi Gas Private Limited',
      icon: '🟡',
      color: 'yellow',
    },
    {
      id: 'essar',
      name: 'Essar Gas',
      fullName: 'Essar Gas',
      description: 'Essar Oil Limited',
      icon: '🟠',
      color: 'orange',
    },
  ];

  // Cylinder types with pricing
  const cylinderTypes = [
    {
      id: 'domestic_14_2',
      name: 'Domestic LPG (14.2 kg)',
      description: 'Standard household cylinder',
      price: 903,
      refillPrice: 803,
      deposit: 1500,
      features: ['Subsidized Rate', 'Delivery in 2-3 days', 'Installation Support'],
      icon: '🔥',
    },
    {
      id: 'domestic_19',
      name: 'Commercial LPG (19 kg)',
      description: 'For commercial establishments',
      price: 2253,
      refillPrice: 2153,
      deposit: 2500,
      features: ['Non-Subsidized', 'Same Day Delivery', 'Installation Support'],
      icon: '🏪',
    },
    {
      id: 'domestic_5',
      name: 'Small LPG (5 kg)',
      description: 'Compact cylinder for small kitchens',
      price: 453,
      refillPrice: 353,
      deposit: 1000,
      features: ['Portable', 'Delivery in 1-2 days', 'Easy to Handle'],
      icon: '⚡',
    },
  ];

  // Payment methods
  const paymentMethods = [
    {
      id: 'card',
      name: 'Credit/Debit Card',
      icon: <FaCreditCard className="h-6 w-6" />,
      description: 'Visa, Mastercard, Rupay',
    },
    {
      id: 'upi',
      name: 'UPI Payment',
      icon: <FaMobileAlt className="h-6 w-6" />,
      description: 'Google Pay, PhonePe, Paytm',
    },
    {
      id: 'netbanking',
      name: 'Net Banking',
      icon: <FaUniversity className="h-6 w-6" />,
      description: 'All major banks',
    },
    {
      id: 'wallet',
      name: 'Digital Wallet',
      icon: <FaWallet className="h-6 w-6" />,
      description: 'Paytm, Amazon Pay, etc.',
    },
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCylinderSelect = (cylinderId) => {
    setFormData((prev) => ({
      ...prev,
      cylinderType: cylinderId,
    }));
  };

  const handleProviderSelect = (providerId) => {
    setFormData((prev) => ({
      ...prev,
      provider: providerId,
    }));
  };

  const calculateTotal = () => {
    if (!formData.cylinderType) return 0;
    
    const selectedCylinder = cylinderTypes.find((c) => c.id === formData.cylinderType);
    if (!selectedCylinder) return 0;

    const isRefill = formData.connectionType === 'refill';
    const basePrice = isRefill ? selectedCylinder.refillPrice : selectedCylinder.price;
    const deposit = isRefill ? 0 : selectedCylinder.deposit;
    const deliveryCharges = 50;
    const gst = ((basePrice * formData.quantity) + deliveryCharges) * 0.05; // 5% GST

    return {
      basePrice: basePrice * formData.quantity,
      deposit,
      deliveryCharges,
      gst: Math.round(gst),
      total: Math.round((basePrice * formData.quantity) + deposit + deliveryCharges + gst),
    };
  };

  const validateStep = () => {
    if (step === 1) {
      if (!formData.provider) {
        toast.error('Please select a gas provider');
        return false;
      }
      if (!formData.cylinderType) {
        toast.error('Please select a cylinder type');
        return false;
      }
      if (formData.quantity < 1) {
        toast.error('Quantity must be at least 1');
        return false;
      }
      return true;
    }

    if (step === 2) {
      if (!formData.customerName.trim()) {
        toast.error('Please enter your name');
        return false;
      }
      if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        toast.error('Please enter a valid email');
        return false;
      }
      if (!formData.phone.trim() || !/^\d{10}$/.test(formData.phone)) {
        toast.error('Please enter a valid 10-digit phone number');
        return false;
      }
      if (!formData.deliveryAddress.trim()) {
        toast.error('Please enter delivery address');
        return false;
      }
      if (!formData.city.trim()) {
        toast.error('Please enter city');
        return false;
      }
      if (!formData.pincode.trim() || !/^\d{6}$/.test(formData.pincode)) {
        toast.error('Please enter a valid 6-digit pincode');
        return false;
      }
      if (!formData.deliveryDate) {
        toast.error('Please select a delivery date');
        return false;
      }
      if (formData.connectionType === 'refill' && !formData.connectionNumber.trim()) {
        toast.error('Please enter your connection number for refill');
        return false;
      }
      return true;
    }

    if (step === 3) {
      if (!paymentMethod) {
        toast.error('Please select a payment method');
        return false;
      }
      return true;
    }

    return true;
  };

  const handleNext = () => {
    if (validateStep()) {
      setStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setStep((prev) => prev - 1);
  };

  const processPayment = async () => {
    setProcessingPayment(true);
    
    try {
      const pricingDetails = calculateTotal();
      const selectedCylinder = cylinderTypes.find((c) => c.id === formData.cylinderType);

      // Simulate payment processing (dummy gateway)
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Create booking with backend
      const bookingData = {
        bookingType: 'gas_agency',
        agencyDetails: {
          name: agencyDetails.name || 'Gas Agency',
          address: agencyDetails.address || '',
        },
        customerDetails: {
          name: formData.customerName,
          email: formData.email,
          phone: formData.phone,
          deliveryAddress: formData.deliveryAddress,
          city: formData.city,
          pincode: formData.pincode,
          landmark: formData.landmark,
        },
        orderDetails: {
          cylinderType: selectedCylinder.name,
          cylinderId: selectedCylinder.id,
          quantity: formData.quantity,
          connectionType: formData.connectionType,
          connectionNumber: formData.connectionNumber,
          deliveryDate: formData.deliveryDate,
          deliveryTime: formData.deliveryTime,
          specialInstructions: formData.specialInstructions,
        },
        pricing: {
          basePrice: pricingDetails.basePrice,
          deposit: pricingDetails.deposit,
          deliveryCharges: pricingDetails.deliveryCharges,
          gst: pricingDetails.gst,
          totalPrice: pricingDetails.total,
        },
        payment: {
          method: paymentMethod,
          status: 'completed',
          transactionId: `TXN${Date.now()}${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
          paidAt: new Date(),
        },
      };

      const token = localStorage.getItem('authToken');
      const response = await axios.post(
        'http://localhost:5000/api/gas-agency/book',
        bookingData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      setBookingConfirmation(response.data);
      setStep(4);
      toast.success('Booking confirmed! Check your email for details.');
    } catch (error) {
      console.error('Payment error:', error);
      toast.error(error.response?.data?.message || 'Payment failed. Please try again.');
    } finally {
      setProcessingPayment(false);
    }
  };

  const downloadInvoice = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.get(
        `http://localhost:5000/api/gas-agency/invoice/${bookingConfirmation.booking._id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          responseType: 'blob',
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice_${bookingConfirmation.booking.bookingReference}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Invoice downloaded successfully');
    } catch (error) {
      console.error('Invoice download error:', error);
      toast.error('Failed to download invoice');
    }
  };

  const downloadReceipt = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.get(
        `http://localhost:5000/api/gas-agency/receipt/${bookingConfirmation.booking._id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          responseType: 'blob',
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `receipt_${bookingConfirmation.booking.bookingReference}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Receipt downloaded successfully');
    } catch (error) {
      console.error('Receipt download error:', error);
      toast.error('Failed to download receipt');
    }
  };

  const handleClose = () => {
    setStep(1);
    setPaymentMethod('');
    setFormData({
      customerName: '',
      email: '',
      phone: '',
      deliveryAddress: '',
      city: '',
      pincode: '',
      landmark: '',
      deliveryDate: '',
      deliveryTime: 'morning',
      provider: '',
      cylinderType: '',
      quantity: 1,
      connectionType: 'new',
      connectionNumber: '',
      specialInstructions: '',
    });
    setBookingConfirmation(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
        onClick={handleClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-orange-500 to-red-600 p-6 relative">
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
            >
              <FaTimes className="h-5 w-5 text-white" />
            </button>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                <FaFire className="h-8 w-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Book Gas Cylinder</h2>
                <p className="text-white/90 text-sm">
                  {agencyDetails.name || 'Gas Agency'} - Fast & Safe Delivery
                </p>
              </div>
            </div>

            {/* Progress Steps */}
            <div className="flex items-center justify-center gap-2 mt-6">
              {[1, 2, 3, 4].map((s) => (
                <div key={s} className="flex items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
                      step >= s
                        ? 'bg-white text-orange-600'
                        : 'bg-white/20 text-white/60'
                    }`}
                  >
                    {step > s ? <FaCheckCircle className="h-5 w-5" /> : s}
                  </div>
                  {s < 4 && (
                    <div
                      className={`w-12 h-1 transition-all ${
                        step > s ? 'bg-white' : 'bg-white/20'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
            {/* Step 1: Provider & Cylinder Selection */}
            {step === 1 && (
              <div className="space-y-6">
                {/* Provider Selection */}
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <span className="text-2xl">⛽</span>
                    Select Gas Provider
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {gasProviders.map((provider) => {
                      const isSelected = formData.provider === provider.id;
                      const colorClasses = {
                        blue: {
                          border: 'border-blue-500',
                          bg: 'bg-blue-50 dark:bg-blue-900/20',
                          checkBg: 'bg-blue-500'
                        },
                        red: {
                          border: 'border-red-500',
                          bg: 'bg-red-50 dark:bg-red-900/20',
                          checkBg: 'bg-red-500'
                        },
                        green: {
                          border: 'border-green-500',
                          bg: 'bg-green-50 dark:bg-green-900/20',
                          checkBg: 'bg-green-500'
                        },
                        yellow: {
                          border: 'border-yellow-500',
                          bg: 'bg-yellow-50 dark:bg-yellow-900/20',
                          checkBg: 'bg-yellow-500'
                        },
                        orange: {
                          border: 'border-orange-500',
                          bg: 'bg-orange-50 dark:bg-orange-900/20',
                          checkBg: 'bg-orange-500'
                        }
                      };
                      const colors = colorClasses[provider.color];
                      
                      return (
                        <motion.div
                          key={provider.id}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleProviderSelect(provider.id)}
                          className={`relative p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                            isSelected
                              ? `${colors.border} ${colors.bg}`
                              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                          }`}
                        >
                          {isSelected && (
                            <div className={`absolute top-2 right-2 w-6 h-6 ${colors.checkBg} rounded-full flex items-center justify-center`}>
                              <FaCheckCircle className="h-4 w-4 text-white" />
                            </div>
                          )}
                          <div className="text-center">
                            <div className="text-3xl mb-2">{provider.icon}</div>
                            <div className="font-bold text-gray-900 dark:text-white text-sm">
                              {provider.name}
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                              {provider.description}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>

                {/* Cylinder Selection */}
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                    Select Cylinder Type
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {cylinderTypes.map((cylinder) => (
                      <motion.div
                        key={cylinder.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleCylinderSelect(cylinder.id)}
                        className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                          formData.cylinderType === cylinder.id
                            ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                            : 'border-gray-200 dark:border-gray-600 hover:border-orange-300'
                        }`}
                      >
                        <div className="text-4xl mb-2">{cylinder.icon}</div>
                        <h4 className="font-bold text-gray-900 dark:text-white mb-1">
                          {cylinder.name}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                          {cylinder.description}
                        </p>
                        <div className="space-y-1 mb-3">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-400">New:</span>
                            <span className="font-bold text-gray-900 dark:text-white">
                              ₹{cylinder.price}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-400">Refill:</span>
                            <span className="font-bold text-gray-900 dark:text-white">
                              ₹{cylinder.refillPrice}
                            </span>
                          </div>
                        </div>
                        <div className="space-y-1">
                          {cylinder.features.map((feature, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                              <FaCheckCircle className="h-3 w-3 text-green-500" />
                              {feature}
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                      Connection Type
                    </label>
                    <select
                      name="connectionType"
                      value={formData.connectionType}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="new">New Connection</option>
                      <option value="refill">Refill</option>
                      <option value="transfer">Transfer Connection</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                      Quantity
                    </label>
                    <input
                      type="number"
                      name="quantity"
                      value={formData.quantity}
                      onChange={handleInputChange}
                      min="1"
                      max="10"
                      className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                {formData.connectionType === 'refill' && (
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                      Connection Number
                    </label>
                    <input
                      type="text"
                      name="connectionNumber"
                      value={formData.connectionNumber}
                      onChange={handleInputChange}
                      placeholder="Enter your LPG connection number"
                      className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Customer Details */}
            {step === 2 && (
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  Delivery Details
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                      <FaUser className="h-4 w-4" />
                      Full Name
                    </label>
                    <input
                      type="text"
                      name="customerName"
                      value={formData.customerName}
                      onChange={handleInputChange}
                      placeholder="Enter your full name"
                      className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                      <FaPhone className="h-4 w-4" />
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="10-digit mobile number"
                      maxLength="10"
                      className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                      <FaEnvelope className="h-4 w-4" />
                      Email Address
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="your.email@example.com"
                      className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                      <FaMapMarkerAlt className="h-4 w-4" />
                      Delivery Address
                    </label>
                    <textarea
                      name="deliveryAddress"
                      value={formData.deliveryAddress}
                      onChange={handleInputChange}
                      placeholder="Enter complete address"
                      rows="3"
                      className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                      City
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      placeholder="Enter city"
                      className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                      Pincode
                    </label>
                    <input
                      type="text"
                      name="pincode"
                      value={formData.pincode}
                      onChange={handleInputChange}
                      placeholder="6-digit pincode"
                      maxLength="6"
                      className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                      Landmark (Optional)
                    </label>
                    <input
                      type="text"
                      name="landmark"
                      value={formData.landmark}
                      onChange={handleInputChange}
                      placeholder="Nearby landmark for easy location"
                      className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                      <FaCalendar className="h-4 w-4" />
                      Delivery Date
                    </label>
                    <input
                      type="date"
                      name="deliveryDate"
                      value={formData.deliveryDate}
                      onChange={handleInputChange}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                      Preferred Time
                    </label>
                    <select
                      name="deliveryTime"
                      value={formData.deliveryTime}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="morning">Morning (9 AM - 12 PM)</option>
                      <option value="afternoon">Afternoon (12 PM - 3 PM)</option>
                      <option value="evening">Evening (3 PM - 6 PM)</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                      Special Instructions (Optional)
                    </label>
                    <textarea
                      name="specialInstructions"
                      value={formData.specialInstructions}
                      onChange={handleInputChange}
                      placeholder="Any special instructions for delivery"
                      rows="2"
                      className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Payment */}
            {step === 3 && (
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  Payment Details
                </h3>

                {/* Order Summary */}
                <div className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-gray-700 dark:to-gray-700 p-6 rounded-2xl">
                  <h4 className="font-bold text-gray-900 dark:text-white mb-4">Order Summary</h4>
                  {(() => {
                    const pricingDetails = calculateTotal();
                    const selectedCylinder = cylinderTypes.find((c) => c.id === formData.cylinderType);
                    
                    return (
                      <div className="space-y-3">
                        <div className="flex justify-between text-gray-700 dark:text-gray-300">
                          <span>
                            {selectedCylinder?.name} x {formData.quantity}
                          </span>
                          <span className="font-semibold">₹{pricingDetails.basePrice}</span>
                        </div>
                        {pricingDetails.deposit > 0 && (
                          <div className="flex justify-between text-gray-700 dark:text-gray-300">
                            <span>Security Deposit</span>
                            <span className="font-semibold">₹{pricingDetails.deposit}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-gray-700 dark:text-gray-300">
                          <span>Delivery Charges</span>
                          <span className="font-semibold">₹{pricingDetails.deliveryCharges}</span>
                        </div>
                        <div className="flex justify-between text-gray-700 dark:text-gray-300">
                          <span>GST (5%)</span>
                          <span className="font-semibold">₹{pricingDetails.gst}</span>
                        </div>
                        <div className="border-t-2 border-gray-300 dark:border-gray-600 pt-3 flex justify-between text-lg font-bold text-gray-900 dark:text-white">
                          <span>Total Amount</span>
                          <span className="text-orange-600">₹{pricingDetails.total}</span>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Payment Methods */}
                <div>
                  <h4 className="font-bold text-gray-900 dark:text-white mb-4">Select Payment Method</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {paymentMethods.map((method) => (
                      <motion.div
                        key={method.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setPaymentMethod(method.id)}
                        className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                          paymentMethod === method.id
                            ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                            : 'border-gray-200 dark:border-gray-600 hover:border-orange-300'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className="text-orange-600">{method.icon}</div>
                          <div>
                            <h5 className="font-bold text-gray-900 dark:text-white">{method.name}</h5>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {method.description}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Dummy Payment Form */}
                {paymentMethod === 'card' && (
                  <div className="space-y-4 bg-gray-50 dark:bg-gray-700 p-6 rounded-2xl">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                        <FaCreditCard className="inline h-4 w-4 mr-2" />
                        Card Number
                      </label>
                      <input
                        type="text"
                        placeholder="1234 5678 9012 3456"
                        maxLength="19"
                        className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                          Expiry Date
                        </label>
                        <input
                          type="text"
                          placeholder="MM/YY"
                          maxLength="5"
                          className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                          <FaLock className="inline h-4 w-4 mr-2" />
                          CVV
                        </label>
                        <input
                          type="password"
                          placeholder="123"
                          maxLength="3"
                          className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {paymentMethod === 'upi' && (
                  <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-2xl">
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                      <FaMobileAlt className="inline h-4 w-4 mr-2" />
                      UPI ID
                    </label>
                    <input
                      type="text"
                      placeholder="yourupi@provider"
                      className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                  </div>
                )}

                {paymentMethod === 'netbanking' && (
                  <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-2xl">
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                      <FaUniversity className="inline h-4 w-4 mr-2" />
                      Select Bank
                    </label>
                    <select className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                      <option value="">Choose your bank</option>
                      <option value="sbi">State Bank of India</option>
                      <option value="hdfc">HDFC Bank</option>
                      <option value="icici">ICICI Bank</option>
                      <option value="axis">Axis Bank</option>
                      <option value="pnb">Punjab National Bank</option>
                    </select>
                  </div>
                )}

                {paymentMethod === 'wallet' && (
                  <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-2xl">
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                      <FaWallet className="inline h-4 w-4 mr-2" />
                      Select Wallet
                    </label>
                    <select className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                      <option value="">Choose wallet</option>
                      <option value="paytm">Paytm</option>
                      <option value="amazonpay">Amazon Pay</option>
                      <option value="mobikwik">MobiKwik</option>
                      <option value="freecharge">FreeCharge</option>
                    </select>
                  </div>
                )}

                <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                  <FaLock className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      Secure Payment
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Your payment information is encrypted and secure. This is a dummy payment gateway for demonstration purposes.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Confirmation */}
            {step === 4 && bookingConfirmation && (
              <div className="space-y-6 text-center">
                <div className="flex justify-center">
                  <div className="p-6 bg-green-100 dark:bg-green-900/30 rounded-full">
                    <FaCheckCircle className="h-16 w-16 text-green-600" />
                  </div>
                </div>

                <div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Booking Confirmed!
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Your gas cylinder booking has been confirmed successfully.
                  </p>
                </div>

                <div className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-gray-700 dark:to-gray-700 p-6 rounded-2xl">
                  <div className="grid grid-cols-2 gap-4 text-left">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Booking Reference</p>
                      <p className="font-bold text-gray-900 dark:text-white">
                        {bookingConfirmation.booking.bookingReference}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Transaction ID</p>
                      <p className="font-bold text-gray-900 dark:text-white">
                        {bookingConfirmation.booking.payment.transactionId}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Delivery Date</p>
                      <p className="font-bold text-gray-900 dark:text-white">
                        {new Date(formData.deliveryDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Total Paid</p>
                      <p className="font-bold text-orange-600 text-lg">
                        ₹{bookingConfirmation.booking.pricing.totalPrice}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    📧 A confirmation email with invoice and receipt has been sent to{' '}
                    <span className="font-bold">{formData.email}</span>
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={downloadInvoice}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg"
                  >
                    <FaFileInvoice className="h-5 w-5" />
                    Download Invoice
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={downloadReceipt}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white font-bold rounded-xl hover:from-green-700 hover:to-green-800 transition-all shadow-lg"
                  >
                    <FaReceipt className="h-5 w-5" />
                    Download Receipt
                  </motion.button>
                </div>
              </div>
            )}
          </div>

          {/* Footer - Navigation Buttons */}
          {step < 4 && (
            <div className="p-6 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600 flex justify-between gap-4">
              {step > 1 && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleBack}
                  className="flex items-center gap-2 px-6 py-3 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-white font-bold rounded-xl hover:bg-gray-300 dark:hover:bg-gray-500 transition-all"
                >
                  <FaArrowLeft className="h-4 w-4" />
                  Back
                </motion.button>
              )}

              {step < 3 && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleNext}
                  disabled={loading}
                  className="flex-1 ml-auto px-6 py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white font-bold rounded-xl hover:from-orange-600 hover:to-red-700 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continue
                </motion.button>
              )}

              {step === 3 && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={processPayment}
                  disabled={processingPayment}
                  className="flex-1 ml-auto flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white font-bold rounded-xl hover:from-green-700 hover:to-green-800 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {processingPayment ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <FaLock className="h-4 w-4" />
                      Pay ₹{calculateTotal().total}
                    </>
                  )}
                </motion.button>
              )}
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default GasAgencyBookingModal;
