import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import {
  FaTimes,
  FaCalendar,
  FaUser,
  FaEnvelope,
  FaPhone,
  FaCreditCard,
  FaMobileAlt,
  FaUniversity,
  FaWallet,
  FaCheckCircle,
  FaArrowLeft,
  FaFileInvoice,
  FaReceipt,
  FaPrescription,
} from 'react-icons/fa';
import api from '../../services/api';

const PharmacyBookingModal = ({ isOpen, onClose, pharmacyDetails = {} }) => {
  const [step, setStep] = useState(1); // 1: Service Selection, 2: Details, 3: Payment, 4: Confirmation
  const [paymentMethod, setPaymentMethod] = useState('');
  const [processingPayment, setProcessingPayment] = useState(false);
  const [bookingConfirmation, setBookingConfirmation] = useState(null);
  
  const [formData, setFormData] = useState({
    customerName: '',
    email: '',
    phone: '',
    age: '',
    pickupDate: '',
    pickupTime: 'morning',
    serviceType: '',
    itemDescription: '',
    quantity: 1,
    prescriptionRequired: false,
    prescriptionImage: '',
    specialInstructions: '',
  });

  // Pharmacy service types with pricing
  const serviceTypes = [
    {
      id: 'prescription_medicine',
      name: 'Prescription Medicines',
      description: 'Medicines requiring doctor\'s prescription',
      price: 500,
      features: ['Original Prescription Required', 'Verified Medicines', 'Expert Guidance'],
      icon: '💊',
      requiresPrescription: true,
    },
    {
      id: 'otc_medicine',
      name: 'Over-the-Counter Medicines',
      description: 'Medicines available without prescription',
      price: 200,
      features: ['No Prescription Needed', 'Quality Assured', 'Usage Instructions'],
      icon: '🏥',
      requiresPrescription: false,
    },
    {
      id: 'health_supplements',
      name: 'Health Supplements',
      description: 'Vitamins, minerals, and dietary supplements',
      price: 800,
      features: ['Genuine Products', 'Expert Consultation', 'Usage Guidelines'],
      icon: '💪',
      requiresPrescription: false,
    },
    {
      id: 'medical_equipment',
      name: 'Medical Equipment',
      description: 'Medical devices and healthcare equipment',
      price: 1500,
      features: ['Certified Equipment', 'Warranty Available', 'Usage Demo'],
      icon: '🩺',
      requiresPrescription: false,
    },
    {
      id: 'personal_care',
      name: 'Personal Care',
      description: 'Healthcare and hygiene products',
      price: 300,
      features: ['Trusted Brands', 'Quality Products', 'Wide Range'],
      icon: '🧴',
      requiresPrescription: false,
    },
    {
      id: 'baby_care',
      name: 'Baby Care Products',
      description: 'Baby healthcare and hygiene essentials',
      price: 400,
      features: ['Baby Safe', 'Pediatrician Recommended', 'Gentle Formula'],
      icon: '👶',
      requiresPrescription: false,
    },
    {
      id: 'first_aid',
      name: 'First Aid Supplies',
      description: 'Emergency first aid and wound care',
      price: 350,
      features: ['Emergency Ready', 'Complete Kit Options', 'Sterile Products'],
      icon: '🚑',
      requiresPrescription: false,
    },
    {
      id: 'ayurvedic_medicine',
      name: 'Ayurvedic & Herbal',
      description: 'Natural and ayurvedic medicines',
      price: 450,
      features: ['100% Natural', 'Traditional Formula', 'No Side Effects'],
      icon: '🌿',
      requiresPrescription: false,
    },
  ];

  const handleServiceSelect = (serviceId) => {
    const selectedService = serviceTypes.find((s) => s.id === serviceId);
    setFormData({ 
      ...formData, 
      serviceType: serviceId,
      prescriptionRequired: selectedService?.requiresPrescription || false
    });
  };

  const calculateTotal = () => {
    if (!formData.serviceType) return 0;
    
    const selectedService = serviceTypes.find((s) => s.id === formData.serviceType);
    if (!selectedService) return 0;

    const basePrice = selectedService.price * (formData.quantity || 1);
    const deliveryFee = 0; // Free delivery
    const convenienceFee = 30;
    const gst = (basePrice + deliveryFee + convenienceFee) * 0.18; // 18% GST

    return {
      basePrice,
      deliveryFee,
      convenienceFee,
      gst: Math.round(gst),
      total: Math.round(basePrice + deliveryFee + convenienceFee + gst),
    };
  };

  const validateStep = () => {
    if (step === 1) {
      if (!formData.serviceType) {
        toast.error('Please select a service type');
        return false;
      }
      if (!formData.itemDescription) {
        toast.error('Please describe the item you need');
        return false;
      }
      if (!formData.quantity || formData.quantity < 1) {
        toast.error('Please enter a valid quantity');
        return false;
      }
      return true;
    }
    
    if (step === 2) {
      if (!formData.customerName || !formData.email || !formData.phone) {
        toast.error('Please fill in all required fields');
        return false;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        toast.error('Please enter a valid email address');
        return false;
      }
      if (!/^\d{10}$/.test(formData.phone.replace(/[^\d]/g, ''))) {
        toast.error('Please enter a valid 10-digit phone number');
        return false;
      }
      if (!formData.pickupDate) {
        toast.error('Please select a pickup date');
        return false;
      }
      if (!formData.pickupTime) {
        toast.error('Please select a pickup time');
        return false;
      }
      if (formData.prescriptionRequired && !formData.prescriptionImage) {
        toast.error('Please upload prescription for this medicine');
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
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handlePrescriptionUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // In a real app, you'd upload to a server
      // For now, we'll just store a placeholder
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, prescriptionImage: reader.result });
        toast.success('Prescription uploaded successfully');
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePayment = async () => {
    if (!validateStep()) return;

    setProcessingPayment(true);

    try {
      const pricing = calculateTotal();
      const selectedService = serviceTypes.find((s) => s.id === formData.serviceType);

      const bookingData = {
        pharmacyDetails: {
          name: pharmacyDetails?.name || 'Selected Pharmacy',
          address: pharmacyDetails?.address || pharmacyDetails?.display_name || 'Address not available',
          contact: pharmacyDetails?.phone || '',
        },
        customerDetails: {
          name: formData.customerName,
          email: formData.email,
          phone: formData.phone,
          age: formData.age || null,
        },
        orderDetails: {
          serviceType: formData.serviceType,
          serviceName: selectedService?.name || '',
          pickupDate: formData.pickupDate,
          pickupTime: formData.pickupTime,
          prescriptionRequired: formData.prescriptionRequired,
          prescriptionImage: formData.prescriptionImage || '',
          itemDescription: formData.itemDescription,
          quantity: formData.quantity,
          specialInstructions: formData.specialInstructions,
        },
        pricing,
        payment: {
          method: paymentMethod,
          status: 'completed',
          transactionId: `TXN${Date.now()}${Math.floor(Math.random() * 10000)}`,
          paidAt: new Date(),
        },
      };

      // Simulate payment processing
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const response = await api.post('/pharmacy/book', bookingData);

      if (response.data.success) {
        setBookingConfirmation(response.data.booking);
        setStep(4);
        toast.success('Pharmacy order confirmed! Check your email for details.');
      } else {
        throw new Error(response.data.message || 'Booking failed');
      }
    } catch (error) {
      console.error('Booking error:', error);
      toast.error(error.response?.data?.message || error.message || 'Failed to process booking');
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleClose = () => {
    setStep(1);
    setFormData({
      customerName: '',
      email: '',
      phone: '',
      age: '',
      pickupDate: '',
      pickupTime: 'morning',
      serviceType: '',
      itemDescription: '',
      quantity: 1,
      prescriptionRequired: false,
      prescriptionImage: '',
      specialInstructions: '',
    });
    setPaymentMethod('');
    setBookingConfirmation(null);
    onClose();
  };

  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', damping: 20 }}
            className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden bg-white rounded-2xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 z-10 bg-gradient-to-r from-emerald-500 to-teal-600 text-white p-6">
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-all"
              >
                <FaTimes className="text-xl" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <FaPrescription className="text-3xl" />
                <div>
                  <h2 className="text-2xl font-bold">Pharmacy Order</h2>
                  <p className="text-emerald-100 text-sm">{pharmacyDetails?.name || 'Selected Pharmacy'}</p>
                </div>
              </div>

              {/* Progress Steps */}
              <div className="flex items-center justify-between mt-6">
                {[
                  { num: 1, label: 'Service' },
                  { num: 2, label: 'Details' },
                  { num: 3, label: 'Payment' },
                  { num: 4, label: 'Confirm' },
                ].map((s, index) => (
                  <React.Fragment key={s.num}>
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
                          step >= s.num
                            ? 'bg-white text-emerald-600'
                            : 'bg-emerald-700 text-white'
                        }`}
                      >
                        {step > s.num ? <FaCheckCircle /> : s.num}
                      </div>
                      <span className="text-xs mt-2">{s.label}</span>
                    </div>
                    {index < 3 && (
                      <div
                        className={`flex-1 h-1 mx-2 rounded ${
                          step > s.num ? 'bg-white' : 'bg-emerald-700'
                        }`}
                      />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>

            {/* Content */}
            <div className="overflow-y-auto max-h-[calc(90vh-250px)] p-6">
              {/* Step 1: Service Selection */}
              {step === 1 && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-6"
                >
                  <div>
                    <h3 className="text-xl font-bold text-gray-800 mb-4">Select Service Type</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {serviceTypes.map((service) => (
                        <motion.div
                          key={service.id}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                            formData.serviceType === service.id
                              ? 'border-emerald-500 bg-emerald-50 shadow-lg'
                              : 'border-gray-200 hover:border-emerald-300 hover:shadow-md'
                          }`}
                          onClick={() => handleServiceSelect(service.id)}
                        >
                          <div className="flex items-start gap-3">
                            <div className="text-4xl">{service.icon}</div>
                            <div className="flex-1">
                              <h4 className="font-bold text-gray-800 mb-1">{service.name}</h4>
                              <p className="text-sm text-gray-600 mb-2">{service.description}</p>
                              <div className="flex items-center justify-between">
                                <span className="text-lg font-bold text-emerald-600">₹{service.price}</span>
                                {service.requiresPrescription && (
                                  <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded">
                                    Prescription Required
                                  </span>
                                )}
                              </div>
                              <ul className="mt-2 space-y-1">
                                {service.features.map((feature, idx) => (
                                  <li key={idx} className="text-xs text-gray-500 flex items-center gap-1">
                                    <span className="text-emerald-500">✓</span> {feature}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Item Description <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="itemDescription"
                        value={formData.itemDescription}
                        onChange={handleChange}
                        placeholder="e.g., Paracetamol 500mg, Blood Pressure Monitor"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Quantity <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        name="quantity"
                        min="1"
                        value={formData.quantity}
                        onChange={handleChange}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 2: Customer Details */}
              {step === 2 && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-6"
                >
                  <h3 className="text-xl font-bold text-gray-800 mb-4">Customer Information</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <FaUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          name="customerName"
                          value={formData.customerName}
                          onChange={handleChange}
                          className="w-full pl-10 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <FaEnvelope className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          className="w-full pl-10 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <FaPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          className="w-full pl-10 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Age</label>
                      <input
                        type="number"
                        name="age"
                        value={formData.age}
                        onChange={handleChange}
                        min="1"
                        max="120"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Pickup Date <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <FaCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                          type="date"
                          name="pickupDate"
                          value={formData.pickupDate}
                          onChange={handleChange}
                          min={getMinDate()}
                          className="w-full pl-10 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Pickup Time <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="pickupTime"
                        value={formData.pickupTime}
                        onChange={handleChange}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                      >
                        <option value="morning">Morning (9 AM - 12 PM)</option>
                        <option value="afternoon">Afternoon (12 PM - 4 PM)</option>
                        <option value="evening">Evening (4 PM - 8 PM)</option>
                      </select>
                    </div>
                  </div>

                  {formData.prescriptionRequired && (
                    <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded">
                      <div className="flex items-start gap-3">
                        <FaPrescription className="text-amber-600 text-xl mt-1" />
                        <div className="flex-1">
                          <h4 className="font-semibold text-amber-800 mb-2">Prescription Required</h4>
                          <p className="text-sm text-amber-700 mb-3">
                            This medication requires a valid prescription. Please upload a clear image of your prescription.
                          </p>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handlePrescriptionUpload}
                            className="text-sm"
                          />
                          {formData.prescriptionImage && (
                            <p className="text-xs text-emerald-600 mt-2 flex items-center gap-1">
                              <FaCheckCircle /> Prescription uploaded successfully
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Special Instructions
                    </label>
                    <textarea
                      name="specialInstructions"
                      value={formData.specialInstructions}
                      onChange={handleChange}
                      rows="3"
                      placeholder="Any special instructions or requirements..."
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                    />
                  </div>
                </motion.div>
              )}

              {/* Step 3: Payment */}
              {step === 3 && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-6"
                >
                  <h3 className="text-xl font-bold text-gray-800 mb-4">Payment Information</h3>

                  {/* Pricing Summary */}
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6">
                    <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                      <FaFileInvoice className="text-emerald-600" />
                      Order Summary
                    </h4>
                    <div className="space-y-3">
                      {(() => {
                        const pricing = calculateTotal();
                        const selectedService = serviceTypes.find((s) => s.id === formData.serviceType);
                        return (
                          <>
                            <div className="flex justify-between text-gray-700">
                              <span>{selectedService?.name}</span>
                              <span>₹{selectedService?.price}</span>
                            </div>
                            <div className="flex justify-between text-gray-700">
                              <span>Quantity</span>
                              <span>× {formData.quantity}</span>
                            </div>
                            <div className="flex justify-between text-gray-700">
                              <span>Base Price</span>
                              <span>₹{pricing.basePrice}</span>
                            </div>
                            {pricing.deliveryFee > 0 && (
                              <div className="flex justify-between text-gray-700">
                                <span>Delivery Fee</span>
                                <span>₹{pricing.deliveryFee}</span>
                              </div>
                            )}
                            <div className="flex justify-between text-gray-700">
                              <span>Convenience Fee</span>
                              <span>₹{pricing.convenienceFee}</span>
                            </div>
                            <div className="flex justify-between text-gray-700">
                              <span>GST (18%)</span>
                              <span>₹{pricing.gst}</span>
                            </div>
                            <div className="border-t-2 border-emerald-300 pt-3 flex justify-between text-xl font-bold text-emerald-700">
                              <span>Total Amount</span>
                              <span>₹{pricing.total}</span>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Payment Methods */}
                  <div>
                    <h4 className="font-bold text-gray-800 mb-4">Select Payment Method</h4>
                    <div className="grid grid-cols-1 gap-3">
                      {[
                        { id: 'upi', label: 'UPI', icon: <FaMobileAlt />, desc: 'PhonePe, Google Pay, Paytm' },
                        { id: 'card', label: 'Credit/Debit Card', icon: <FaCreditCard />, desc: 'Visa, Mastercard, Rupay' },
                        { id: 'netbanking', label: 'Net Banking', icon: <FaUniversity />, desc: 'All major banks' },
                        { id: 'wallet', label: 'Wallet', icon: <FaWallet />, desc: 'Paytm, PhonePe, Mobikwik' },
                        { id: 'cod', label: 'Cash on Delivery', icon: <FaWallet />, desc: 'Pay when you collect' },
                      ].map((method) => (
                        <motion.div
                          key={method.id}
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                          className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                            paymentMethod === method.id
                              ? 'border-emerald-500 bg-emerald-50 shadow-md'
                              : 'border-gray-200 hover:border-emerald-300'
                          }`}
                          onClick={() => setPaymentMethod(method.id)}
                        >
                          <div className="flex items-center gap-4">
                            <div className="text-2xl text-emerald-600">{method.icon}</div>
                            <div className="flex-1">
                              <div className="font-semibold text-gray-800">{method.label}</div>
                              <div className="text-sm text-gray-500">{method.desc}</div>
                            </div>
                            <div
                              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                paymentMethod === method.id
                                  ? 'border-emerald-500'
                                  : 'border-gray-300'
                              }`}
                            >
                              {paymentMethod === method.id && (
                                <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 4: Confirmation */}
              {step === 4 && bookingConfirmation && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-8"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', delay: 0.2 }}
                    className="inline-block p-6 bg-emerald-100 rounded-full mb-6"
                  >
                    <FaCheckCircle className="text-6xl text-emerald-600" />
                  </motion.div>

                  <h3 className="text-3xl font-bold text-gray-800 mb-2">Order Confirmed!</h3>
                  <p className="text-gray-600 mb-6">Your pharmacy order has been placed successfully</p>

                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 max-w-md mx-auto mb-6">
                    <div className="space-y-3 text-left">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Order Reference:</span>
                        <span className="font-bold text-emerald-600">
                          {bookingConfirmation.bookingReference}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Pharmacy:</span>
                        <span className="font-medium">{bookingConfirmation.pharmacyDetails.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Service:</span>
                        <span className="font-medium">{bookingConfirmation.orderDetails.serviceName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Pickup Date:</span>
                        <span className="font-medium">
                          {new Date(bookingConfirmation.orderDetails.pickupDate).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="border-t pt-3 flex justify-between text-lg font-bold">
                        <span>Total Paid:</span>
                        <span className="text-emerald-600">₹{bookingConfirmation.pricing.total}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded max-w-md mx-auto mb-6">
                    <p className="text-sm text-gray-700">
                      <strong>Confirmation email sent!</strong> Check your inbox for the invoice and receipt.
                    </p>
                  </div>

                  <div className="flex flex-col gap-3 max-w-sm mx-auto">
                    <button
                      onClick={() => {
                        window.open(`/api/pharmacy/booking/${bookingConfirmation._id}/invoice`, '_blank');
                      }}
                      className="flex items-center justify-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-lg hover:bg-emerald-700 transition-all"
                    >
                      <FaFileInvoice /> Download Invoice
                    </button>
                    <button
                      onClick={() => {
                        window.open(`/api/pharmacy/booking/${bookingConfirmation._id}/receipt`, '_blank');
                      }}
                      className="flex items-center justify-center gap-2 bg-teal-600 text-white px-6 py-3 rounded-lg hover:bg-teal-700 transition-all"
                    >
                      <FaReceipt /> Download Receipt
                    </button>
                    <button
                      onClick={handleClose}
                      className="bg-gray-200 text-gray-800 px-6 py-3 rounded-lg hover:bg-gray-300 transition-all"
                    >
                      Close
                    </button>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Footer with action buttons */}
            {step < 4 && (
              <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-4 flex justify-between">
                {step > 1 && (
                  <button
                    onClick={handleBack}
                    className="flex items-center gap-2 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all"
                  >
                    <FaArrowLeft /> Back
                  </button>
                )}
                {step < 3 && (
                  <button
                    onClick={handleNext}
                    className="ml-auto px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg hover:from-emerald-600 hover:to-teal-700 transition-all"
                  >
                    Next
                  </button>
                )}
                {step === 3 && (
                  <button
                    onClick={handlePayment}
                    disabled={processingPayment}
                    className="ml-auto px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg hover:from-emerald-600 hover:to-teal-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {processingPayment ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        Processing...
                      </>
                    ) : (
                      <>Pay ₹{calculateTotal().total}</>
                    )}
                  </button>
                )}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PharmacyBookingModal;
