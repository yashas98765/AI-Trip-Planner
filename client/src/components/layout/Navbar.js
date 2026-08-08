import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../contexts/AuthContext";
import { useNotifications } from "../../contexts/NotificationContext";
import { Button } from "../ui";
import {
  FaBars,
  FaTimes,
  FaUser,
  FaSignOutAlt,
  FaMapMarkedAlt,
  FaPlane,
  FaRoute,
  FaBell,
  FaChartBar,
  FaDirections,
  FaLocationArrow,
  FaSearch,
  FaTimes as FaClose,
  FaMapPin,
  FaCalendarCheck,
} from "react-icons/fa";
import { mapsAPI } from "../../services/api";
import { toast } from "react-hot-toast";

const Navbar = () => {
  const {
    user,
    isAuthenticated,
    logout,
    hasPermission,
    getRemainingAiRequests,
  } = useAuth();
  const { notifications, unreadCount, markAllAsRead } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showDirections, setShowDirections] = useState(false);
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [originSuggestions, setOriginSuggestions] = useState([]);
  const [destSuggestions, setDestSuggestions] = useState([]);
  const [selectedOrigin, setSelectedOrigin] = useState(null);
  const [selectedDest, setSelectedDest] = useState(null);
  const [loadingDirections, setLoadingDirections] = useState(false);
  const [routeResult, setRouteResult] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  const publicNavigation = [];

  const userNavigation = [
    { name: "Dashboard", href: "/dashboard", icon: FaChartBar },
    { name: "Trip Planner", href: "/trip-planner", icon: FaPlane },
    { name: "My Trips", href: "/trips", icon: FaRoute },
    { name: "My Bookings", href: "/bookings", icon: FaCalendarCheck },
    { name: "Maps", href: "/maps", icon: FaMapMarkedAlt },
    { name: "Profile", href: "/profile", icon: FaUser },
  ];

  const currentNavigation = isAuthenticated ? userNavigation : publicNavigation;

  const handleLogout = async () => {
    await logout();
    setIsOpen(false);
    setShowUserMenu(false);
    navigate("/");
  };

  const searchLocation = async (query, isOrigin = true) => {
    if (query.length < 2) {
      isOrigin ? setOriginSuggestions([]) : setDestSuggestions([]);
      return;
    }

    try {
      const response = await mapsAPI.searchPlaces({ query, limit: 5 });
      const suggestions = response.data.places || [];
      isOrigin ? setOriginSuggestions(suggestions) : setDestSuggestions(suggestions);
    } catch (error) {
      console.error("Search error:", error);
      toast.error("Failed to search locations");
    }
  };

  const handleGetDirections = async () => {
    // If locations are typed but not selected from suggestions, geocode them first
    if (!selectedOrigin && origin.length > 0) {
      toast.error("Please select starting point from the suggestions");
      return;
    }
    if (!selectedDest && destination.length > 0) {
      toast.error("Please select destination from the suggestions");
      return;
    }
    if (!selectedOrigin || !selectedDest) {
      toast.error("Please enter both origin and destination");
      return;
    }

    setLoadingDirections(true);
    try {
      const response = await mapsAPI.getRoute({
        startLat: selectedOrigin.lat,
        startLng: selectedOrigin.lng,
        endLat: selectedDest.lat,
        endLng: selectedDest.lng,
      });

      if (response.data.success) {
        setRouteResult(response.data.data);
        toast.success("Route calculated successfully!");
      }
    } catch (error) {
      console.error("Directions error:", error);
      toast.error(error.response?.data?.message || "Failed to get directions");
    } finally {
      setLoadingDirections(false);
    }
  };

  const handleUseCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          
          try {
            const response = await mapsAPI.reverseGeocode({ lat, lng });
            const locationName = response.data.address || "Current Location";
            setOrigin(locationName);
            setSelectedOrigin({ lat, lng, name: locationName });
            setOriginSuggestions([]);
            toast.success("Using current location");
          } catch (error) {
            setOrigin("Current Location");
            setSelectedOrigin({ lat, lng, name: "Current Location" });
            setOriginSuggestions([]);
            toast.success("Using current location");
          }
        },
        () => {
          toast.error("Unable to get your location");
        }
      );
    } else {
      toast.error("Geolocation is not supported");
    }
  };

  const handleViewOnMap = () => {
    if (routeResult && selectedOrigin && selectedDest) {
      navigate("/maps", {
        state: {
          route: routeResult,
          origin: selectedOrigin,
          destination: selectedDest,
        },
      });
      setShowDirections(false);
    }
  };

  const resetDirections = () => {
    setOrigin("");
    setDestination("");
    setSelectedOrigin(null);
    setSelectedDest(null);
    setOriginSuggestions([]);
    setDestSuggestions([]);
    setRouteResult(null);
  };

  const remainingRequests = getRemainingAiRequests();

  return (
    <nav className="bg-white dark:bg-gray-900 shadow-lg border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50" style={{ overflow: "visible" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" style={{ overflow: "visible", position: "relative" }}>
        <div className="flex justify-between items-center h-16" style={{ overflow: "visible" }}>
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center"
          >
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg blur opacity-75 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative bg-white dark:bg-gray-800 p-1.5 md:p-2 rounded-lg">
                  <FaRoute className="h-5 w-5 md:h-6 md:w-6 text-blue-600 group-hover:text-purple-600 transition-colors" />
                </div>
                <motion.div
                  className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full shadow-lg"
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                />
              </div>
              <div className="flex flex-col">
                <span className="text-lg md:text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  AI Trip Planner
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400 -mt-1">
                  Smart Travel Planning
                </span>
              </div>
            </Link>
          </motion.div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {currentNavigation.slice(0, 6).filter(item => item.name !== 'Profile').map((item, index) => (
              <motion.div
                key={item.name}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Link
                  to={item.href}
                  className={`group flex items-center px-4 py-2.5 text-sm font-medium rounded-xl transition-all duration-300 relative overflow-hidden ${
                    location.pathname === item.href
                      ? "text-white bg-gradient-to-r from-blue-600 to-purple-600 shadow-md"
                      : "text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                >
                  {location.pathname !== item.href && (
                    <span className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></span>
                  )}
                  <item.icon
                    className={`mr-2 h-4 w-4 relative z-10 ${
                      location.pathname === item.href
                        ? ""
                        : "group-hover:scale-110 transition-transform"
                    }`}
                  />
                  <span className="relative z-10">{item.name}</span>
                </Link>
              </motion.div>
            ))}
            
            {/* Directions Button */}
            {isAuthenticated && (
              <motion.button
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => setShowDirections(true)}
                className="group flex items-center px-4 py-2.5 text-sm font-medium rounded-xl transition-all duration-300 relative overflow-hidden text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                title="Get Directions"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></span>
                <FaDirections className="mr-2 h-4 w-4 relative z-10 group-hover:scale-110 transition-transform" />
                <span className="relative z-10">Directions</span>
              </motion.button>
            )}
          </div>

          {/* Right Side Actions */}
          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                {/* AI Usage Indicator */}
                {user?.planType === "free" && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800"
                  >
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                      AI Requests:
                    </span>
                    <span
                      className={`text-sm font-bold ${
                        remainingRequests <= 1
                          ? "text-red-600 dark:text-red-400"
                          : "text-green-600 dark:text-green-400"
                      }`}
                    >
                      {remainingRequests === -1 ? "∞" : remainingRequests}
                    </span>
                  </motion.div>
                )}

                {/* User Menu */}
                <div className="relative" style={{ zIndex: 10000 }}>
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="group flex items-center space-x-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 rounded-xl p-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-300"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center ring-2 ring-white dark:ring-gray-800 shadow-lg group-hover:shadow-xl transition-shadow">
                          <span className="text-white font-bold text-sm">
                            {user?.name?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></div>
                      </div>
                      <div className="hidden lg:block text-left">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {user?.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                          Standard Plan
                        </p>
                      </div>
                    </div>
                  </button>

                  <AnimatePresence>
                    {showUserMenu && (
                      <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 mt-3 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden"
                        style={{ zIndex: 99999, position: 'absolute' }}
                      >
                        <div className="p-2">
                          <Link
                            to="/profile"
                            className="flex items-center w-full px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200 group"
                            onClick={() => setShowUserMenu(false)}
                          >
                            <div className="flex items-center justify-center w-8 h-8 mr-3 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition-colors">
                              <FaUser className="h-4 w-4" />
                            </div>
                            <span>My Profile</span>
                          </Link>
                          
                          <hr className="my-2 border-gray-200 dark:border-gray-700" />
                          
                          <button
                            onClick={handleLogout}
                            className="flex items-center w-full px-4 py-3 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors duration-200 group"
                          >
                            <div className="flex items-center justify-center w-8 h-8 mr-3 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 group-hover:bg-red-200 dark:group-hover:bg-red-900/50 transition-colors">
                              <FaSignOutAlt className="h-4 w-4" />
                            </div>
                            <span>Logout</span>
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center space-x-3"
              >
                <Link to="/login">
                  <button className="px-5 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-300">
                    Login
                  </button>
                </Link>
                <Link to="/register">
                  <button className="px-5 py-2 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg hover:from-blue-700 hover:to-purple-700 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-300">
                    Sign Up
                  </button>
                </Link>
              </motion.div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center space-x-2">
            {location.pathname !== "/" && (
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                {isOpen ? (
                  <FaTimes className="h-6 w-6" />
                ) : (
                  <FaBars className="h-6 w-6" />
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700"
          >
            <div className="px-4 pt-2 pb-3 space-y-1">
              {currentNavigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center px-3 py-2 text-base font-medium rounded-lg ${
                    location.pathname === item.href
                      ? "text-blue-600 bg-blue-50 dark:bg-blue-900/20"
                      : "text-gray-700 dark:text-gray-300 hover:text-blue-600 hover:bg-gray-50 dark:hover:bg-gray-800"
                  }`}
                  onClick={() => setIsOpen(false)}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              ))}
              
              {/* Directions Button Mobile */}
              {isAuthenticated && (
                <button
                  onClick={() => {
                    setShowDirections(true);
                    setIsOpen(false);
                  }}
                  className="flex items-center w-full px-3 py-2 text-base font-medium rounded-lg text-gray-700 dark:text-gray-300 hover:text-blue-600 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <FaDirections className="mr-3 h-5 w-5" />
                  Directions
                </button>
              )}

              {!isAuthenticated && (
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-2">
                  <Link
                    to="/login"
                    className="block px-3 py-2 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg"
                    onClick={() => setIsOpen(false)}
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="block px-3 py-2 text-base font-medium text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"
                    onClick={() => setIsOpen(false)}
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Directions Modal */}
      <AnimatePresence>
        {showDirections && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setShowDirections(false);
                resetDirections();
              }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60]"
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              className="fixed top-4 md:top-20 left-4 right-4 md:left-1/2 md:-translate-x-1/2 w-auto md:w-full max-w-2xl bg-white dark:bg-gray-800 rounded-2xl shadow-2xl z-[70] p-4 md:p-6 max-h-[90vh] md:max-h-[80vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg">
                    <FaDirections className="h-6 w-6 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Get Directions
                  </h2>
                </div>
                <button
                  onClick={() => {
                    setShowDirections(false);
                    resetDirections();
                  }}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <FaClose className="h-5 w-5 text-gray-500" />
                </button>
              </div>

              {/* Origin Input */}
              <div className="mb-4 relative">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Starting Point {selectedOrigin && <span className="text-green-600">✓</span>}
                </label>
                <div className="relative">
                  <FaLocationArrow className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-500" />
                  <input
                    type="text"
                    value={origin}
                    onChange={(e) => {
                      setOrigin(e.target.value);
                      setSelectedOrigin(null); // Clear selection when typing
                      searchLocation(e.target.value, true);
                    }}
                    placeholder="Type to search location..."
                    className={`w-full pl-10 pr-24 py-3 border ${
                      selectedOrigin 
                        ? 'border-green-500 ring-2 ring-green-200' 
                        : 'border-gray-300 dark:border-gray-600'
                    } rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                  />
                  <button
                    onClick={handleUseCurrentLocation}
                    className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                  >
                    Use Current
                  </button>
                </div>

                {/* Origin Suggestions */}
                {originSuggestions.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 max-h-60 overflow-y-auto">
                    {originSuggestions.map((place, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setOrigin(place.name || place.display_name);
                          setSelectedOrigin({
                            lat: place.lat || place.latitude,
                            lng: place.lng || place.lon || place.longitude,
                            name: place.name || place.display_name,
                          });
                          setOriginSuggestions([]);
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-600 border-b border-gray-100 dark:border-gray-600 last:border-0"
                      >
                        <div className="flex items-center space-x-2">
                          <FaMapPin className="h-4 w-4 text-gray-400" />
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {place.name || place.display_name}
                            </p>
                            {place.address && (
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {place.address}
                              </p>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Destination Input */}
              <div className="mb-6 relative">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Destination {selectedDest && <span className="text-green-600">✓</span>}
                </label>
                <div className="relative">
                  <FaMapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-red-500" />
                  <input
                    type="text"
                    value={destination}
                    onChange={(e) => {
                      setDestination(e.target.value);
                      setSelectedDest(null); // Clear selection when typing
                      searchLocation(e.target.value, false);
                    }}
                    placeholder="Type to search location..."
                    className={`w-full pl-10 pr-4 py-3 border ${
                      selectedDest 
                        ? 'border-green-500 ring-2 ring-green-200' 
                        : 'border-gray-300 dark:border-gray-600'
                    } rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                  />
                </div>

                {/* Destination Suggestions */}
                {destSuggestions.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 max-h-60 overflow-y-auto">
                    {destSuggestions.map((place, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setDestination(place.name || place.display_name);
                          setSelectedDest({
                            lat: place.lat || place.latitude,
                            lng: place.lng || place.lon || place.longitude,
                            name: place.name || place.display_name,
                          });
                          setDestSuggestions([]);
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-600 border-b border-gray-100 dark:border-gray-600 last:border-0"
                      >
                        <div className="flex items-center space-x-2">
                          <FaMapPin className="h-4 w-4 text-gray-400" />
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {place.name || place.display_name}
                            </p>
                            {place.address && (
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {place.address}
                              </p>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Get Directions Button */}
              {!routeResult && (
                <div>
                  {!selectedOrigin || !selectedDest ? (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 text-center">
                      💡 Type and select locations from the dropdown suggestions
                    </p>
                  ) : null}
                  <button
                    onClick={handleGetDirections}
                    disabled={!selectedOrigin || !selectedDest || loadingDirections}
                    className="w-full py-3 px-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl"
                  >
                    {loadingDirections ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Calculating Route...
                      </span>
                    ) : (
                      "Get Directions"
                    )}
                  </button>
                </div>
              )}

              {/* Route Result */}
              {routeResult && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 p-4 bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-xl border border-green-200 dark:border-green-800"
                >
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                    Route Details
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-white dark:bg-gray-700 p-3 rounded-lg">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Distance</p>
                      <p className="text-xl font-bold text-blue-600">
                        {(routeResult.totalDistance / 1000).toFixed(1)} km
                      </p>
                    </div>
                    <div className="bg-white dark:bg-gray-700 p-3 rounded-lg">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Duration</p>
                      <p className="text-xl font-bold text-purple-600">
                        {Math.round(routeResult.totalDuration / 60)} min
                      </p>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <button
                      onClick={handleViewOnMap}
                      className="flex-1 py-2.5 px-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300"
                    >
                      View on Map
                    </button>
                    <button
                      onClick={resetDirections}
                      className="py-2.5 px-4 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 font-medium rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                    >
                      New Route
                    </button>
                  </div>
                </motion.div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
