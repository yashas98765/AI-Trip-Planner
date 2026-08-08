import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import {
  FaTimes,
  FaHotel,
  FaUtensils,
  FaCoffee,
  FaCar,
  FaMotorcycle,
  FaBus,
  FaTrain,
  FaPlane,
  FaShip,
  FaCheckCircle,
  FaCreditCard,
  FaMobileAlt,
  FaUniversity,
  FaWallet,
  FaMoneyBillWave,
  FaLock,
  FaArrowLeft,
  FaSuitcase,
} from 'react-icons/fa';
import { bookingAPI, paymentAPI } from '../../services/api';
import { loadRazorpayScript } from '../../utils/razorpay';

const BookingModal = ({ isOpen, onClose, bookingType, placeDetails = {}, defaultFormData = {} }) => {
  const wasOpenRef = useRef(false);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [processingPayment, setProcessingPayment] = useState(false);
  const [formData, setFormData] = useState({
    adults: 1,
    children: 0,
    infants: 0,
    checkInDate: '',
    checkOutDate: '',
    bookingDate: '',
    bookingTime: '',
    departureDate: '',
    returnDate: '',
    from: '',
    to: '',
    numberOfRooms: 1,
    specialRequests: '',
  });

  // Restaurant menu items with quantities
  const [selectedMenuItems, setSelectedMenuItems] = useState([]);
  
  // Selected room type for hotels
  const [selectedRoomType, setSelectedRoomType] = useState(null);
  
  // Selected transport type for transportation bookings
  const [selectedTransportType, setSelectedTransportType] = useState(null);

  const transportTypes = {
    car: {
      'Economy Cars': [
        { id: 1, name: 'Hatchback', price: 1200, pricePerKm: 12, capacity: 4, features: ['AC', 'Music System'] },
        { id: 2, name: 'Sedan', price: 1800, pricePerKm: 15, capacity: 4, features: ['AC', 'GPS'] },
      ],
      'Luxury Cars': [
        { id: 3, name: 'Premium Sedan', price: 4000, pricePerKm: 25, capacity: 4, features: ['AC', 'Leather Seats'] },
        { id: 4, name: 'Luxury SUV', price: 6000, pricePerKm: 35, capacity: 7, features: ['AC', 'GPS', 'Sunroof'] },
      ],
    },
    bike: {
      'Standard Bikes': [
        { id: 1, name: 'Scooter', price: 400, pricePerKm: 5, capacity: 2, features: ['Fuel Efficient', 'Helmet'] },
        { id: 2, name: '150cc Bike', price: 600, pricePerKm: 6, capacity: 2, features: ['Fuel Efficient', 'Helmet'] },
      ],
      'Premium Bikes': [
        { id: 3, name: 'Cruiser', price: 2000, pricePerKm: 12, capacity: 2, features: ['Comfortable Ride', 'Helmet'] },
        { id: 4, name: 'Superbike', price: 4000, pricePerKm: 20, capacity: 2, features: ['High Performance', 'Helmet'] },
      ],
    },
    bus: {
      'Regular Buses': [
        { id: 1, name: 'Non-AC Seater', price: 500, pricePerKm: 1.5, capacity: 40, features: ['Basic Seating'] },
        { id: 2, name: 'AC Seater', price: 800, pricePerKm: 2, capacity: 40, features: ['AC', 'Comfortable Seats'] },
      ],
      'Luxury Buses': [
        { id: 3, name: 'Semi-Sleeper', price: 1500, pricePerKm: 3.5, capacity: 35, features: ['AC', 'Reclining Seats'] },
        { id: 4, name: 'Sleeper', price: 1800, pricePerKm: 4, capacity: 30, features: ['AC', 'Berth Beds'] },
      ],
    },
    train: {
      'General Classes': [
        { id: 1, name: 'Second Sitting', price: 400, pricePerKm: 0.8, capacity: 80, features: ['Reserved Seating'] },
        { id: 2, name: 'Sleeper Class', price: 600, pricePerKm: 1, capacity: 72, features: ['Berth'] },
      ],
      'AC Classes': [
        { id: 3, name: 'AC 3 Tier', price: 1200, pricePerKm: 1.5, capacity: 64, features: ['AC', 'Berth'] },
        { id: 4, name: 'AC 2 Tier', price: 1800, pricePerKm: 2, capacity: 48, features: ['AC', 'More Space'] },
      ],
    },
    flight: {
      'Domestic Flights': [
        { id: 1, name: 'Economy Class', price: 4000, pricePerKm: 4, capacity: 180, features: ['Cabin Bag', 'Meal'] },
        { id: 2, name: 'Premium Economy', price: 6500, pricePerKm: 6, capacity: 150, features: ['Extra Legroom', 'Meal'] },
      ],
      'International Flights': [
        { id: 3, name: 'Business Class', price: 15000, pricePerKm: 10, capacity: 50, features: ['Priority Boarding', 'Lounge Access'] },
        { id: 4, name: 'First Class', price: 25000, pricePerKm: 15, capacity: 20, features: ['Premium Service', 'Flat Bed'] },
      ],
    },
    ship: {
      'Standard Cruises': [
        { id: 1, name: 'Interior Cabin', price: 5000, pricePerKm: 3, capacity: 2, features: ['Basic Cabin'] },
        { id: 2, name: 'Ocean View Cabin', price: 8000, pricePerKm: 4, capacity: 2, features: ['Sea View'] },
      ],
      'Luxury Cruises': [
        { id: 3, name: 'Suite', price: 15000, pricePerKm: 6, capacity: 4, features: ['Balcony', 'Premium Dining'] },
        { id: 4, name: 'Presidential Suite', price: 30000, pricePerKm: 10, capacity: 6, features: ['Butler Service', 'Private Deck'] },
      ],
    },
  };

  const restaurantMenu = {
    'Seafood': [
      { id: 185, name: 'Fish Fry', price: 380, veg: false },
      { id: 186, name: 'Fish Masala', price: 400, veg: false },
      { id: 187, name: 'Prawn Curry', price: 480, veg: false },
      { id: 188, name: 'Prawn Masala', price: 500, veg: false },
      { id: 189, name: 'Prawn Biryani', price: 450, veg: false },
      { id: 190, name: 'Prawn Butter Garlic', price: 520, veg: false },
      { id: 191, name: 'Fish Tikka Masala', price: 440, veg: false },
      { id: 192, name: 'Goan Fish Curry', price: 460, veg: false },
      { id: 193, name: 'Crab Masala', price: 550, veg: false },
    ],
    'Main Course - Indian Paneer': [
      { id: 6, name: 'Palak Paneer', price: 280, veg: true },
      { id: 9, name: 'Kadai Paneer', price: 300, veg: true },
      { id: 117, name: 'Paneer Butter Masala', price: 320, veg: true },
      { id: 194, name: 'Shahi Paneer', price: 330, veg: true },
      { id: 195, name: 'Paneer Do Pyaza', price: 290, veg: true },
      { id: 196, name: 'Paneer Tikka Masala', price: 310, veg: true },
      { id: 197, name: 'Paneer Korma', price: 300, veg: true },
      { id: 198, name: 'Paneer Bhurji', price: 280, veg: true },
      { id: 199, name: 'Matar Paneer', price: 270, veg: true },
      { id: 200, name: 'Paneer Lababdar', price: 340, veg: true },
    ],
    'Main Course - Indian Mushroom & Veg': [
      { id: 8, name: 'Dal Makhani', price: 220, veg: true },
      { id: 113, name: 'Veg Biryani', price: 280, veg: true },
      { id: 115, name: 'Chole Bhature', price: 180, veg: true },
      { id: 119, name: 'Veg Korma', price: 260, veg: true },
      { id: 201, name: 'Mushroom Masala', price: 280, veg: true },
      { id: 202, name: 'Mushroom Do Pyaza', price: 270, veg: true },
      { id: 203, name: 'Mushroom Kadai', price: 290, veg: true },
      { id: 204, name: 'Mushroom Tikka Masala', price: 300, veg: true },
      { id: 205, name: 'Mushroom Biryani', price: 260, veg: true },
      { id: 206, name: 'Mix Veg Curry', price: 240, veg: true },
    ],
    'Main Course - Chinese': [
      { id: 120, name: 'Veg Fried Rice', price: 200, veg: true },
      { id: 121, name: 'Chicken Fried Rice', price: 250, veg: false },
      { id: 122, name: 'Veg Hakka Noodles', price: 180, veg: true },
      { id: 123, name: 'Chicken Noodles', price: 230, veg: false },
      { id: 124, name: 'Manchurian (Veg)', price: 220, veg: true },
      { id: 125, name: 'Manchurian (Chicken)', price: 270, veg: false },
      { id: 126, name: 'Chilli Paneer', price: 280, veg: true },
      { id: 127, name: 'Chilli Chicken', price: 320, veg: false },
      { id: 207, name: 'Mushroom Fried Rice', price: 220, veg: true },
      { id: 208, name: 'Paneer Fried Rice', price: 230, veg: true },
      { id: 209, name: 'Prawn Fried Rice', price: 320, veg: false },
      { id: 210, name: 'Fish Fried Rice', price: 300, veg: false },
      { id: 211, name: 'Mutton Fried Rice', price: 280, veg: false },
      { id: 212, name: 'Mushroom Noodles', price: 200, veg: true },
      { id: 213, name: 'Prawn Noodles', price: 300, veg: false },
      { id: 214, name: 'Chilli Mushroom', price: 260, veg: true },
      { id: 215, name: 'Chilli Fish', price: 380, veg: false },
      { id: 216, name: 'Chilli Prawns', price: 420, veg: false },
      { id: 217, name: 'Szechuan Chicken', price: 340, veg: false },
      { id: 218, name: 'Szechuan Paneer', price: 300, veg: true },
    ],
    'Main Course - Continental': [
      { id: 128, name: 'Grilled Chicken Steak', price: 450, veg: false },
      { id: 129, name: 'Veg Burger', price: 180, veg: true },
      { id: 130, name: 'Chicken Burger', price: 220, veg: false },
      { id: 131, name: 'Cheese Pizza', price: 320, veg: true },
      { id: 132, name: 'Chicken Pizza', price: 380, veg: false },
      { id: 133, name: 'Pasta Alfredo', price: 280, veg: true },
      { id: 134, name: 'Pasta Bolognese', price: 320, veg: false },
      { id: 135, name: 'Fish & Chips', price: 380, veg: false },
      { id: 219, name: 'Mushroom Pizza', price: 340, veg: true },
      { id: 220, name: 'Paneer Pizza', price: 360, veg: true },
      { id: 221, name: 'Prawn Pizza', price: 450, veg: false },
      { id: 222, name: 'Mushroom Burger', price: 200, veg: true },
      { id: 223, name: 'Fish Burger', price: 260, veg: false },
      { id: 224, name: 'Grilled Fish Steak', price: 480, veg: false },
      { id: 225, name: 'Prawn Grilled', price: 520, veg: false },
      { id: 226, name: 'Mushroom Pasta', price: 300, veg: true },
      { id: 227, name: 'Chicken Pasta', price: 340, veg: false },
      { id: 228, name: 'Seafood Pasta', price: 420, veg: false },
    ],
    'Breads & Rice': [
      { id: 10, name: 'Butter Naan', price: 50, veg: true },
      { id: 11, name: 'Garlic Naan', price: 60, veg: true },
      { id: 12, name: 'Tandoori Roti', price: 25, veg: true },
      { id: 136, name: 'Cheese Naan', price: 80, veg: true },
      { id: 137, name: 'Kulcha', price: 45, veg: true },
      { id: 138, name: 'Paratha', price: 50, veg: true },
      { id: 139, name: 'Jeera Rice', price: 150, veg: true },
      { id: 140, name: 'Plain Rice', price: 100, veg: true },
      { id: 229, name: 'Stuffed Naan', price: 75, veg: true },
      { id: 230, name: 'Keema Naan', price: 120, veg: false },
      { id: 231, name: 'Paneer Paratha', price: 80, veg: true },
      { id: 232, name: 'Mushroom Naan', price: 85, veg: true },
    ],
    'Desserts': [
      { id: 13, name: 'Gulab Jamun', price: 120, veg: true },
      { id: 14, name: 'Ice Cream', price: 100, veg: true },
      { id: 15, name: 'Brownie with Ice Cream', price: 150, veg: true },
      { id: 141, name: 'Rasmalai', price: 140, veg: true },
      { id: 142, name: 'Gajar Halwa', price: 130, veg: true },
      { id: 143, name: 'Chocolate Lava Cake', price: 180, veg: true },
      { id: 144, name: 'Tiramisu', price: 200, veg: true },
      { id: 145, name: 'Fruit Salad', price: 120, veg: true },
      { id: 146, name: 'Cheesecake', price: 220, veg: true },
      { id: 233, name: 'Kheer', price: 90, veg: true },
      { id: 234, name: 'Kulfi', price: 80, veg: true },
      { id: 235, name: 'Jalebi', price: 70, veg: true },
    ],
    'Beverages': [
      { id: 16, name: 'Soft Drink', price: 60, veg: true },
      { id: 17, name: 'Sweet Lassi', price: 80, veg: true },
      { id: 18, name: 'Fresh Juice', price: 120, veg: true },
      { id: 147, name: 'Masala Chai', price: 40, veg: true },
      { id: 148, name: 'Coffee', price: 60, veg: true },
      { id: 149, name: 'Cold Coffee', price: 100, veg: true },
      { id: 150, name: 'Mineral Water', price: 30, veg: true },
      { id: 151, name: 'Mocktail', price: 150, veg: true },
      { id: 152, name: 'Buttermilk', price: 50, veg: true },
      { id: 153, name: 'Filter Coffee', price: 70, veg: true },
      { id: 236, name: 'Fresh Lime Soda', price: 60, veg: true },
      { id: 237, name: 'Virgin Mojito', price: 140, veg: true },
    ],
  };

  // Cafe menu with lighter items - beverages, snacks, and quick bites
  const cafeMenu = {
    'Cold Beverages': [
      { id: 301, name: 'Chocolate Milkshake', price: 120, veg: true },
      { id: 302, name: 'Vanilla Milkshake', price: 110, veg: true },
      { id: 303, name: 'Strawberry Milkshake', price: 130, veg: true },
      { id: 304, name: 'Mango Shake', price: 120, veg: true },
      { id: 305, name: 'Oreo Shake', price: 140, veg: true },
      { id: 306, name: 'Fresh Orange Juice', price: 100, veg: true },
      { id: 307, name: 'Watermelon Juice', price: 90, veg: true },
      { id: 308, name: 'Pineapple Juice', price: 100, veg: true },
      { id: 309, name: 'Mixed Fruit Juice', price: 120, veg: true },
      { id: 310, name: 'Iced Coffee', price: 110, veg: true },
      { id: 311, name: 'Iced Latte', price: 130, veg: true },
      { id: 312, name: 'Cold Coffee', price: 100, veg: true },
      { id: 313, name: 'Iced Tea (Lemon)', price: 80, veg: true },
      { id: 314, name: 'Iced Tea (Peach)', price: 80, veg: true },
    ],
    'Hot Beverages': [
      { id: 315, name: 'Espresso', price: 70, veg: true },
      { id: 316, name: 'Cappuccino', price: 90, veg: true },
      { id: 317, name: 'Latte', price: 100, veg: true },
      { id: 318, name: 'Americano', price: 80, veg: true },
      { id: 319, name: 'Flat White', price: 110, veg: true },
      { id: 320, name: 'Mocha', price: 120, veg: true },
      { id: 321, name: 'Hot Chocolate', price: 100, veg: true },
      { id: 322, name: 'Masala Chai', price: 50, veg: true },
      { id: 323, name: 'Green Tea', price: 60, veg: true },
      { id: 324, name: 'Lemon Tea', price: 50, veg: true },
      { id: 325, name: 'Herbal Tea', price: 70, veg: true },
    ],
    'Mocktails': [
      { id: 326, name: 'Virgin Mojito', price: 140, veg: true },
      { id: 327, name: 'Blue Lagoon', price: 150, veg: true },
      { id: 328, name: 'Fruit Punch', price: 130, veg: true },
      { id: 329, name: 'Pina Colada', price: 160, veg: true },
      { id: 330, name: 'Strawberry Daiquiri', price: 150, veg: true },
      { id: 331, name: 'Mango Tango', price: 140, veg: true },
      { id: 332, name: 'Sunset Orange', price: 130, veg: true },
    ],
    'Sandwiches & Wraps': [
      { id: 333, name: 'Veg Grilled Sandwich', price: 100, veg: true },
      { id: 334, name: 'Paneer Tikka Wrap', price: 130, veg: true },
      { id: 335, name: 'Chicken Wrap', price: 150, veg: false },
      { id: 336, name: 'Falafel Wrap', price: 120, veg: true },
    ],
    'Pastries & Bakery': [
      { id: 337, name: 'Chocolate Croissant', price: 90, veg: true },
      { id: 338, name: 'Blueberry Muffin', price: 80, veg: true },
      { id: 339, name: 'Banana Bread', price: 70, veg: true },
      { id: 340, name: 'Chocolate Brownies', price: 110, veg: true },
    ],
  };

  const [step, setStep] = useState(1);
  const contentRef = React.useRef(null);
  const safePlaceDetails = placeDetails || {};

  const Icon = {
    hotel: FaHotel,
    restaurant: FaUtensils,
    cafe: FaCoffee,
    car: FaCar,
    bike: FaMotorcycle,
    bus: FaBus,
    train: FaTrain,
    flight: FaPlane,
    ship: FaShip,
  }[bookingType] || FaSuitcase;

  const paymentMethods = [
    { id: 'card', label: 'Credit / Debit Card', icon: FaCreditCard },
    { id: 'upi', label: 'UPI', icon: FaMobileAlt },
    { id: 'netbanking', label: 'Net Banking', icon: FaUniversity },
    { id: 'wallet', label: 'Wallet', icon: FaWallet },
    { id: 'cash', label: 'Cash on Arrival', icon: FaMoneyBillWave },
  ];

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const getMenuItemQuantity = (itemId) => selectedMenuItems.find((item) => item.id === itemId)?.quantity || 0;

  const handleMenuItemChange = (item, quantity) => {
    const qty = Number(quantity) || 0;
    console.debug('BookingModal.menuChange', { itemId: item.id, qty });
    setSelectedMenuItems((prev) => {
      const withoutItem = prev.filter((menuItem) => menuItem.id !== item.id);
      if (qty <= 0) return withoutItem;
      return [...withoutItem, { ...item, quantity: qty }];
    });
  };

  const calculatePrice = () => {
    const safePlaceDetails = placeDetails || {};
    const rooms = Number(formData.numberOfRooms) || 1;
    const nights = formData.checkInDate && formData.checkOutDate
      ? Math.max(1, Math.ceil((new Date(formData.checkOutDate) - new Date(formData.checkInDate)) / (1000 * 60 * 60 * 24)))
      : 1;

    let basePrice = Number(safePlaceDetails.basePrice) || 0;

    if (['hotel', 'resort'].includes(bookingType) && selectedRoomType) {
      basePrice = selectedRoomType.price * rooms * nights;
    } else if (bookingType === 'package') {
      basePrice = (Number(safePlaceDetails.basePrice) || 0) * nights;
    } else if (['restaurant', 'cafe'].includes(bookingType)) {
      basePrice = selectedMenuItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    } else if (['car', 'bike', 'bus', 'train', 'flight', 'ship'].includes(bookingType)) {
      basePrice = selectedTransportType ? selectedTransportType.price : basePrice;
    }

    const taxes = Math.round(basePrice * 0.18);
    const serviceFee = Math.round(basePrice * 0.05);
    const totalPrice = Math.round(basePrice + taxes + serviceFee);

    return { basePrice, taxes, serviceFee, totalPrice };
  };

  const pricing = calculatePrice();

  useEffect(() => {
    if (!isOpen) {
      wasOpenRef.current = false;
      return;
    }

    if (wasOpenRef.current) {
      return;
    }
    wasOpenRef.current = true;

    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const todayValue = today.toISOString().split('T')[0];
    const tomorrowValue = tomorrow.toISOString().split('T')[0];
    const timeValue = today.toTimeString().slice(0, 5);

    setStep(1);
    setPaymentMethod('');
    setSelectedMenuItems([]);
    setSelectedRoomType(null);
    setSelectedTransportType(null);

    setFormData((prev) => ({
      ...prev,
      ...defaultFormData,
      checkInDate: defaultFormData.checkInDate || prev.checkInDate || (['hotel', 'resort', 'package'].includes(bookingType) ? todayValue : ''),
      checkOutDate: defaultFormData.checkOutDate || prev.checkOutDate || (['hotel', 'resort', 'package'].includes(bookingType) ? tomorrowValue : ''),
      bookingDate: defaultFormData.bookingDate || prev.bookingDate || (['restaurant', 'cafe'].includes(bookingType) ? todayValue : ''),
      bookingTime: defaultFormData.bookingTime || prev.bookingTime || (['restaurant', 'cafe'].includes(bookingType) ? timeValue : ''),
      departureDate: defaultFormData.departureDate || prev.departureDate || (['car', 'bike', 'bus', 'train', 'flight', 'ship'].includes(bookingType) ? todayValue : ''),
    }));
  }, [isOpen, bookingType, defaultFormData]);

  const handleSubmit = (event) => {
    if (event?.preventDefault) {
      event.preventDefault();
    }

    console.debug('BookingModal.handleSubmit', { bookingType, formData });

    if (['hotel', 'resort', 'package'].includes(bookingType)) {
      if (!formData.checkInDate || !formData.checkOutDate) {
        toast.error('Please select check-in and check-out dates');
        return;
      }
      // normalize date values if user agent supplied different format
      const inDate = new Date(formData.checkInDate);
      const outDate = new Date(formData.checkOutDate);
      if (isNaN(inDate.getTime()) || isNaN(outDate.getTime())) {
        toast.error('Invalid check-in or check-out date');
        return;
      }
      if (outDate < inDate) {
        toast.error('Check-out must be after check-in');
        return;
      }
    }

    if (['restaurant', 'cafe'].includes(bookingType)) {
      if (!formData.bookingDate || !formData.bookingTime) {
        toast.error('Please select a booking date and time');
        return;
      }
    }

    if (['car', 'bike', 'bus', 'train', 'flight', 'ship'].includes(bookingType)) {
      // require basic trip details
      const missing = [];
      if (!formData.departureDate) missing.push('departure date');
      if (!formData.from) missing.push('from');
      if (!formData.to) missing.push('to');
      console.debug('BookingModal.transportValidation', { formData, selectedTransportType, missing });
      if (missing.length > 0) {
        toast.error(`Please enter trip details: ${missing.join(', ')}`);
        return;
      }
    }

    if (Number(formData.adults) + Number(formData.children) < 1) {
      toast.error('Please enter at least one guest');
      return;
    }

    if (['hotel', 'resort'].includes(bookingType) && !selectedRoomType) {
      toast.error('Please select a room type');
      return;
    }

    if (['restaurant', 'cafe'].includes(bookingType) && selectedMenuItems.length === 0) {
      toast.error('Please select at least one menu item');
      return;
    }

    if (['car', 'bike', 'bus', 'train', 'flight', 'ship'].includes(bookingType) && !selectedTransportType) {
      toast.error('Please select a transport option');
      return;
    }

    setStep(2);
    console.debug('BookingModal: moved to step 2');
    toast.success('Continuing to payment');
  };

  // when step changes to payment, ensure modal scrolls to show payment UI and focus first payment method
  useEffect(() => {
    if (step === 2) {
      // try to scroll the payment section into view
      const paymentEl = document.getElementById('booking-payment-section');
      if (paymentEl && typeof paymentEl.scrollIntoView === 'function') {
        paymentEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else if (contentRef.current) {
        try {
          contentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (e) {
          contentRef.current.scrollTop = 0;
        }
      }

      // focus a payment button if visible
      const container = paymentEl || contentRef.current;
      if (container) {
        const firstMethod = container.querySelector('button');
        if (firstMethod && typeof firstMethod.focus === 'function') firstMethod.focus();
      }
    }
  }, [step]);

  const handlePayment = async () => {
    if (!paymentMethod) {
      toast.error('Please select a payment method');
      return;
    }

    setProcessingPayment(true);

    try {
      if (!Number.isFinite(pricing.totalPrice) || pricing.totalPrice <= 0) {
        throw new Error('Please select booking options that result in a valid payment amount');
      }

      const totalGuests = Number(formData.adults) + Number(formData.children);

      if (paymentMethod === 'cash') {
        const bookingData = {
          bookingType,
          bookingDetails: {
            name: safePlaceDetails.name || 'Booking',
            description: safePlaceDetails.description || '',
            location: {
              address: safePlaceDetails.address || '',
              city: safePlaceDetails.city || '',
              country: safePlaceDetails.country || 'India',
              coordinates: safePlaceDetails.coordinates || { lat: 0, lng: 0 },
            },
            rating: safePlaceDetails.rating || 0,
            contactInfo: {
              phone: safePlaceDetails.phone || '',
              email: safePlaceDetails.email || '',
            },
          },
          numberOfGuests: totalGuests,
          guestDetails: {
            adults: Number(formData.adults),
            children: Number(formData.children),
            infants: Number(formData.infants),
          },
          pricing,
          paymentStatus: 'pending',
          paymentMethod,
          paymentDetails: {
            gateway: 'cash',
          },
          specialRequests: formData.specialRequests,
        };

        if (['hotel', 'resort', 'package'].includes(bookingType)) {
          bookingData.checkInDate = formData.checkInDate;
          bookingData.checkOutDate = formData.checkOutDate;
        } else if (['restaurant', 'cafe'].includes(bookingType)) {
          bookingData.bookingDate = formData.bookingDate;
          bookingData.bookingTime = formData.bookingTime;
          if (selectedMenuItems.length > 0) {
            bookingData.restaurantDetails = {
              orderedItems: selectedMenuItems.map((item) => ({
                itemName: item.name,
                quantity: item.quantity,
                price: item.price,
              })),
              totalItems: selectedMenuItems.reduce((sum, item) => sum + item.quantity, 0),
            };
          }
        } else if (['car', 'bike', 'bus', 'train', 'flight', 'ship'].includes(bookingType)) {
          bookingData.departureDate = formData.departureDate;
          if (formData.returnDate) {
            bookingData.returnDate = formData.returnDate;
          }
          bookingData.transportDetails = {
            from: { location: formData.from },
            to: { location: formData.to },
            vehicleType: selectedTransportType ? selectedTransportType.name : (formData.vehicleType || bookingType),
            pricePerUnit: selectedTransportType ? selectedTransportType.price : (safePlaceDetails.basePrice || 1000),
            features: selectedTransportType ? selectedTransportType.features : [],
            capacity: selectedTransportType ? selectedTransportType.capacity : 4,
          };
        }

        const bookingResponse = await bookingAPI.createBooking(bookingData);
        if (!bookingResponse.data?.success) {
          throw new Error(bookingResponse.data?.message || 'Booking creation failed');
        }

        toast.success('Booking confirmed! Pay at arrival.');
        setTimeout(() => onClose(), 1000);
        return;
      }

      const orderResponse = await paymentAPI.createOrder({
        amount: pricing.totalPrice,
        currency: 'INR',
        receipt: `booking_${Date.now()}`,
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
          description: `${bookingType} booking payment`,
          order_id: orderData.orderId,
          theme: { color: '#2563eb' },
          handler: async (paymentResponse) => {
            try {
              const verificationResponse = await paymentAPI.verifyPayment({
                ...paymentResponse,
              });

              if (!verificationResponse.data?.success) {
                throw new Error(verificationResponse.data?.message || 'Payment verification failed');
              }

              const bookingData = {
                bookingType,
                bookingDetails: {
                  name: safePlaceDetails.name || 'Booking',
                  description: safePlaceDetails.description || '',
                  location: {
                    address: safePlaceDetails.address || '',
                    city: safePlaceDetails.city || '',
                    country: safePlaceDetails.country || 'India',
                    coordinates: safePlaceDetails.coordinates || { lat: 0, lng: 0 },
                  },
                  rating: safePlaceDetails.rating || 0,
                  contactInfo: {
                    phone: safePlaceDetails.phone || '',
                    email: safePlaceDetails.email || '',
                  },
                },
                numberOfGuests: totalGuests,
                guestDetails: {
                  adults: Number(formData.adults),
                  children: Number(formData.children),
                  infants: Number(formData.infants),
                },
                pricing,
                paymentStatus: 'paid',
                paymentMethod,
                paymentDetails: {
                  gateway: 'razorpay',
                  orderId: paymentResponse.razorpay_order_id,
                  paymentId: paymentResponse.razorpay_payment_id,
                  signature: paymentResponse.razorpay_signature,
                  paidAt: new Date(),
                },
                specialRequests: formData.specialRequests,
              };

              if (['hotel', 'resort', 'package'].includes(bookingType)) {
                bookingData.checkInDate = formData.checkInDate;
                bookingData.checkOutDate = formData.checkOutDate;
              } else if (['restaurant', 'cafe'].includes(bookingType)) {
                bookingData.bookingDate = formData.bookingDate;
                bookingData.bookingTime = formData.bookingTime;
                if (selectedMenuItems.length > 0) {
                  bookingData.restaurantDetails = {
                    orderedItems: selectedMenuItems.map((item) => ({
                      itemName: item.name,
                      quantity: item.quantity,
                      price: item.price,
                    })),
                    totalItems: selectedMenuItems.reduce((sum, item) => sum + item.quantity, 0),
                  };
                }
              } else if (['car', 'bike', 'bus', 'train', 'flight', 'ship'].includes(bookingType)) {
                bookingData.departureDate = formData.departureDate;
                if (formData.returnDate) {
                  bookingData.returnDate = formData.returnDate;
                }
                bookingData.transportDetails = {
                  from: { location: formData.from },
                  to: { location: formData.to },
                  vehicleType: selectedTransportType ? selectedTransportType.name : (formData.vehicleType || bookingType),
                  pricePerUnit: selectedTransportType ? selectedTransportType.price : (safePlaceDetails.basePrice || 1000),
                  features: selectedTransportType ? selectedTransportType.features : [],
                  capacity: selectedTransportType ? selectedTransportType.capacity : 4,
                };
              }

              const bookingResponse = await bookingAPI.createBooking(bookingData);
              if (!bookingResponse.data?.success) {
                throw new Error(bookingResponse.data?.message || 'Booking creation failed');
              }

              toast.success('Booking confirmed! Check your email for the receipt.');
              setTimeout(() => onClose(), 1000);
              resolve();
            } catch (error) {
              reject(error);
            }
          },
          modal: {
            ondismiss: () => reject(new Error('Payment cancelled by user')),
          },
        });

        razorpay.open();
      });
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Payment failed. Please try again.';
      toast.error(errorMessage, { duration: 6000 });
    } finally {
      setProcessingPayment(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
                <AnimatePresence>
                  <motion.div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <motion.div
                      className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                    >
                      <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Icon className="text-3xl text-white" />
                          <div>
                            <h2 className="text-2xl font-bold text-white">
                              Book {bookingType.charAt(0).toUpperCase() + bookingType.slice(1)}
                            </h2>
                            <p className="text-blue-100 text-sm">{safePlaceDetails.name || 'Complete your booking'}</p>
                          </div>
                        </div>
                        <button onClick={onClose} className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors">
                          <FaTimes className="text-xl" />
                        </button>
                      </div>
                      <div className="px-6 pt-4 pb-2 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-4">
                          <div className={`flex items-center gap-2 ${step === 1 ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 1 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'}`}>
                              1
                            </div>
                            <span className="font-medium">Booking Details</span>
                          </div>
                          <div className="w-12 h-0.5 bg-gray-300 dark:bg-gray-600"></div>
                          <div className={`flex items-center gap-2 ${step === 2 ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 2 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'}`}>
                              2
                            </div>
                            <span className="font-medium">Payment</span>
                          </div>
                        </div>
                      </div>
                      <div ref={contentRef} className="flex-1 overflow-y-auto">
                      {step === 1 && (
                        <div className="p-6 space-y-4">
                          <div className="grid grid-cols-3 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Adults</label>
                              <input
                                type="number"
                                min="1"
                                value={formData.adults}
                                onChange={(e) => setFormData((prev) => ({ ...prev, adults: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Children</label>
                              <input
                                type="number"
                                min="0"
                                value={formData.children}
                                onChange={(e) => setFormData((prev) => ({ ...prev, children: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Infants</label>
                              <input
                                type="number"
                                min="0"
                                value={formData.infants}
                                onChange={(e) => setFormData((prev) => ({ ...prev, infants: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                              />
                            </div>
                          </div>
                          {['hotel', 'resort', 'package'].includes(bookingType) && (
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Check-in Date</label>
                                <input
                                  type="date"
                                  name="checkInDate"
                                  value={formData.checkInDate}
                                  onChange={handleChange}
                                  min={new Date().toISOString().split('T')[0]}
                                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Check-out Date</label>
                                <input
                                  type="date"
                                  name="checkOutDate"
                                  value={formData.checkOutDate}
                                  onChange={handleChange}
                                  min={formData.checkInDate || new Date().toISOString().split('T')[0]}
                                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                                />
                              </div>
                            </div>
                          )}
                          {/* Hotel room categories and number of rooms */}
                          {['hotel', 'resort'].includes(bookingType) && (
                            <div className="mt-4">
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Room Type</label>
                              <div className="grid grid-cols-1 gap-2">
                                {/** Provide some sensible defaults scaled from basePrice if available */}
                                {(['Standard', 'Deluxe', 'Suite']).map((label, idx) => {
                                  const multiplier = idx === 0 ? 1 : idx === 1 ? 1.5 : 2.5;
                                  const price = Math.round((Number(safePlaceDetails.basePrice) || 2000) * multiplier);
                                  return (
                                    <button
                                      key={label}
                                      type="button"
                                      onClick={() => setSelectedRoomType({ id: idx + 1, name: label, price })}
                                      className={`w-full text-left rounded-lg border px-3 py-3 transition-colors ${
                                        selectedRoomType?.name === label
                                          ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                                          : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700'
                                      }`}
                                    >
                                      <div className="flex items-center justify-between">
                                        <div>
                                          <div className="font-medium text-gray-900 dark:text-white">{label}</div>
                                          <div className="text-xs text-gray-500 dark:text-gray-400">{label} room</div>
                                        </div>
                                        <div className="text-sm font-semibold text-blue-600 dark:text-blue-400">₹{price}</div>
                                      </div>
                                    </button>
                                  );
                                })}
                              </div>

                              <div className="mt-3">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Number of Rooms</label>
                                <input
                                  type="number"
                                  min="1"
                                  name="numberOfRooms"
                                  value={formData.numberOfRooms}
                                  onChange={handleChange}
                                  className="w-40 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                                />
                              </div>
                            </div>
                          )}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Special Requests</label>
                            <textarea
                              rows="4"
                              value={formData.specialRequests}
                              onChange={(e) => setFormData((prev) => ({ ...prev, specialRequests: e.target.value }))}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                            />
                          </div>

                          {['restaurant', 'cafe'].includes(bookingType) && (
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Booking Date</label>
                                  <input
                                    type="date"
                                    name="bookingDate"
                                    value={formData.bookingDate}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Booking Time</label>
                                  <input
                                    type="time"
                                    name="bookingTime"
                                    value={formData.bookingTime}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                                  />
                                </div>
                              </div>

                              <div>
                                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                                  Select Menu Items
                                </h4>
                                <div className="max-h-72 overflow-y-auto border border-gray-200 dark:border-gray-600 rounded-lg p-3 space-y-4 bg-gray-50 dark:bg-gray-800">
                                  {Object.entries(bookingType === 'cafe' ? cafeMenu : restaurantMenu).map(([category, items]) => (
                                    <div key={category}>
                                      <div className="text-xs font-bold uppercase tracking-wide text-gray-600 dark:text-gray-300 mb-2">
                                        {category}
                                      </div>
                                      <div className="space-y-2">
                                        {items.map((item) => (
                                          <div
                                            key={item.id}
                                            className="flex items-center justify-between gap-3 rounded-lg bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 px-3 py-2"
                                          >
                                            <div>
                                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                {item.name}
                                              </div>
                                              <div className="text-xs text-gray-500 dark:text-gray-400">₹{item.price}</div>
                                            </div>
                                              <div className="flex items-center gap-2">
                                              <button
                                                type="button"
                                                onClick={(e) => { e.stopPropagation(); handleMenuItemChange(item, Math.max(0, getMenuItemQuantity(item.id) - 1)); }}
                                                className="w-7 h-7 rounded-full bg-gray-200 dark:bg-gray-600 text-gray-900 dark:text-white"
                                              >
                                                -
                                              </button>
                                              <span className="w-6 text-center text-sm font-semibold text-gray-900 dark:text-white">
                                                {getMenuItemQuantity(item.id)}
                                              </span>
                                              <button
                                                type="button"
                                                onClick={(e) => { e.stopPropagation(); handleMenuItemChange(item, getMenuItemQuantity(item.id) + 1); }}
                                                className="w-7 h-7 rounded-full bg-blue-600 text-white"
                                              >
                                                +
                                              </button>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}

                          {['car', 'bike', 'bus', 'train', 'flight', 'ship'].includes(bookingType) && (
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">From</label>
                                  <input
                                    type="text"
                                    name="from"
                                    value={formData.from}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">To</label>
                                  <input
                                    type="text"
                                    name="to"
                                    value={formData.to}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                                  />
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Departure Date</label>
                                  <input
                                    type="date"
                                    name="departureDate"
                                    value={formData.departureDate}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Return Date</label>
                                  <input
                                    type="date"
                                    name="returnDate"
                                    value={formData.returnDate}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                                  />
                                </div>
                              </div>

                              <div>
                                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Select Transport Type</h4>
                                <div className="grid gap-3">
                                  {Object.entries(transportTypes[bookingType] || {}).map(([category, items]) => (
                                    <div key={category} className="space-y-2">
                                      <div className="text-xs font-bold uppercase tracking-wide text-gray-600 dark:text-gray-300">{category}</div>
                                      <div className="space-y-2">
                                        {items.map((transport) => (
                                          <button
                                            key={transport.id}
                                            type="button"
                                            onClick={() => setSelectedTransportType(transport)}
                                            className={`w-full text-left rounded-lg border px-3 py-3 transition-colors ${
                                              selectedTransportType?.id === transport.id
                                                ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                                                : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700'
                                            }`}
                                          >
                                            <div className="flex items-center justify-between gap-3">
                                              <div>
                                                <div className="font-medium text-gray-900 dark:text-white">{transport.name}</div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400">Capacity: {transport.capacity}</div>
                                              </div>
                                              <div className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                                                ₹{transport.price}
                                              </div>
                                            </div>
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      {step === 2 && (
                        <div id="booking-payment-section" className="p-6 space-y-4">
                          <div className="rounded-xl bg-blue-50 dark:bg-blue-900/20 p-4 border border-blue-200 dark:border-blue-800">
                            <p className="text-sm text-blue-700 dark:text-blue-300">Pay securely with Razorpay Checkout.</p>
                            <p className="text-2xl font-bold text-blue-900 dark:text-white mt-1">₹{pricing.totalPrice.toLocaleString()}</p>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            {paymentMethods.map((method) => {
                              const MethodIcon = method.icon;
                              return (
                                <button
                                  key={method.id}
                                  type="button"
                                  onClick={() => setPaymentMethod(method.id)}
                                  className={`p-4 rounded-xl border text-left transition-all ${
                                    paymentMethod === method.id
                                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/30'
                                      : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
                                  }`}
                                >
                                  <div className="flex items-center gap-3">
                                    <MethodIcon className="text-blue-600" />
                                    <span className="font-medium">{method.label}</span>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                      <div className="p-6 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
                        {step === 1 ? (
                          <div className="flex gap-3">
                            <button
                              type="button"
                              onClick={onClose}
                              className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg font-semibold hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={handleSubmit}
                              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2"
                            >
                              <FaCheckCircle />
                              Continue to Payment
                            </button>
                          </div>
                        ) : (
                          <div className="flex gap-3">
                            <button
                              type="button"
                              onClick={() => setStep(1)}
                              disabled={processingPayment}
                              className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg font-semibold hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                              <FaArrowLeft />
                              Back to Details
                            </button>
                            <button
                              type="button"
                              onClick={handlePayment}
                              disabled={processingPayment || !paymentMethod}
                              className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                              {processingPayment ? (
                                <>
                                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                  Processing Payment...
                                </>
                              ) : (
                                <>
                                  <FaLock />
                                  Pay ₹{pricing.totalPrice.toLocaleString()}
                                </>
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                      </div>
                    </motion.div>
                  </motion.div>
                </AnimatePresence>
              );
            };

export default BookingModal;


