import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import {
  FaTimes,
  FaHospital,
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
  FaUserMd,
  FaStethoscope,
  FaMicroscope,
  FaAmbulance,
  FaBed,
  FaHeartbeat,
} from 'react-icons/fa';
import api from '../../services/api';

const HospitalBookingModal = ({ isOpen, onClose, hospitalDetails = {} }) => {
  const [step, setStep] = useState(1); // 1: Service Selection, 2: Details, 3: Payment, 4: Confirmation
  const [paymentMethod, setPaymentMethod] = useState('');
  const [processingPayment, setProcessingPayment] = useState(false);
  const [bookingConfirmation, setBookingConfirmation] = useState(null);
  
  const [formData, setFormData] = useState({
    patientName: '',
    email: '',
    phone: '',
    age: '',
    gender: 'male',
    appointmentDate: '',
    appointmentTime: 'morning',
    serviceType: '',
    department: '',
    symptoms: '',
    medicalHistory: '',
    emergencyContact: '',
    insuranceProvider: '',
  });

  // Hospital service types with pricing
  const serviceTypes = [
    {
      id: 'consultation',
      name: 'Doctor Consultation',
      description: 'General physician consultation',
      price: 500,
      duration: '30 minutes',
      features: ['Expert Doctor', 'Prescription', 'Follow-up Advice'],
      icon: '👨‍⚕️',
    },
    {
      id: 'specialist_consultation',
      name: 'Specialist Consultation',
      description: 'Specialist doctor consultation',
      price: 1200,
      duration: '45 minutes',
      features: ['Specialist Doctor', 'Detailed Diagnosis', 'Treatment Plan'],
      icon: '🩺',
    },
    {
      id: 'health_checkup',
      name: 'Full Health Checkup',
      description: 'Comprehensive health screening package',
      price: 2500,
      duration: '2-3 hours',
      features: ['Blood Tests', 'ECG', 'X-Ray', 'Doctor Consultation', 'Reports'],
      icon: '💉',
    },
    {
      id: 'lab_tests',
      name: 'Lab Tests',
      description: 'Diagnostic laboratory tests',
      price: 800,
      duration: '1 hour',
      features: ['Blood Test', 'Urine Test', 'Digital Reports', 'Home Collection Available'],
      icon: '🔬',
    },
    {
      id: 'emergency_care',
      name: 'Emergency Care',
      description: '24/7 emergency medical services',
      price: 3000,
      duration: 'Immediate',
      features: ['Immediate Care', 'Emergency Room', 'Trauma Support', 'ICU Available'],
      icon: '🚑',
    },
    {
      id: 'ambulance_service',
      name: 'Ambulance Service',
      description: 'Emergency ambulance with paramedic',
      price: 1500,
      duration: 'On-demand',
      features: ['Trained Paramedic', 'Life Support Equipment', 'GPS Tracking'],
      icon: '🚑',
    },
    {
      id: 'physiotherapy',
      name: 'Physiotherapy Session',
      description: 'Physical therapy and rehabilitation',
      price: 600,
      duration: '45 minutes',
      features: ['Licensed Therapist', 'Exercise Plan', 'Pain Management'],
      icon: '🤸',
    },
    {
      id: 'dental_care',
      name: 'Dental Checkup',
      description: 'Complete dental examination',
      price: 700,
      duration: '30 minutes',
      features: ['Dental Examination', 'Cleaning', 'X-Ray if needed'],
      icon: '🦷',
    },
    {
      id: 'vaccination',
      name: 'Vaccination Service',
      description: 'Immunization and vaccines',
      price: 400,
      duration: '15 minutes',
      features: ['WHO Approved Vaccines', 'Certificate', 'Post-care Guidance'],
      icon: '💊',
    },
  ];

  // Medical departments
  const departments = [
    { id: 'general', name: 'General Medicine', icon: '🏥' },
    { id: 'cardiology', name: 'Cardiology', icon: '❤️' },
    { id: 'orthopedics', name: 'Orthopedics', icon: '🦴' },
    { id: 'pediatrics', name: 'Pediatrics', icon: '👶' },
    { id: 'gynecology', name: 'Gynecology', icon: '🤰' },
    { id: 'dermatology', name: 'Dermatology', icon: '💆' },
    { id: 'ophthalmology', name: 'Ophthalmology', icon: '👁️' },
    { id: 'ent', name: 'ENT', icon: '👂' },
    { id: 'neurology', name: 'Neurology', icon: '🧠' },
    { id: 'psychiatry', name: 'Psychiatry', icon: '🧘' },
  ];

  const handleServiceSelect = (serviceId) => {
    setFormData({ ...formData, serviceType: serviceId });
  };

  const handleDepartmentToggle = (deptId) => {
    setFormData({ ...formData, department: deptId });
  };

  const calculateTotal = () => {
    if (!formData.serviceType) return 0;
    
    const selectedService = serviceTypes.find((s) => s.id === formData.serviceType);
    if (!selectedService) return 0;

    const basePrice = selectedService.price;
    const convenienceFee = 50;
    const gst = (basePrice + convenienceFee) * 0.18; // 18% GST

    return {
      basePrice,
      convenienceFee,
      gst: Math.round(gst),
      total: Math.round(basePrice + convenienceFee + gst),
    };
  };

  const validateStep = () => {
    if (step === 1) {
      if (!formData.serviceType) {
        toast.error('Please select a service type');
        return false;
      }
      if (!formData.department) {
        toast.error('Please select a department');
        return false;
      }
      return true;
    }
    
    if (step === 2) {
      if (!formData.patientName || !formData.email || !formData.phone) {
        toast.error('Please fill in all required fields');
        return false;
      }
      if (!formData.age || formData.age < 1 || formData.age > 120) {
        toast.error('Please enter a valid age');
        return false;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        toast.error('Please enter a valid email address');
        return false;
      }
      if (!/^\d{10}$/.test(formData.phone)) {
        toast.error('Please enter a valid 10-digit phone number');
        return false;
      }
      if (!formData.appointmentDate) {
        toast.error('Please select an appointment date');
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
    setStep(step - 1);
  };

  const handlePayment = async () => {
    if (!validateStep()) return;

    setProcessingPayment(true);
    
    // Simulate payment processing
    await new Promise((resolve) => setTimeout(resolve, 2000));

    try {
      const pricing = calculateTotal();
      const bookingData = {
        hospitalDetails: {
          name: hospitalDetails.name || 'Hospital',
          address: hospitalDetails.vicinity || hospitalDetails.address || '',
          contact: hospitalDetails.phone || '',
        },
        patientDetails: {
          name: formData.patientName,
          email: formData.email,
          phone: formData.phone,
          age: formData.age,
          gender: formData.gender,
          emergencyContact: formData.emergencyContact,
        },
        appointmentDetails: {
          serviceType: formData.serviceType,
          serviceName: serviceTypes.find((s) => s.id === formData.serviceType)?.name || '',
          department: formData.department,
          departmentName: departments.find((d) => d.id === formData.department)?.name || '',
          appointmentDate: formData.appointmentDate,
          appointmentTime: formData.appointmentTime,
          symptoms: formData.symptoms,
          medicalHistory: formData.medicalHistory,
          insuranceProvider: formData.insuranceProvider,
        },
        pricing,
        payment: {
          method: paymentMethod,
          status: 'completed',
          transactionId: `TXN${Date.now()}${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        },
      };

      const response = await api.post('/hospital/book', bookingData);
      
      if (response.data.success) {
        setBookingConfirmation(response.data.booking);
        toast.success('Hospital appointment booked successfully!');
        setStep(4);
      } else {
        throw new Error(response.data.message || 'Booking failed');
      }
    } catch (error) {
      console.error('Booking error:', error);
      toast.error(error.response?.data?.message || error.message || 'Booking failed. Please try again.');
    } finally {
      setProcessingPayment(false);
    }
  };

  const downloadInvoice = async () => {
    try {
      const response = await api.get(
        `/hospital/invoice/${bookingConfirmation._id}`,
        { responseType: 'blob' }
      );
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `hospital-invoice-${bookingConfirmation.bookingReference}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Invoice downloaded successfully!');
    } catch (error) {
      console.error('Invoice download error:', error);
      toast.error('Failed to download invoice');
    }
  };

  const downloadReceipt = async () => {
    try {
      const response = await api.get(
        `/hospital/receipt/${bookingConfirmation._id}`,
        { responseType: 'blob' }
      );
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `hospital-receipt-${bookingConfirmation.bookingReference}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Receipt downloaded successfully!');
    } catch (error) {
      console.error('Receipt download error:', error);
      toast.error('Failed to download receipt');
    }
  };

  const handleClose = () => {
    setStep(1);
    setPaymentMethod('');
    setFormData({
      patientName: '',
      email: '',
      phone: '',
      age: '',
      gender: 'male',
      appointmentDate: '',
      appointmentTime: 'morning',
      serviceType: '',
      department: '',
      symptoms: '',
      medicalHistory: '',
      emergencyContact: '',
      insuranceProvider: '',
    });
    setBookingConfirmation(null);
    onClose();
  };

  if (!isOpen) return null;

  const pricing = calculateTotal();

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
          className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-cyan-600 p-6 relative flex-shrink-0">
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
            >
              <FaTimes className="h-5 w-5 text-white" />
            </button>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                <FaHospital className="h-8 w-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Book Hospital Appointment</h2>
                <p className="text-white/90 text-sm">
                  {hospitalDetails.name || 'Hospital'} - Healthcare Services
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
                        ? 'bg-white text-blue-600'
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
          <div className="p-6 overflow-y-auto flex-1">
            {/* Step 1: Service Selection */}
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                    Select Service
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {serviceTypes.map((service) => (
                      <motion.div
                        key={service.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleServiceSelect(service.id)}
                        className={`relative p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                          formData.serviceType === service.id
                            ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-200 dark:border-gray-700 hover:border-blue-400'
                        }`}
                      >
                        <div className="text-3xl mb-2">{service.icon}</div>
                        <h4 className="font-bold text-gray-900 dark:text-white mb-1">
                          {service.name}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                          {service.description}
                        </p>
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xl font-bold text-blue-600">
                            ₹{service.price}
                          </span>
                          <span className="text-sm text-gray-500">{service.duration}</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {service.features.map((feature, idx) => (
                            <span
                              key={idx}
                              className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full"
                            >
                              {feature}
                            </span>
                          ))}
                        </div>
                        {formData.serviceType === service.id && (
                          <div className="absolute top-3 right-3">
                            <FaCheckCircle className="h-6 w-6 text-blue-600" />
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                    Select Department
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                    {departments.map((dept) => (
                      <motion.button
                        key={dept.id}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleDepartmentToggle(dept.id)}
                        className={`p-3 rounded-xl border-2 transition-all ${
                          formData.department === dept.id
                            ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                            : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        <div className="text-2xl mb-1">{dept.icon}</div>
                        <div className="text-xs font-medium">{dept.name}</div>
                      </motion.button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Patient Details */}
            {step === 2 && (
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  Patient Information
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <FaUser className="inline mr-2" />
                      Patient Name *
                    </label>
                    <input
                      type="text"
                      value={formData.patientName}
                      onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-blue-500 outline-none"
                      placeholder="Enter patient name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <FaEnvelope className="inline mr-2" />
                      Email Address *
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-blue-500 outline-none"
                      placeholder="your.email@example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <FaPhone className="inline mr-2" />
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-blue-500 outline-none"
                      placeholder="10-digit phone number"
                      maxLength={10}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Age *
                    </label>
                    <input
                      type="number"
                      value={formData.age}
                      onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-blue-500 outline-none"
                      placeholder="Age"
                      min="1"
                      max="120"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Gender *
                    </label>
                    <select
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-blue-500 outline-none"
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Emergency Contact
                    </label>
                    <input
                      type="tel"
                      value={formData.emergencyContact}
                      onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-blue-500 outline-none"
                      placeholder="Emergency contact number"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <FaCalendar className="inline mr-2" />
                      Appointment Date *
                    </label>
                    <input
                      type="date"
                      value={formData.appointmentDate}
                      onChange={(e) => setFormData({ ...formData, appointmentDate: e.target.value })}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Preferred Time
                    </label>
                    <select
                      value={formData.appointmentTime}
                      onChange={(e) => setFormData({ ...formData, appointmentTime: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-blue-500 outline-none"
                    >
                      <option value="morning">Morning (9 AM - 12 PM)</option>
                      <option value="afternoon">Afternoon (12 PM - 4 PM)</option>
                      <option value="evening">Evening (4 PM - 8 PM)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Symptoms / Reason for Visit
                  </label>
                  <textarea
                    value={formData.symptoms}
                    onChange={(e) => setFormData({ ...formData, symptoms: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-blue-500 outline-none"
                    placeholder="Describe your symptoms or reason for consultation"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Medical History (Optional)
                  </label>
                  <textarea
                    value={formData.medicalHistory}
                    onChange={(e) => setFormData({ ...formData, medicalHistory: e.target.value })}
                    rows={2}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-blue-500 outline-none"
                    placeholder="Any pre-existing conditions, allergies, or medications"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Insurance Provider (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.insuranceProvider}
                    onChange={(e) => setFormData({ ...formData, insuranceProvider: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-blue-500 outline-none"
                    placeholder="Insurance company name"
                  />
                </div>
              </div>
            )}

            {/* Step 3: Payment */}
            {step === 3 && (
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  Payment Method
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { id: 'card', label: 'Credit/Debit Card', icon: FaCreditCard, desc: 'Visa, Mastercard, RuPay' },
                    { id: 'upi', label: 'UPI Payment', icon: FaMobileAlt, desc: 'GPay, PhonePe, Paytm' },
                    { id: 'netbanking', label: 'Net Banking', icon: FaUniversity, desc: 'All major banks' },
                    { id: 'wallet', label: 'Wallet', icon: FaWallet, desc: 'Paytm, PhonePe, Amazon Pay' },
                  ].map((method) => (
                    <motion.div
                      key={method.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setPaymentMethod(method.id)}
                      className={`p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                        paymentMethod === method.id
                          ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-blue-400'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <method.icon className="h-8 w-8 text-blue-600" />
                        <div>
                          <h4 className="font-bold text-gray-900 dark:text-white">
                            {method.label}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {method.desc}
                          </p>
                        </div>
                      </div>
                      {paymentMethod === method.id && (
                        <div className="mt-3">
                          <FaCheckCircle className="h-5 w-5 text-blue-600 ml-auto" />
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 p-6 rounded-2xl">
                  <h4 className="font-bold text-gray-900 dark:text-white mb-4">
                    Booking Summary
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Service Fee</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        ₹{pricing.basePrice}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Convenience Fee</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        ₹{pricing.convenienceFee}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">GST (18%)</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        ₹{pricing.gst}
                      </span>
                    </div>
                    <div className="h-px bg-gray-300 dark:bg-gray-600 my-3"></div>
                    <div className="flex justify-between text-lg">
                      <span className="font-bold text-gray-900 dark:text-white">Total Amount</span>
                      <span className="font-bold text-blue-600">₹{pricing.total}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Confirmation */}
            {step === 4 && bookingConfirmation && (
              <div className="space-y-6 text-center">
                <div className="w-20 h-20 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto">
                  <FaCheckCircle className="h-10 w-10 text-green-600" />
                </div>
                
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Appointment Confirmed!
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Your hospital appointment has been successfully booked
                  </p>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 p-6 rounded-2xl text-left">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">Booking Reference</p>
                      <p className="font-bold text-gray-900 dark:text-white">
                        {bookingConfirmation.bookingReference}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">Patient Name</p>
                      <p className="font-bold text-gray-900 dark:text-white">
                        {bookingConfirmation.patientDetails.name}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">Service</p>
                      <p className="font-bold text-gray-900 dark:text-white">
                        {bookingConfirmation.appointmentDetails.serviceName}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">Department</p>
                      <p className="font-bold text-gray-900 dark:text-white">
                        {bookingConfirmation.appointmentDetails.departmentName}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">Total Paid</p>
                      <p className="font-bold text-blue-600">
                        ₹{bookingConfirmation.pricing.total}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">Payment Status</p>
                      <p className="font-bold text-green-600">
                        {bookingConfirmation.payment.status}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={downloadInvoice}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl transition-colors flex items-center justify-center gap-2"
                  >
                    <FaFileInvoice className="h-5 w-5" />
                    Download Invoice
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={downloadReceipt}
                    className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 px-6 rounded-xl transition-colors flex items-center justify-center gap-2"
                  >
                    <FaReceipt className="h-5 w-5" />
                    Download Receipt
                  </motion.button>
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          {step < 4 && (
            <div className="p-6 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
              <div className="flex gap-3">
                {step > 1 && (
                  <button
                    onClick={handleBack}
                    className="px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 font-medium transition-colors flex items-center gap-2"
                  >
                    <FaArrowLeft className="h-4 w-4" />
                    Back
                  </button>
                )}
                <button
                  onClick={step === 3 ? handlePayment : handleNext}
                  disabled={processingPayment}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold py-3 px-6 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {processingPayment
                    ? 'Processing...'
                    : step === 3
                    ? `Pay ₹${pricing.total}`
                    : 'Continue'}
                </button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="p-6 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
              <button
                onClick={handleClose}
                className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold py-3 px-6 rounded-xl transition-all"
              >
                Close
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default HospitalBookingModal;
