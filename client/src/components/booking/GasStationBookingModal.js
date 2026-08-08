import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import {
  FaTimes,
  FaGasPump,
  FaCalendar,
  FaClock,
  FaArrowLeft,
  FaRupeeSign,
  FaCreditCard,
  FaMobileAlt,
  FaUniversity,
  FaWallet,
  FaCheckCircle
,
  FaCar,
  FaTint,
  FaReceipt,
} from 'react-icons/fa';
import { bookingAPI, paymentAPI } from '../../services/api';
import { loadRazorpayScript } from '../../utils/razorpay';

const GasStationBookingModal = ({ isOpen, onClose, gasStation }) => {
  const [step, setStep] = useState(1); // 1: Booking Details, 2: Payment, 3: Success
  const [paymentMethod, setPaymentMethod] = useState('');
  const [processingPayment, setProcessingPayment] = useState(false);
  const [bookingRef, setBookingRef] = useState('');
  
  const [formData, setFormData] = useState({
    fuelType: 'petrol',
    quantity: 10,
    vehicleNumber: '',
    vehicleModel: '',
    fillDateTime: '',
  });

  // Fuel prices (per liter in INR)
  const fuelPrices = {
    petrol: 105.50,
    diesel: 95.75,
    cng: 82.00,
    lpg: 98.50,
  };

  // Calculate pricing
  const calculatePricing = () => {
    const pricePerUnit = fuelPrices[formData.fuelType];
    const basePrice = pricePerUnit * formData.quantity;
    const taxes = basePrice * 0.18; // 18% GST
    const serviceFee = 10; // Flat service fee
    const totalPrice = basePrice + taxes + serviceFee;

    return {
      basePrice: parseFloat(basePrice.toFixed(2)),
      pricePerUnit,
      taxes: parseFloat(taxes.toFixed(2)),
      serviceFee,
      totalPrice: parseFloat(totalPrice.toFixed(2)),
      currency: 'INR',
    };
  };

  const pricing = calculatePricing();

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setPaymentMethod('');
      setFormData({
        fuelType: 'petrol',
        quantity: 10,
        vehicleNumber: '',
        vehicleModel: '',
        fillDateTime: '',
      });
    }
  }, [isOpen]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmitBooking = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.vehicleNumber.trim()) {
      toast.error('Please enter vehicle number');
      return;
    }

    if (!formData.fillDateTime) {
      toast.error('Please select fill date and time');
      return;
    }

    if (formData.quantity < 1 || formData.quantity > 100) {
      toast.error('Quantity must be between 1 and 100 liters');
      return;
    }

    // Move to payment step
    setStep(2);
  };

  const handlePayment = async () => {
    if (!paymentMethod) {
      toast.error('Please select a payment method');
      return;
    }

    setProcessingPayment(true);

    try {
      const orderResponse = await paymentAPI.createOrder({
        amount: pricing.totalPrice,
        currency: 'INR',
        receipt: `gas_booking_${Date.now()}`,
      });

      const orderData = orderResponse.data?.data;
      if (!orderResponse.data?.success || !orderData?.orderId || !orderData?.key) {
        throw new Error('Failed to initialize Razorpay checkout');
      }

      await loadRazorpayScript();

      await new Promise((resolve, reject) => {
        const razorpay = new window.Razorpay({
          key: orderData.key,
          amount: orderData.amount,
          currency: orderData.currency,
          name: 'AI Trip Planner',
          description: 'Gas station booking payment',
          order_id: orderData.orderId,
          theme: {
            color: '#2563eb',
          },
          handler: async (paymentResponse) => {
            try {
              const verificationResponse = await paymentAPI.verifyPayment({
                ...paymentResponse,
              });

              if (!verificationResponse.data?.success) {
                throw new Error(verificationResponse.data?.message || 'Payment verification failed');
              }

              const bookingData = {
                bookingType: 'gas_station',
                bookingDetails: {
                  name: gasStation?.name || 'Gas Station',
                  description: `${formData.fuelType.toUpperCase()} - ${formData.quantity}L for ${formData.vehicleNumber}`,
                  location: {
                    address: gasStation?.address || gasStation?.location?.address || '',
                    coordinates: {
                      lat: gasStation?.location?.lat || gasStation?.coordinates?.lat || 0,
                      lng: gasStation?.location?.lng || gasStation?.coordinates?.lng || 0,
                    },
                  },
                },
                numberOfGuests: 1,
                gasStationDetails: {
                  fuelType: formData.fuelType,
                  quantity: parseFloat(formData.quantity),
                  pricePerUnit: parseFloat(pricing.pricePerUnit),
                  vehicleNumber: formData.vehicleNumber,
                  vehicleModel: formData.vehicleModel,
                  fillDateTime: new Date(formData.fillDateTime).toISOString(),
                  stationName: gasStation?.name || 'Gas Station',
                  stationAddress: gasStation?.address || gasStation?.location?.address || '',
                },
                pricing: {
                  basePrice: parseFloat(pricing.basePrice),
                  taxes: parseFloat(pricing.taxes),
                  serviceFee: 0,
                  discount: 0,
                  totalPrice: parseFloat(pricing.totalPrice),
                  currency: 'INR',
                },
                paymentMethod: paymentMethod,
                paymentStatus: 'paid',
                status: 'confirmed',
                paymentDetails: {
                  gateway: 'razorpay',
                  orderId: paymentResponse.razorpay_order_id,
                  paymentId: paymentResponse.razorpay_payment_id,
                  signature: paymentResponse.razorpay_signature,
                  paidAt: new Date().toISOString(),
                },
              };

              const bookingResponse = await bookingAPI.createBooking(bookingData);

              if (!bookingResponse.data?.success) {
                throw new Error(bookingResponse.data?.message || 'Booking failed');
              }

              setBookingRef(bookingResponse.data.data.bookingReference);
              setStep(3);
              toast.success('Booking confirmed! Check your email for the receipt.');
              resolve();
            } catch (error) {
              reject(error);
            }
          },
          modal: {
            ondismiss: () => reject(new Error('Payment cancelled')),
          },
        });

        razorpay.open();
      });
    } catch (error) {
      console.error('Booking error:', error);
      console.error('Error response:', error.response?.data);
      const errorMessage = error.response?.data?.message || error.message || 'Booking failed. Please try again.';
      toast.error(errorMessage);
    } finally {
      setProcessingPayment(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="gas-station-booking-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
      >
        <motion.div
          key="gas-station-booking-content"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FaGasPump className="text-2xl" />
              <div>
                <h2 className="text-2xl font-bold">Fuel Booking</h2>
                <p className="text-sm text-blue-100">{gasStation?.name || 'Gas Station'}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <FaTimes className="text-2xl" />
            </button>
          </div>

          {/* Progress Indicator */}
          <div className="flex items-center justify-center py-4 px-6 bg-gray-50 dark:bg-gray-700">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                    step >= s
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-400'
                  }`}
                >
                  {s}
                </div>
                {s < 3 && (
                  <div
                    className={`w-20 h-1 ${
                      step > s ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Step 1: Booking Details */}
          {step === 1 && (
            <form onSubmit={handleSubmitBooking} className="p-6">
              <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
                Fill Booking Details
              </h3>

              {/* Fuel Type Selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  <FaTint className="inline mr-2" />
                  Fuel Type
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {Object.keys(fuelPrices).map((fuel) => (
                    <button
                      key={fuel}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, fuelType: fuel }))}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        formData.fuelType === fuel
                          ? 'border-blue-600 bg-blue-50 dark:bg-blue-900'
                          : 'border-gray-300 dark:border-gray-600 hover:border-blue-400'
                      }`}
                    >
                      <div className="font-semibold uppercase text-gray-900 dark:text-white">{fuel}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        ₹{fuelPrices[fuel]}/L
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantity */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Quantity (Liters)
                </label>
                <input
                  type="number"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleInputChange}
                  min="1"
                  max="100"
                  className="input w-full"
                  required
                />
              </div>

              {/* Vehicle Number */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  <FaCar className="inline mr-2" />
                  Vehicle Number *
                </label>
                <input
                  type="text"
                  name="vehicleNumber"
                  value={formData.vehicleNumber}
                  onChange={handleInputChange}
                  placeholder="e.g., KA-01-AB-1234"
                  className="input w-full"
                  required
                />
              </div>

              {/* Vehicle Model */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Vehicle Model (Optional)
                </label>
                <input
                  type="text"
                  name="vehicleModel"
                  value={formData.vehicleModel}
                  onChange={handleInputChange}
                  placeholder="e.g., Honda City"
                  className="input w-full"
                />
              </div>

              {/* Fill Date & Time */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  <FaCalendar className="inline mr-2" />
                  <FaClock className="inline mr-2" />
                  Fill Date & Time *
                </label>
                <input
                  type="datetime-local"
                  name="fillDateTime"
                  value={formData.fillDateTime}
                  onChange={handleInputChange}
                  min={new Date().toISOString().slice(0, 16)}
                  className="input w-full"
                  required
                />
              </div>

              {/* Price Summary */}
              <div className="bg-yellow-50 dark:bg-yellow-900 rounded-lg p-4 mb-6">
                <h4 className="font-bold text-yellow-900 dark:text-yellow-100 mb-3">
                  <FaReceipt className="inline mr-2" />
                  Price Summary
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-yellow-800 dark:text-yellow-200">
                      Base Price ({formData.quantity}L × ₹{pricing.pricePerUnit})
                    </span>
                    <span className="font-semibold text-yellow-900 dark:text-yellow-100">
                      ₹{pricing.basePrice.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-yellow-800 dark:text-yellow-200">GST (18%)</span>
                    <span className="font-semibold text-yellow-900 dark:text-yellow-100">
                      ₹{pricing.taxes.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-yellow-800 dark:text-yellow-200">Service Fee</span>
                    <span className="font-semibold text-yellow-900 dark:text-yellow-100">
                      ₹{pricing.serviceFee.toFixed(2)}
                    </span>
                  </div>
                  <div className="border-t-2 border-yellow-700 dark:border-yellow-400 pt-2 flex justify-between text-lg">
                    <span className="font-bold text-yellow-900 dark:text-yellow-100">Total Amount</span>
                    <span className="font-bold text-yellow-900 dark:text-yellow-100">
                      ₹{pricing.totalPrice.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="btn flex-1 bg-gray-300 text-gray-700 hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary flex-1"
                >
                  Proceed to Payment
                </button>
              </div>
            </form>
          )}

          {/* Step 2: Payment */}
          {step === 2 && (
            <div className="p-6">
              <button
                onClick={() => setStep(1)}
                className="mb-4 text-blue-600 hover:text-blue-700 flex items-center"
              >
                <FaArrowLeft className="mr-2" />
                Back to Booking Details
              </button>

              <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
                Select Payment Method
              </h3>

              <div className="space-y-3 mb-6">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={`w-full p-4 rounded-lg border-2 text-left flex items-center transition-all ${
                    paymentMethod === 'card'
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-900'
                      : 'border-gray-300 dark:border-gray-600 hover:border-blue-400'
                  }`}
                >
                  <FaCreditCard className="text-2xl mr-4 text-blue-600" />
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white">Credit / Debit Card</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Visa, Mastercard, Rupay</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('upi')}
                  className={`w-full p-4 rounded-lg border-2 text-left flex items-center transition-all ${
                    paymentMethod === 'upi'
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-900'
                      : 'border-gray-300 dark:border-gray-600 hover:border-blue-400'
                  }`}
                >
                  <FaMobileAlt className="text-2xl mr-4 text-green-600" />
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white">UPI</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Google Pay, PhonePe, Paytm</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('netbanking')}
                  className={`w-full p-4 rounded-lg border-2 text-left flex items-center transition-all ${
                    paymentMethod === 'netbanking'
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-900'
                      : 'border-gray-300 dark:border-gray-600 hover:border-blue-400'
                  }`}
                >
                  <FaUniversity className="text-2xl mr-4 text-purple-600" />
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white">Net Banking</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">All major banks supported</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('wallet')}
                  className={`w-full p-4 rounded-lg border-2 text-left flex items-center transition-all ${
                    paymentMethod === 'wallet'
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-900'
                      : 'border-gray-300 dark:border-gray-600 hover:border-blue-400'
                  }`}
                >
                  <FaWallet className="text-2xl mr-4 text-orange-600" />
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white">Wallet</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Paytm, PhonePe, Amazon Pay</div>
                  </div>
                </button>
              </div>

              {/* Total Amount */}
              <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900 dark:to-blue-900 rounded-lg p-4 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-900 dark:text-white">
                    <FaRupeeSign className="inline" /> Amount to Pay
                  </span>
                  <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                    ₹{pricing.totalPrice.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <button
                onClick={handlePayment}
                className="w-full btn-primary"
                disabled={!paymentMethod || processingPayment}
              >
                {processingPayment ? (
                  <span>Processing...</span>
                ) : (
                  <span>Pay ₹{pricing.totalPrice.toFixed(2)}</span>
                )}
              </button>
            </div>
          )}

          {/* Step 3: Success */}
          {step === 3 && (
            <div className="p-6 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200 }}
              >
                <FaCheckCircle className="text-6xl text-green-500 mx-auto mb-4" />
              </motion.div>
              
              <h3 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">
                Booking Confirmed!
              </h3>
              
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Your fuel booking has been confirmed successfully.
              </p>
              
              <div className="bg-blue-50 dark:bg-blue-900 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-800 dark:text-blue-200 mb-2">Booking Reference</p>
                <p className="text-xl font-bold text-blue-600 dark:text-blue-400">{bookingRef}</p>
              </div>
              
              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400 mb-6">
                <p>✅ Confirmation email sent</p>
                <p>✅ Invoice and receipt attached</p>
                <p>📱 SMS notification sent</p>
              </div>
              
              <button
                onClick={onClose}
                className="w-full btn-primary"
              >
                Done
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default GasStationBookingModal;
