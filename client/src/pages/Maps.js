import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import { useLocation } from "react-router-dom";
// Clustering temporarily disabled until dependency installed
// import MarkerClusterGroup from "react-leaflet-cluster";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { toast } from "react-hot-toast";
import { mapsAPI, reviewAPI } from "../services/api";
import {
  FaMapMarkedAlt,
  FaLocationArrow,
  FaSearch,
  FaStar,
  FaBookmark,
  FaTrash,
  FaMapPin,
  FaHeart,
  FaTimes,
  FaExternalLinkAlt,
  FaInfoCircle,
  FaDirections,
  FaTicketAlt,
  FaCar,
  FaMotorcycle,
  FaBus,
  FaTrain,
  FaPlane,
  FaShip,
  FaCloudSun,
  FaShoppingBag,
  FaHospital,
  FaPrescription,
  FaCalendar,
} from "react-icons/fa";
import { LoadingSpinner, WeatherWidget } from "../components/ui";
import BookingModal from "../components/booking/BookingModal";
import GasStationBookingModal from "../components/booking/GasStationBookingModal";
import GasAgencyBookingModal from "../components/booking/GasAgencyBookingModal";
import ShoppingMallBookingModal from "../components/booking/ShoppingMallBookingModal";
import HospitalBookingModal from "../components/booking/HospitalBookingModal";
import PharmacyBookingModal from "../components/booking/PharmacyBookingModal";
import EventBookingModal from "../components/booking/EventBookingModal";
import WellnessBookingModal from "../components/booking/WellnessBookingModal";
import ActivityBookingModal from "../components/booking/ActivityBookingModal";

// Fix default icon paths for Leaflet in bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});

const defaultCenter = { lat: 13.0333, lng: 77.6972 }; // Medahalli (Old Madras Road), Bangalore
const defaultZoom = 15; // Street view

const Recenter = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, zoom || 14);
    }
  }, [center, zoom, map]);
  return null;
};

const FitBounds = ({ bounds }) => {
  const map = useMap();
  useEffect(() => {
    if (bounds && bounds.length === 2) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [bounds, map]);
  return null;
};

const InvalidateSize = () => {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 100);
    return () => clearTimeout(timer);
  }, [map]);
  return null;
};

const Maps = () => {
  const routerLocation = useLocation();
  const [center, setCenter] = useState(defaultCenter);
  const [zoom, setZoom] = useState(defaultZoom);
  const [mapBounds, setMapBounds] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [places, setPlaces] = useState([]);
  const [savedLocations, setSavedLocations] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [radiusKm, setRadiusKm] = useState(15);
  const [sortBy, setSortBy] = useState("distance");
  const [error, setError] = useState(null);
  const [placeType, setPlaceType] = useState("all");
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("nearby");
  const [placeDetails, setPlaceDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [weather, setWeather] = useState(null);
  const [loadingWeather, setLoadingWeather] = useState(false);
  const [recommendations, setRecommendations] = useState([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [placeReviews, setPlaceReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [newReview, setNewReview] = useState({ rating: 5, title: "", comment: "" });
  
  // Route state from directions
  const [routeData, setRouteData] = useState(null);
  const [routeOrigin, setRouteOrigin] = useState(null);
  const [routeDest, setRouteDest] = useState(null);

  // Directions tab state
  const [directionsOrigin, setDirectionsOrigin] = useState("");
  const [directionsDestination, setDirectionsDestination] = useState("");
  const [selectedDirectionsOrigin, setSelectedDirectionsOrigin] = useState(null);
  const [selectedDirectionsDest, setSelectedDirectionsDest] = useState(null);
  const [directionsOriginSuggestions, setDirectionsOriginSuggestions] = useState([]);
  const [directionsDestSuggestions, setDirectionsDestSuggestions] = useState([]);
  const [directionsLoading, setDirectionsLoading] = useState(false);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [selectedPlaceForBooking, setSelectedPlaceForBooking] = useState(null);
  const [bookingType, setBookingType] = useState('hotel');
  const [gasStationModalOpen, setGasStationModalOpen] = useState(false);
  const [selectedGasStation, setSelectedGasStation] = useState(null);
  const [gasAgencyModalOpen, setGasAgencyModalOpen] = useState(false);
  const [selectedGasAgency, setSelectedGasAgency] = useState(null);
  const [shoppingMallModalOpen, setShoppingMallModalOpen] = useState(false);
  const [selectedShoppingMall, setSelectedShoppingMall] = useState(null);
  const [hospitalModalOpen, setHospitalModalOpen] = useState(false);
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [pharmacyModalOpen, setPharmacyModalOpen] = useState(false);
  const [selectedPharmacy, setSelectedPharmacy] = useState(null);
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [wellnessModalOpen, setWellnessModalOpen] = useState(false);
  const [selectedWellness, setSelectedWellness] = useState(null);
  const [activityModalOpen, setActivityModalOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [selectedActivityType, setSelectedActivityType] = useState('adventure');
  const [nearbySearchQuery, setNearbySearchQuery] = useState("");

  // Get user's current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setCurrentLocation(userLocation);
          setCenter(userLocation);
          setZoom(14);
          setMapBounds(null); // Clear bounds
          toast.success("Location detected");
        },
        () => {
          // If geolocation fails, use default location (Medahalli)
          setCurrentLocation(defaultCenter);
          toast("Using default location (Medahalli, Old Madras Road)", { icon: "ℹ️" });
        },
        { enableHighAccuracy: true }
      );
    } else {
      // No geolocation support, use default location
      setCurrentLocation(defaultCenter);
    }
  }, []);

  // Handle route from navigation (directions modal)
  useEffect(() => {
    if (routerLocation.state?.route) {
      const { route, origin, destination } = routerLocation.state;
      setRouteData(route);
      setRouteOrigin(origin);
      setRouteDest(destination);
      
      // Calculate bounds to fit the entire route
      if (origin && destination) {
        const bounds = [
          [Math.min(origin.lat, destination.lat), Math.min(origin.lng, destination.lng)],
          [Math.max(origin.lat, destination.lat), Math.max(origin.lng, destination.lng)]
        ];
        setMapBounds(bounds);
      }
      
      setActiveTab("route");
      toast.success("Route loaded successfully!");
    }
  }, [routerLocation.state]);

  // Fetch nearby places when location/type/radius or sort changes
  useEffect(() => {
    if (currentLocation) {
      fetchNearbyPlaces();
      fetchSavedLocations();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentLocation, placeType, radiusKm, sortBy]);

  const haversineKm = (lat1, lon1, lat2, lon2) => {
    const toRad = (d) => (d * Math.PI) / 180;
    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const fetchNearbyPlaces = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Start with user-selected radius (minimum 500m)
      let searchRadius = Math.max(500, Math.floor(radiusKm * 1000));
      let currentRadiusKm = radiusKm;
      let results = [];
      let attempts = 0;
      const maxAttempts = 3;
      
      // Progressive search: try expanding radius if no results
      while (results.length === 0 && attempts < maxAttempts) {
        const { data } = await mapsAPI.getNearbyPlaces({
          lat: currentLocation.lat,
          lng: currentLocation.lng,
          type: placeType === 'all' ? null : placeType,
          radius: searchRadius,
        });
        
        if (data.success) {
          const list = (data.data.places || []).map((p) => ({
            ...p,
            _distanceKm: haversineKm(
              currentLocation.lat,
              currentLocation.lng,
              p.geometry.location.lat,
              p.geometry.location.lng
            ),
          }));
          results = list;
        }
        
        // If no results and haven't reached max attempts, expand radius
        if (results.length === 0 && attempts < maxAttempts - 1) {
          currentRadiusKm = Math.min(currentRadiusKm * 2, 100); // Double radius, max 100km
          searchRadius = Math.floor(currentRadiusKm * 1000);
          attempts++;
        } else {
          break;
        }
      }
      
      const sorted =
        sortBy === "distance"
          ? results.sort((a, b) => a._distanceKm - b._distanceKm)
          : results.sort((a, b) => a.name.localeCompare(b.name));
      setPlaces(sorted);
      
      if (sorted.length === 0) {
        const typeText = placeType === 'all' ? 'places' : placeType.replace('_', ' ');
        toast(`No ${typeText} found even within ${currentRadiusKm.toFixed(1)} km. Try a different location or type.`, {
          icon: "ℹ️",
          duration: 5000,
        });
      } else {
        const expandedMsg = attempts > 0 ? ` (expanded search to ${currentRadiusKm.toFixed(1)} km)` : '';
        toast.success(`Found ${sorted.length} place${sorted.length > 1 ? 's' : ''}${expandedMsg}`);
      }
    } catch (err) {
      console.error('Nearby places error:', err);
      setPlaces([]);
      setError(err.response?.data?.message || 'Failed to load nearby places');
    } finally {
      setLoading(false);
    }
  };

  const fetchSavedLocations = async () => {
    try {
      const res = await mapsAPI.getSavedLocations();
      if (res.data.success) {
        setSavedLocations(
          res.data.data?.savedDestinations || res.data.savedDestinations || []
        );
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchWeather = async (location) => {
    try {
      setLoadingWeather(true);
      const { data } = await mapsAPI.getCurrentWeather({
        lat: location.lat,
        lng: location.lng,
      });
      if (data.success) {
        setWeather(data.data);
      }
    } catch (error) {
      console.error("Weather fetch error:", error);
    } finally {
      setLoadingWeather(false);
    }
  };

  const fetchRecommendations = async () => {
    if (!currentLocation) return;
    
    try {
      setLoadingRecommendations(true);
      const { data } = await mapsAPI.getRecommendations({
        lat: currentLocation.lat,
        lng: currentLocation.lng,
        radius: radiusKm * 1000,
        minRating: 3.5,
      });
      if (data.success) {
        setRecommendations(data.data.recommendations || []);
      }
    } catch (error) {
      console.error("Recommendations fetch error:", error);
      toast.error("Failed to load recommendations", { id: "recommendations-load-error" });
    } finally {
      setLoadingRecommendations(false);
    }
  };

  // Fetch recommendations when switching to hotels tab
  useEffect(() => {
    if (activeTab === "hotels" && currentLocation) {
      fetchRecommendations();
    }
  }, [activeTab, currentLocation, radiusKm]);

  const fetchPlaceReviews = async (placeId) => {
    try {
      setLoadingReviews(true);
      const { data } = await reviewAPI.getPlaceReviews(placeId);
      if (data.success) {
        setPlaceReviews(data.data.reviews || []);
      }
    } catch (error) {
      console.error("Reviews fetch error:", error);
    } finally {
      setLoadingReviews(false);
    }
  };

  const submitReview = async () => {
    if (!newReview.title.trim() || !newReview.comment.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      const { data } = await reviewAPI.createReview({
        placeId: placeDetails.place_id,
        placeName: placeDetails.name,
        placeType: placeDetails.types?.[0] || "place",
        rating: newReview.rating,
        title: newReview.title,
        comment: newReview.comment,
      });

      if (data.success) {
        toast.success("Review submitted!");
        setShowReviewForm(false);
        setNewReview({ rating: 5, title: "", comment: "" });
        fetchPlaceReviews(placeDetails.place_id);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to submit review");
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      toast.error("Please enter a location to search");
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const res = await mapsAPI.geocodeAddress({ address: searchQuery });
      
      if (res.data?.success && res.data?.result?.location) {
        const loc = res.data.result.location;
        setCenter(loc);
        setZoom(14);
        setMapBounds(null);
        setCurrentLocation(loc);
        toast.success(`Found: ${res.data.result.formatted_address || searchQuery}`);
        setSearchQuery(""); // Clear search after success
        
        // Fetch weather for the location
        fetchWeather(loc);
      } else {
        toast.error("Location not found. Please try a different search term.");
      }
    } catch (e) {
      console.error("Search error:", e);
      
      // Show specific error message from server if available
      const errorMessage = e.response?.data?.message || "Search failed. Please check your internet connection and try again.";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Directions removed per user request

  const saveLocation = async (lat, lng, suggestedName) => {
    try {
      // Duplicate check within 100m
      const isDuplicate = savedLocations.some((loc) => {
        const d = haversineKm(
          lat,
          lng,
          loc.coordinates.lat,
          loc.coordinates.lng
        );
        return d <= 0.1; // 100 meters
      });
      if (isDuplicate) {
        toast("This location (or very close) is already saved.", {
          icon: "ℹ️",
        });
        return;
      }

      // Ask for a friendly name
      let name = window.prompt(
        "Save location as:",
        suggestedName || "Saved place"
      );
      if (!name || !name.trim()) return;
      name = name.trim();

      // Get human-readable address via free reverse geocode to avoid Google
      let address = `${lat}, ${lng}`;
      try {
        const rev = await mapsAPI.reverseGeocode({ lat, lng });
        address = rev.data?.result?.formatted_address || address;
      } catch {}
      const response = await mapsAPI.saveLocation({ name, lat, lng, address });
      if (response.data.success) {
        toast.success("Location saved");
        fetchSavedLocations();
      }
    } catch (error) {
      console.error("Save location error:", error);
      toast.error(error.response?.data?.message || "Failed to save location");
    }
  };

  const deleteLocation = async (id) => {
    try {
      const response = await mapsAPI.deleteSavedLocation(id);
      if (response.data.success) {
        toast.success("Location removed");
        fetchSavedLocations();
      }
    } catch (error) {
      console.error("Delete location error:", error);
      toast.error("Failed to remove location");
    }
  };

  const fetchPlaceDetails = async (place) => {
    setLoadingDetails(true);
    setShowReviewForm(false);
    setNewReview({ rating: 5, title: "", comment: "" });
    
    try {
      // Try to fetch Wikipedia info based on place name
      const searchQuery = `${place.name} ${place.vicinity || ''}`;
      const wikiResponse = await fetch(
        `https://en.wikipedia.org/w/api.php?action=query&format=json&origin=*&prop=extracts|pageimages&exintro=1&explaintext=1&piprop=thumbnail&pithumbsize=400&titles=${encodeURIComponent(searchQuery)}`
      );
      const wikiData = await wikiResponse.json();
      
      let wikiInfo = null;
      if (wikiData.query && wikiData.query.pages) {
        const pageId = Object.keys(wikiData.query.pages)[0];
        if (pageId !== '-1') {
          const page = wikiData.query.pages[pageId];
          wikiInfo = {
            title: page.title,
            extract: page.extract,
            thumbnail: page.thumbnail?.source,
            url: `https://en.wikipedia.org/wiki/${encodeURIComponent(page.title)}`
          };
        }
      }
      
      setPlaceDetails({
        ...place,
        wikipedia: wikiInfo
      });

      // Fetch reviews for this place
      if (place.place_id) {
        fetchPlaceReviews(place.place_id);
      }
    } catch (error) {
      console.error('Error fetching place details:', error);
      setPlaceDetails(place);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handlePlaceClick = (place) => {
    setCenter({
      lat: place.geometry.location.lat,
      lng: place.geometry.location.lng,
    });
    setZoom(16); // Closer zoom for place details
    setMapBounds(null);
    fetchPlaceDetails(place);
  };

  // Directions tab handlers
  const searchDirectionsLocation = async (query, isOrigin) => {
    if (query.length < 2) {
      if (isOrigin) {
        setDirectionsOriginSuggestions([]);
      } else {
        setDirectionsDestSuggestions([]);
      }
      return;
    }

    try {
      // Make Medahalli more specific to get correct location
      let searchQuery = query;
      if (query.toLowerCase().trim() === 'medahalli') {
        searchQuery = 'Medahalli, Old Madras Road, Bangalore';
      }
      
      const response = await mapsAPI.searchPlaces({ query: searchQuery, limit: 5 });
      const suggestions = response.data.results || [];
      
      if (isOrigin) {
        setDirectionsOriginSuggestions(suggestions);
      } else {
        setDirectionsDestSuggestions(suggestions);
      }
    } catch (error) {
      console.error("Search error:", error);
      toast.error("Failed to search locations");
    }
  };

  const handleDirectionsOriginChange = (value) => {
    setDirectionsOrigin(value);
    setSelectedDirectionsOrigin(null);
    searchDirectionsLocation(value, true);
  };

  const handleDirectionsDestChange = (value) => {
    setDirectionsDestination(value);
    setSelectedDirectionsDest(null);
    searchDirectionsLocation(value, false);
  };

  const handleSelectDirectionsOrigin = (place) => {
    setDirectionsOrigin(place.name || place.display_name);
    setSelectedDirectionsOrigin({
      name: place.name || place.display_name,
      lat: place.lat,
      lng: place.lon,
    });
    setDirectionsOriginSuggestions([]);
  };

  const handleSelectDirectionsDest = (place) => {
    setDirectionsDestination(place.name || place.display_name);
    setSelectedDirectionsDest({
      name: place.name || place.display_name,
      lat: place.lat,
      lng: place.lon,
    });
    setDirectionsDestSuggestions([]);
  };

  const handleUseCurrentLocationForDirections = async () => {
    if (!currentLocation) {
      toast.error("Current location not available");
      return;
    }

    try {
      const response = await mapsAPI.reverseGeocode({
        lat: currentLocation.lat,
        lng: currentLocation.lng,
      });
      
      const address = response.data?.result?.formatted_address || "Current Location";
      setDirectionsOrigin(address);
      setSelectedDirectionsOrigin({
        name: address,
        lat: currentLocation.lat,
        lng: currentLocation.lng,
      });
      toast.success("Using current location as starting point");
    } catch (error) {
      console.error("Reverse geocode error:", error);
      setDirectionsOrigin("Current Location");
      setSelectedDirectionsOrigin({
        name: "Current Location",
        lat: currentLocation.lat,
        lng: currentLocation.lng,
      });
      toast.success("Using current location as starting point");
    }
  };

  const handleGetDirectionsFromTab = async () => {
    setDirectionsLoading(true);
    
    try {
      let originToUse = selectedDirectionsOrigin;
      let destToUse = selectedDirectionsDest;

      // If user typed but didn't select from dropdown, geocode it
      if (!originToUse && directionsOrigin.trim()) {
        toast.loading("Searching for starting point...");
        
        // Make Medahalli more specific to avoid wrong location
        let searchQuery = directionsOrigin;
        if (directionsOrigin.toLowerCase().trim() === 'medahalli') {
          searchQuery = 'Medahalli, Old Madras Road, Bangalore';
        }
        
        const geocodeResponse = await mapsAPI.geocodeAddress({ address: searchQuery });
        
        if (geocodeResponse.data.success && geocodeResponse.data.result) {
          const result = geocodeResponse.data.result;
          originToUse = {
            name: result.formatted_address || directionsOrigin,
            lat: result.location.lat,
            lng: result.location.lng,
          };
          setSelectedDirectionsOrigin(originToUse);
          toast.dismiss();
        } else {
          toast.dismiss();
          toast.error("Starting point not found. Please try a different location.");
          setDirectionsLoading(false);
          return;
        }
      }

      if (!destToUse && directionsDestination.trim()) {
        toast.loading("Searching for destination...");
        
        // Make Medahalli more specific to avoid wrong location
        let searchQuery = directionsDestination;
        if (directionsDestination.toLowerCase().trim() === 'medahalli') {
          searchQuery = 'Medahalli, Old Madras Road, Bangalore';
        }
        
        const geocodeResponse = await mapsAPI.geocodeAddress({ address: searchQuery });
        
        if (geocodeResponse.data.success && geocodeResponse.data.result) {
          const result = geocodeResponse.data.result;
          destToUse = {
            name: result.formatted_address || directionsDestination,
            lat: result.location.lat,
            lng: result.location.lng,
          };
          setSelectedDirectionsDest(destToUse);
          toast.dismiss();
        } else {
          toast.dismiss();
          toast.error("Destination not found. Please try a different location.");
          setDirectionsLoading(false);
          return;
        }
      }

      // Final validation
      if (!originToUse) {
        toast.error("Please enter a starting point");
        setDirectionsLoading(false);
        return;
      }
      if (!destToUse) {
        toast.error("Please enter a destination");
        setDirectionsLoading(false);
        return;
      }

      toast.loading("Calculating route...");

      const response = await mapsAPI.getRoute({
        startLat: originToUse.lat,
        startLng: originToUse.lng,
        endLat: destToUse.lat,
        endLng: destToUse.lng,
      });

      const route = response.data.data;
      setRouteData(route);
      setRouteOrigin(originToUse);
      setRouteDest(destToUse);

      // Calculate bounds
      const lats = [originToUse.lat, destToUse.lat];
      const lngs = [originToUse.lng, destToUse.lng];
      const minLat = Math.min(...lats);
      const maxLat = Math.max(...lats);
      const minLng = Math.min(...lngs);
      const maxLng = Math.max(...lngs);
      setMapBounds([[minLat, minLng], [maxLat, maxLng]]);

      setActiveTab("route");
      toast.dismiss();
      toast.success("Route calculated successfully!");
    } catch (error) {
      console.error("Get route error:", error);
      toast.dismiss();
      toast.error(error.response?.data?.message || "Failed to get route");
    } finally {
      setDirectionsLoading(false);
    }
  };

  const resetDirectionsForm = () => {
    setDirectionsOrigin("");
    setDirectionsDestination("");
    setSelectedDirectionsOrigin(null);
    setSelectedDirectionsDest(null);
    setDirectionsOriginSuggestions([]);
    setDirectionsDestSuggestions([]);
  };

  // Directions removed - no polyline

  return (
    <div
      className="w-full bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-slate-950 dark:to-gray-900"
      style={{ minHeight: "calc(100vh - 64px)", height: "auto", overflow: "visible", position: "relative" }}
    >
      {/* Main Content */}
      <div className="w-full min-h-screen relative">
        {/* Enhanced Sidebar */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              initial={{ x: "-100%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "-100%", opacity: 0 }}
              transition={{ type: "spring", damping: 20 }}
              className="absolute top-0 left-0 h-full w-full md:w-96 bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl border-r border-gray-200/50 dark:border-gray-700/50 shadow-2xl overflow-y-auto"
              style={{ zIndex: 30 }}
            >
              {/* Enhanced Tabs */}
              <div className="flex gap-2 p-2 md:p-4 bg-gradient-to-r from-blue-50/80 via-purple-50/80 to-pink-50/80 dark:from-gray-800 dark:to-gray-800 border-b border-gray-200/50 dark:border-gray-700/50">
                {[
                  { id: "nearby", label: "Nearby", icon: FaMapPin },
                  { id: "directions", label: "Directions", icon: FaDirections },
                  { id: "transport", label: "Transport", icon: FaCar },
                  { id: "weather", label: "Weather", icon: FaCloudSun },
                  { id: "hotels", label: "Hotels", icon: FaStar },
                  { id: "saved", label: "Saved", icon: FaHeart },
                  ...(routeData ? [{ id: "route", label: "Route", icon: FaLocationArrow }] : []),
                ].map((tab) => (
                  <motion.button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 md:px-6 md:py-3 text-sm font-bold rounded-2xl transition-all ${
                      activeTab === tab.id
                        ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/30"
                        : "text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-700/70 shadow-sm"
                    }`}
                  >
                    <tab.icon className="h-5 w-5" />
                    <span className={`${tab.id === 'route' && 'hidden sm:inline'}`}>{tab.label}</span>
                  </motion.button>
                ))}
              </div>

              {/* Enhanced Nearby Places Tab */}
              {activeTab === "nearby" && (
                <div className="p-3 space-y-3 md:p-6 md:space-y-6">
                  {/* Search Places Input */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                      <FaSearch className="h-4 w-4 text-blue-600" />
                      Search Places
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={nearbySearchQuery}
                        onChange={(e) => setNearbySearchQuery(e.target.value)}
                        placeholder="Search for places..."
                        className="w-full px-4 py-3 pr-10 border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 shadow-sm text-gray-900 dark:text-white placeholder-gray-400 transition-all"
                      />
                      <FaSearch className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    </div>
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                      <FaMapPin className="h-4 w-4 text-blue-600" />
                      Place Type
                    </label>
                    <select
                      value={placeType}
                      onChange={(e) => setPlaceType(e.target.value)}
                      className="w-full px-3 py-2 md:px-4 md:py-3 border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 shadow-sm text-gray-900 dark:text-white font-semibold transition-all cursor-pointer"
                    >
                      <option value="all">All Places</option>
                      <option value="tourist_attraction">
                        Tourist Attractions
                      </option>
                      <option value="restaurant">Restaurants</option>
                      <option value="cafe">Cafes</option>
                      <option value="lodging">Hotels</option>
                      <option value="museum">Museums</option>
                      <option value="park">Parks</option>
                      <option value="temple">Temples</option>
                      <option value="mosque">Mosques</option>
                      <option value="church">Churches</option>
                      <option value="shopping_mall">Shopping Malls</option>
                      <option value="hospital">Hospitals</option>
                      <option value="pharmacy">Pharmacies</option>
                      <option value="atm">ATMs</option>
                      <option value="bank">Banks</option>
                      <option value="gas_station">Gas Stations</option>
                      <option value="gas_agency">Gas Agency</option>
                      <option value="event">Events Activities</option>
                      <option value="wellness">Wellness & Spa</option>
                      <option value="car_rental">Car Rentals</option>
                      <option value="adventure">Adventure Activities</option>
                      <option value="theme_park">Theme Parks</option>
                      <option value="guided_tour">Guided Tours</option>
                      <option value="cruise">Cruise</option>
                      <option value="boat_ride">Boat Ride</option>
                      <option value="hostel">Hostel</option>
                      <option value="resort">Resorts</option>
                      <option value="homestay">Homestay</option>
                    </select>
                  </div>

                  {/* Enhanced Radius and Sorting Controls */}
                  <div className="grid grid-cols-1 gap-6">
                    <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-700 dark:to-gray-700 p-3 md:p-4 rounded-2xl">
                      <label className="flex items-center justify-between text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 md:mb-3">
                        <span>Search Radius</span>
                        <span className="px-3 py-1 bg-blue-600 text-white rounded-full text-xs font-bold">
                          {radiusKm} km
                        </span>
                      </label>
                      <input
                        type="range"
                        min="0.5"
                        max="100"
                        step="0.5"
                        value={radiusKm}
                        onChange={(e) =>
                          setRadiusKm(parseFloat(e.target.value))
                        }
                        className="w-full h-2 rounded-full accent-blue-600 cursor-pointer"
                      />
                      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-2">
                        <span>0.5 km</span>
                        <span>50 km</span>
                        <span>100 km</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                        Sort By
                      </label>
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="w-full px-3 py-2 md:px-4 md:py-3 border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 shadow-sm text-gray-900 dark:text-white font-semibold transition-all cursor-pointer"
                      >
                        <option value="distance">Distance</option>
                        <option value="name">Name</option>
                      </select>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={fetchNearbyPlaces}
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 text-white font-bold px-6 py-4 rounded-2xl shadow-lg hover:shadow-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <FaMapMarkedAlt className="h-5 w-5" />
                      {loading ? "Loading..." : "Refresh Nearby"}
                    </motion.button>
                  </div>

                  {error && (
                    <div className="mb-4 p-3 bg-red-50 text-red-700 rounded border border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800">
                      {error}
                    </div>
                  )}

                  {loading && (
                    <div className="flex justify-center py-8">
                      <LoadingSpinner />
                    </div>
                  )}

                  <div className="space-y-3 md:space-y-4">
                    {places
                      .filter(place => {
                        // Filter by nearby search query
                        if (nearbySearchQuery.trim()) {
                          const searchLower = nearbySearchQuery.toLowerCase();
                          return (
                            place.name?.toLowerCase().includes(searchLower) ||
                            place.vicinity?.toLowerCase().includes(searchLower) ||
                            place.types?.some(type => type.toLowerCase().includes(searchLower))
                          );
                        }
                        return true;
                      })
                      .map((place, index) => (
                      <motion.div
                        key={place.place_id || index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05, type: "spring" }}
                        whileHover={{
                          scale: 1.03,
                          y: -4,
                          boxShadow: "0 20px 40px rgba(0,0,0,0.1)",
                        }}
                        className="bg-white dark:bg-gray-700 rounded-2xl p-3 md:p-5 border-2 border-gray-100 dark:border-gray-600 shadow-md hover:shadow-2xl transition-all group"
                        onClick={() => handlePlaceClick(place)}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                            <FaMapPin className="h-6 w-6 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-gray-900 dark:text-white text-base mb-1 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                              {place.name}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
                              {place.vicinity}
                            </p>
                            <div className="flex items-center gap-3 flex-wrap">
                              {place.rating && (
                                <div className="flex items-center gap-1 bg-yellow-50 dark:bg-yellow-900/20 px-2 py-1 rounded-lg">
                                  <FaStar className="h-4 w-4 text-yellow-500" />
                                  <span className="text-sm font-bold text-gray-900 dark:text-white">
                                    {place.rating}
                                  </span>
                                </div>
                              )}
                              {typeof place._distanceKm === "number" && (
                                <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-lg">
                                  {place._distanceKm.toFixed(2)} km away
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="mt-3 flex gap-2">
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              saveLocation(
                                place.geometry.location.lat,
                                place.geometry.location.lng,
                                place.name
                              );
                            }}
                            className="flex-1 text-sm bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2.5 rounded-xl hover:shadow-lg flex items-center justify-center gap-2 font-bold transition-all"
                          >
                            <FaBookmark className="h-4 w-4" />
                            Save
                          </motion.button>
                          
                          {/* Book Fuel button for gas stations */}
                          {(placeType === 'gas_station' || place.types?.includes('gas_station')) && (
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedGasStation({
                                  name: place.name,
                                  address: place.vicinity,
                                  location: {
                                    lat: place.geometry.location.lat,
                                    lng: place.geometry.location.lng,
                                    address: place.vicinity,
                                  },
                                  coordinates: place.geometry.location,
                                  rating: place.rating,
                                  types: place.types,
                                });
                                setGasStationModalOpen(true);
                              }}
                              className="flex-1 text-sm bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-2.5 rounded-xl hover:shadow-lg flex items-center justify-center gap-2 font-bold transition-all"
                            >
                              <FaTicketAlt className="h-4 w-4" />
                              Book Fuel
                            </motion.button>
                          )}
                          
                          {/* Book Gas Cylinder button for gas agencies */}
                          {place.types?.includes('gas_agency') && (
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedGasAgency({
                                  name: place.name,
                                  address: place.vicinity,
                                  location: {
                                    lat: place.geometry.location.lat,
                                    lng: place.geometry.location.lng,
                                    address: place.vicinity,
                                  },
                                  coordinates: place.geometry.location,
                                  rating: place.rating,
                                  types: place.types,
                                });
                                setGasAgencyModalOpen(true);
                              }}
                              className="flex-1 text-sm bg-gradient-to-r from-orange-600 to-red-600 text-white px-4 py-2.5 rounded-xl hover:shadow-lg flex items-center justify-center gap-2 font-bold transition-all"
                            >
                              <FaTicketAlt className="h-4 w-4" />
                              Book Cylinder
                            </motion.button>
                          )}
                          
                          {/* Book Shopping Mall Services button for shopping malls */}
                          {place.types?.includes('shopping_mall') && (
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedShoppingMall({
                                  name: place.name,
                                  address: place.vicinity,
                                  location: {
                                    lat: place.geometry.location.lat,
                                    lng: place.geometry.location.lng,
                                    address: place.vicinity,
                                  },
                                  phone: place.phone || '',
                                  rating: place.rating,
                                  types: place.types,
                                });
                                setShoppingMallModalOpen(true);
                              }}
                              className="flex-1 text-sm bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2.5 rounded-xl hover:shadow-lg flex items-center justify-center gap-2 font-bold transition-all"
                            >
                              <FaShoppingBag className="h-4 w-4" />
                              Book Services
                            </motion.button>
                          )}

                          {/* Book Hospital Appointment button for hospitals */}
                          {place.types?.includes('hospital') && (
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedHospital({
                                  name: place.name,
                                  address: place.vicinity,
                                  location: {
                                    lat: place.geometry.location.lat,
                                    lng: place.geometry.location.lng,
                                    address: place.vicinity,
                                  },
                                  phone: place.phone || '',
                                  rating: place.rating,
                                  types: place.types,
                                });
                                setHospitalModalOpen(true);
                              }}
                              className="flex-1 text-sm bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-4 py-2.5 rounded-xl hover:shadow-lg flex items-center justify-center gap-2 font-bold transition-all"
                            >
                              <FaHospital className="h-4 w-4" />
                              Book Appointment
                            </motion.button>
                          )}

                          {/* Book Event button for events - only show when placeType is 'event' AND place has event-related types */}
                          {placeType === 'event' && (place.types?.includes('stadium') || place.types?.includes('auditorium') || place.types?.includes('event_venue') || place.types?.includes('tourist_attraction') || place.name.toLowerCase().includes('auditorium') || place.name.toLowerCase().includes('stadium') || place.name.toLowerCase().includes('theatre') || place.name.toLowerCase().includes('theater') || place.name.toLowerCase().includes('concert') || place.name.toLowerCase().includes('arena')) && (
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedEvent({
                                  name: place.name,
                                  vicinity: place.vicinity,
                                  address: place.vicinity,
                                  location: {
                                    lat: place.geometry.location.lat,
                                    lng: place.geometry.location.lng,
                                  },
                                  phone: place.phone || '',
                                  rating: place.rating,
                                  types: place.types,
                                });
                                setEventModalOpen(true);
                              }}
                              className="flex-1 text-sm bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2.5 rounded-xl hover:shadow-lg flex items-center justify-center gap-2 font-bold transition-all"
                            >
                              <FaCalendar className="h-4 w-4" />
                              Book Event
                            </motion.button>
                          )}

                          {/* Book Wellness button for spa/wellness - only show when placeType is 'wellness' */}
                          {placeType === 'wellness' && (
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedWellness({
                                  name: place.name,
                                  vicinity: place.vicinity,
                                  address: place.vicinity,
                                  location: {
                                    lat: place.geometry.location.lat,
                                    lng: place.geometry.location.lng,
                                  },
                                  phone: place.phone || '',
                                  rating: place.rating,
                                  types: place.types,
                                });
                                setWellnessModalOpen(true);
                              }}
                              className="flex-1 text-sm bg-gradient-to-r from-pink-600 to-rose-600 text-white px-4 py-2.5 rounded-xl hover:shadow-lg flex items-center justify-center gap-2 font-bold transition-all"
                            >
                              <FaHeart className="h-4 w-4" />
                              Book Wellness
                            </motion.button>
                          )}

                          {/* Book Activity buttons for new activity types - show for any place when these types selected */}
                          {['adventure', 'theme_park', 'guided_tour', 'cruise', 'boat_ride', 'hostel', 'resort', 'homestay'].includes(placeType) && (
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedActivity({
                                  name: place.name,
                                  vicinity: place.vicinity,
                                  formatted_address: place.vicinity,
                                  formatted_phone_number: place.phone || '',
                                  place_id: place.id,
                                });
                                setSelectedActivityType(placeType);
                                setActivityModalOpen(true);
                              }}
                              className="flex-1 text-sm bg-gradient-to-r from-orange-600 to-red-600 text-white px-4 py-2.5 rounded-xl hover:shadow-lg flex items-center justify-center gap-2 font-bold transition-all"
                            >
                              <FaTicketAlt className="h-4 w-4" />
                              Book Now
                            </motion.button>
                          )}

                          {/* Book Medicines button for pharmacies */}
                          {place.types?.includes('pharmacy') && (
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedPharmacy({
                                  name: place.name,
                                  address: place.vicinity,
                                  location: {
                                    lat: place.geometry.location.lat,
                                    lng: place.geometry.location.lng,
                                    address: place.vicinity,
                                  },
                                  phone: place.phone || '',
                                  rating: place.rating,
                                  types: place.types,
                                });
                                setPharmacyModalOpen(true);
                              }}
                              className="flex-1 text-sm bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-4 py-2.5 rounded-xl hover:shadow-lg flex items-center justify-center gap-2 font-bold transition-all"
                            >
                              <FaPrescription className="h-4 w-4" />
                              Book Medicines
                            </motion.button>
                          )}
                          
                          {/* Show Book button only for restaurants, cafes, and hotels */}
                          {(placeType === 'restaurant' || placeType === 'cafe' || placeType === 'lodging' ||
                            place.types?.includes('restaurant') || place.types?.includes('cafe') || 
                            place.types?.includes('lodging') || place.types?.includes('hotel')) && (
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                // Determine booking type from search placeType or place types
                                let type = 'hotel';
                                
                                // First check the current search type
                                if (placeType === 'restaurant') {
                                  type = 'restaurant';
                                } else if (placeType === 'cafe') {
                                  type = 'cafe'; // Treat cafe separately with its own menu
                                } else if (placeType === 'lodging') {
                                  type = 'hotel';
                                } else {
                                  // Fallback to checking place.types
                                  if (place.types?.includes('restaurant')) {
                                    type = 'restaurant';
                                  } else if (place.types?.includes('cafe')) {
                                    type = 'cafe';
                                  } else if (place.types?.includes('lodging') || place.types?.includes('hotel')) {
                                    type = 'hotel';
                                  }
                                }
                                
                                setBookingType(type);
                                setSelectedPlaceForBooking({
                                  name: place.name,
                                  address: place.vicinity,
                                  coordinates: {
                                    lat: place.geometry.location.lat,
                                    lng: place.geometry.location.lng,
                                  },
                                  rating: place.rating,
                                  basePrice: type === 'cafe' ? 300 : (type === 'restaurant' ? 500 : 2000),
                                });
                                setBookingModalOpen(true);
                              }}
                              className="flex-1 text-sm bg-gradient-to-r from-green-600 to-teal-600 text-white px-4 py-2.5 rounded-xl hover:shadow-lg flex items-center justify-center gap-2 font-bold transition-all"
                            >
                              <FaTicketAlt className="h-4 w-4" />
                              Book
                            </motion.button>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Transport Booking Tab */}
              {activeTab === "transport" && (
                <div className="p-3 space-y-3 md:p-6 md:space-y-6">
                  <div className="text-center mb-4">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                      Book Transportation
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Select a transportation service to book
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {/* Car Rental */}
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        setBookingType('car');
                        setSelectedPlaceForBooking({
                          name: 'Car Rental Service',
                          address: currentLocation ? `${currentLocation.lat.toFixed(4)}, ${currentLocation.lng.toFixed(4)}` : 'Your Location',
                          coordinates: currentLocation || { lat: 0, lng: 0 },
                          basePrice: 1500,
                        });
                        setBookingModalOpen(true);
                      }}
                      className="p-6 bg-gradient-to-br from-blue-500 to-blue-700 text-white rounded-2xl shadow-lg hover:shadow-xl transition-all"
                    >
                      <FaCar className="text-4xl mx-auto mb-3" />
                      <div className="font-bold text-lg">Car</div>
                      <div className="text-xs opacity-90 mt-1">Rent a Car</div>
                    </motion.button>

                    {/* Bike Rental */}
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        setBookingType('bike');
                        setSelectedPlaceForBooking({
                          name: 'Bike Rental Service',
                          address: currentLocation ? `${currentLocation.lat.toFixed(4)}, ${currentLocation.lng.toFixed(4)}` : 'Your Location',
                          coordinates: currentLocation || { lat: 0, lng: 0 },
                          basePrice: 500,
                        });
                        setBookingModalOpen(true);
                      }}
                      className="p-6 bg-gradient-to-br from-orange-500 to-orange-700 text-white rounded-2xl shadow-lg hover:shadow-xl transition-all"
                    >
                      <FaMotorcycle className="text-4xl mx-auto mb-3" />
                      <div className="font-bold text-lg">Bike</div>
                      <div className="text-xs opacity-90 mt-1">Rent a Bike</div>
                    </motion.button>

                    {/* Bus Booking */}
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        setBookingType('bus');
                        setSelectedPlaceForBooking({
                          name: 'Bus Service',
                          address: 'Multiple Routes Available',
                          coordinates: currentLocation || { lat: 0, lng: 0 },
                          basePrice: 800,
                        });
                        setBookingModalOpen(true);
                      }}
                      className="p-6 bg-gradient-to-br from-green-500 to-green-700 text-white rounded-2xl shadow-lg hover:shadow-xl transition-all"
                    >
                      <FaBus className="text-4xl mx-auto mb-3" />
                      <div className="font-bold text-lg">Bus</div>
                      <div className="text-xs opacity-90 mt-1">Book Bus Ticket</div>
                    </motion.button>

                    {/* Train Booking */}
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        setBookingType('train');
                        setSelectedPlaceForBooking({
                          name: 'Train Service',
                          address: 'Multiple Routes Available',
                          coordinates: currentLocation || { lat: 0, lng: 0 },
                          basePrice: 1200,
                        });
                        setBookingModalOpen(true);
                      }}
                      className="p-6 bg-gradient-to-br from-purple-500 to-purple-700 text-white rounded-2xl shadow-lg hover:shadow-xl transition-all"
                    >
                      <FaTrain className="text-4xl mx-auto mb-3" />
                      <div className="font-bold text-lg">Train</div>
                      <div className="text-xs opacity-90 mt-1">Book Train Ticket</div>
                    </motion.button>

                    {/* Flight Booking */}
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        setBookingType('flight');
                        setSelectedPlaceForBooking({
                          name: 'Flight Service',
                          address: 'Domestic & International',
                          coordinates: currentLocation || { lat: 0, lng: 0 },
                          basePrice: 5000,
                        });
                        setBookingModalOpen(true);
                      }}
                      className="p-6 bg-gradient-to-br from-red-500 to-red-700 text-white rounded-2xl shadow-lg hover:shadow-xl transition-all"
                    >
                      <FaPlane className="text-4xl mx-auto mb-3" />
                      <div className="font-bold text-lg">Flight</div>
                      <div className="text-xs opacity-90 mt-1">Book Flight</div>
                    </motion.button>

                    {/* Ship Booking */}
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        setBookingType('ship');
                        setSelectedPlaceForBooking({
                          name: 'Ship/Cruise Service',
                          address: 'Ferry & Cruise Options',
                          coordinates: currentLocation || { lat: 0, lng: 0 },
                          basePrice: 3000,
                        });
                        setBookingModalOpen(true);
                      }}
                      className="p-6 bg-gradient-to-br from-teal-500 to-teal-700 text-white rounded-2xl shadow-lg hover:shadow-xl transition-all"
                    >
                      <FaShip className="text-4xl mx-auto mb-3" />
                      <div className="font-bold text-lg">Ship</div>
                      <div className="text-xs opacity-90 mt-1">Book Ship/Ferry</div>
                    </motion.button>
                  </div>

                  <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-200 dark:border-blue-800">
                    <div className="flex items-start gap-3">
                      <FaInfoCircle className="text-blue-600 dark:text-blue-400 text-xl mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-blue-800 dark:text-blue-200">
                        <p className="font-semibold mb-1">How it works:</p>
                        <ul className="space-y-1 text-xs">
                          <li>• Select your preferred transportation type</li>
                          <li>• Fill in travel details (from, to, dates)</li>
                          <li>• Review pricing and confirm booking</li>
                          <li>• View all bookings in your Bookings page</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Directions Tab */}
              {activeTab === "directions" && (
                <div className="p-3 md:p-6 space-y-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl shadow-lg">
                      <FaDirections className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">
                        Get Directions
                      </h2>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Find the best route
                      </p>
                    </div>
                  </div>

                  {/* Starting Point Input */}
                  <div className="relative">
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                      <div className="flex items-center gap-2">
                        <FaLocationArrow className="h-4 w-4 text-blue-600" />
                        <span>Starting Point</span>
                        {selectedDirectionsOrigin && (
                          <span className="text-green-600">✓</span>
                        )}
                      </div>
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={directionsOrigin}
                        onChange={(e) => handleDirectionsOriginChange(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && directionsOrigin.trim() && directionsDestination.trim()) {
                            handleGetDirectionsFromTab();
                          }
                        }}
                        placeholder="Type to search location..."
                        className={`flex-1 px-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${
                          selectedDirectionsOrigin
                            ? "border-green-500 ring-2 ring-green-200 dark:ring-green-800"
                            : "border-gray-200 dark:border-gray-600"
                        } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                      />
                      <button
                        onClick={handleUseCurrentLocationForDirections}
                        className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-all flex items-center gap-2 whitespace-nowrap"
                        title="Use current location"
                      >
                        <FaLocationArrow className="h-4 w-4" />
                        <span className="hidden md:inline">Use Current</span>
                      </button>
                    </div>
                    
                    {/* Origin Autocomplete Suggestions */}
                    {directionsOriginSuggestions.length > 0 && (
                      <div className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-700 rounded-xl shadow-2xl border-2 border-blue-500 max-h-60 overflow-y-auto">
                        {directionsOriginSuggestions.map((place, index) => (
                          <div
                            key={index}
                            onClick={() => handleSelectDirectionsOrigin(place)}
                            className="p-3 hover:bg-blue-50 dark:hover:bg-gray-600 cursor-pointer border-b border-gray-100 dark:border-gray-600 last:border-0 transition-colors"
                          >
                            <p className="font-semibold text-gray-900 dark:text-white text-sm">
                              {place.name || place.display_name}
                            </p>
                            {place.address && (
                              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                {place.address}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Destination Input */}
                  <div className="relative">
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                      <div className="flex items-center gap-2">
                        <FaMapPin className="h-4 w-4 text-red-600" />
                        <span>Destination</span>
                        {selectedDirectionsDest && (
                          <span className="text-green-600">✓</span>
                        )}
                      </div>
                    </label>
                    <input
                      type="text"
                      value={directionsDestination}
                      onChange={(e) => handleDirectionsDestChange(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && directionsOrigin.trim() && directionsDestination.trim()) {
                          handleGetDirectionsFromTab();
                        }
                      }}
                      placeholder="Type to search location..."
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${
                        selectedDirectionsDest
                          ? "border-green-500 ring-2 ring-green-200 dark:ring-green-800"
                          : "border-gray-200 dark:border-gray-600"
                      } bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                    />
                    
                    {/* Destination Autocomplete Suggestions */}
                    {directionsDestSuggestions.length > 0 && (
                      <div className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-700 rounded-xl shadow-2xl border-2 border-blue-500 max-h-60 overflow-y-auto">
                        {directionsDestSuggestions.map((place, index) => (
                          <div
                            key={index}
                            onClick={() => handleSelectDirectionsDest(place)}
                            className="p-3 hover:bg-blue-50 dark:hover:bg-gray-600 cursor-pointer border-b border-gray-100 dark:border-gray-600 last:border-0 transition-colors"
                          >
                            <p className="font-semibold text-gray-900 dark:text-white text-sm">
                              {place.name || place.display_name}
                            </p>
                            {place.address && (
                              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                {place.address}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Helper Text */}
                  {(!directionsOrigin.trim() || !directionsDestination.trim()) && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-3">
                      <p className="text-sm text-blue-800 dark:text-blue-300">
                        💡 Type your starting point and destination, then click Get Directions
                      </p>
                    </div>
                  )}

                  {/* Get Directions Button */}
                  <button
                    onClick={handleGetDirectionsFromTab}
                    disabled={!directionsOrigin.trim() || !directionsDestination.trim() || directionsLoading}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold px-6 py-4 rounded-xl shadow-lg hover:shadow-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {directionsLoading ? (
                      <>
                        <LoadingSpinner />
                        <span>Calculating Route...</span>
                      </>
                    ) : (
                      <>
                        <FaDirections className="h-5 w-5" />
                        <span>Get Directions</span>
                      </>
                    )}
                  </button>

                  {/* Reset Button */}
                  {(directionsOrigin || directionsDestination) && (
                    <button
                      onClick={resetDirectionsForm}
                      className="w-full bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 font-semibold px-6 py-3 rounded-xl transition-all"
                    >
                      Clear Form
                    </button>
                  )}
                </div>
              )}

              {/* Weather Tab */}
              {activeTab === "weather" && (
                <div className="p-3 md:p-6 space-y-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg">
                      <FaCloudSun className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">
                        Weather Forecast
                      </h2>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        30-day weather outlook
                      </p>
                    </div>
                  </div>

                  {currentLocation ? (
                    <WeatherWidget 
                      lat={currentLocation.lat}
                      lng={currentLocation.lng}
                    />
                  ) : (
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6 text-center">
                      <FaCloudSun className="h-12 w-12 text-blue-500 mx-auto mb-3" />
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        Location Required
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Please enable location access or search for a place to view weather forecast
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Hotels & Recommendations Tab */}
              {activeTab === "hotels" && (
                <div className="p-3 md:p-6 space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl shadow-lg">
                        <FaStar className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">
                          Recommended Hotels
                        </h2>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          Top-rated near you
                        </p>
                      </div>
                    </div>
                  </div>

                  {loadingRecommendations ? (
                    <div className="flex justify-center py-8">
                      <LoadingSpinner />
                    </div>
                  ) : recommendations.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <FaStar className="h-12 w-12 mx-auto mb-3 opacity-30" />
                      <p>No hotels found in this area</p>
                      <p className="text-sm mt-1">Try increasing the search radius</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {recommendations.map((place, index) => (
                        <motion.div
                          key={place.place_id || index}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          whileHover={{ scale: 1.02, y: -4 }}
                          className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-700 dark:to-gray-800 rounded-2xl p-4 border-2 border-gray-100 dark:border-gray-600 shadow-md hover:shadow-xl transition-all cursor-pointer"
                          onClick={() => handlePlaceClick(place)}
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                              <FaStar className="h-6 w-6 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-gray-900 dark:text-white text-base mb-1">
                                {place.name}
                              </h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1 mb-2">
                                {place.vicinity}
                              </p>
                              <div className="flex items-center gap-3 flex-wrap">
                                {place.rating && (
                                  <div className="flex items-center gap-1 bg-yellow-50 dark:bg-yellow-900/20 px-2 py-1 rounded-lg">
                                    <FaStar className="h-4 w-4 text-yellow-500" />
                                    <span className="text-sm font-bold text-gray-900 dark:text-white">
                                      {place.rating}
                                    </span>
                                  </div>
                                )}
                                {place.recommendationScore && (
                                  <span className="text-xs font-semibold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 px-2 py-1 rounded-lg">
                                    Score: {place.recommendationScore}%
                                  </span>
                                )}
                                {typeof place._distanceKm === "number" && (
                                  <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-lg">
                                    {place._distanceKm.toFixed(2)} km
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Enhanced Saved Locations Tab */}
              {activeTab === "saved" && (
                <div className="p-3 md:p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-gradient-to-br from-pink-600 to-purple-600 rounded-xl shadow-lg">
                      <FaHeart className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-white text-xl md:text-2xl">
                        Saved Locations
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {savedLocations.length} saved places
                      </p>
                    </div>
                  </div>
                  {savedLocations.length === 0 ? (
                    <div className="text-center py-6 md:py-12 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-600">
                      <FaHeart className="h-12 w-12 md:h-16 md:w-16 mx-auto mb-3 md:mb-4 text-gray-300 dark:text-gray-600" />
                      <p className="text-gray-500 dark:text-gray-400 font-semibold">
                        No saved locations yet
                      </p>
                      <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                        Save places from the Nearby tab
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3 md:space-y-4">
                      {savedLocations.map((location) => (
                        <motion.div
                          key={location._id}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          whileHover={{ scale: 1.02 }}
                          className="bg-white dark:bg-gray-700 rounded-2xl p-3 md:p-5 border-2 border-gray-100 dark:border-gray-600 shadow-md hover:shadow-2xl transition-all group"
                        >
                          <div className="flex justify-between items-start gap-3">
                            <div
                              className="flex-1 cursor-pointer"
                              onClick={() => {
                                setCenter({
                                  lat: location.coordinates.lat,
                                  lng: location.coordinates.lng,
                                });
                                setZoom(14);
                                setMapBounds(null);
                              }}
                            >
                              <div className="flex items-center gap-3 mb-0 md:mb-2">
                                <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-pink-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                  <FaHeart className="h-3.5 w-3.5 md:h-5 md:w-5 text-white" />
                                </div>
                                <h4 className="font-bold text-gray-900 dark:text-white text-sm md:text-base flex-1 line-clamp-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                                  {location.name}
                                </h4>
                              </div>
                              {location.address && (
                                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 ml-13">
                                  {location.address}
                                </p>
                              )}
                            </div>
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => deleteLocation(location._id)}
                              className="p-3 text-red-600 hover:text-white hover:bg-red-600 rounded-xl transition-all"
                              title="Delete location"
                            >
                              <FaTrash className="h-4 w-4" />
                            </motion.button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Route Tab */}
              {activeTab === "route" && routeData && (
                <div className="p-3 md:p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-gradient-to-br from-green-600 to-blue-600 rounded-xl shadow-lg">
                      <FaLocationArrow className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-white text-xl md:text-2xl">
                        Route Details
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {routeOrigin?.name} → {routeDest?.name}
                      </p>
                    </div>
                  </div>

                  {/* Route Summary */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-4 rounded-xl border border-blue-200 dark:border-blue-800">
                      <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mb-1">
                        Distance
                      </p>
                      <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                        {(routeData.totalDistance / 1000).toFixed(1)} km
                      </p>
                    </div>
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 p-4 rounded-xl border border-purple-200 dark:border-purple-800">
                      <p className="text-xs text-purple-600 dark:text-purple-400 font-medium mb-1">
                        Duration
                      </p>
                      <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                        {Math.round(routeData.totalDuration / 60)} min
                      </p>
                    </div>
                  </div>

                  {/* Route Points */}
                  <div className="space-y-3">
                    <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
                      <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-white font-bold text-sm">A</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-green-600 dark:text-green-400 font-medium mb-1">
                          Starting Point
                        </p>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                          {routeOrigin?.name}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-center">
                      <div className="w-0.5 h-8 bg-gradient-to-b from-green-300 to-red-300 dark:from-green-700 dark:to-red-700"></div>
                    </div>

                    <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
                      <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-white font-bold text-sm">B</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-red-600 dark:text-red-400 font-medium mb-1">
                          Destination
                        </p>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                          {routeDest?.name}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Navigation Button */}
                  <button
                    onClick={() => {
                      const navUrl = `https://www.google.com/maps/dir/?api=1&origin=${routeOrigin.lat},${routeOrigin.lng}&destination=${routeDest.lat},${routeDest.lng}&travelmode=driving`;
                      window.open(navUrl, '_blank');
                      toast.success("Opening navigation in Google Maps...");
                    }}
                    className="w-full mt-6 py-4 px-4 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-bold rounded-xl shadow-lg hover:shadow-2xl transition-all flex items-center justify-center gap-3"
                  >
                    <FaLocationArrow className="h-5 w-5" />
                    <span>Start Navigation</span>
                    <FaExternalLinkAlt className="h-4 w-4" />
                  </button>

                  {/* Clear Route Button */}
                  <button
                    onClick={() => {
                      setRouteData(null);
                      setRouteOrigin(null);
                      setRouteDest(null);
                      setMapBounds(null);
                      setCenter(defaultCenter);
                      setZoom(defaultZoom);
                      setActiveTab("nearby");
                      toast.success("Route cleared - Returning to Medahalli (Old Madras Road)");
                    }}
                    className="w-full mt-3 py-3 px-4 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 font-semibold rounded-xl hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                  >
                    Clear Route
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Enhanced Toggle Sidebar Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className={`absolute ${
            sidebarOpen ? "left-0 md:left-96" : "left-0"
          } top-1/2 transform -translate-y-1/2 bg-black/40 backdrop-blur-md border-r border-y border-white/20 md:border-0 md:bg-gradient-to-r md:from-blue-600 md:to-purple-600 text-white px-2 py-4 md:py-6 rounded-r-2xl shadow-2xl hover:shadow-blue-500/50 font-bold transition-all duration-300`}
          style={{ zIndex: 40 }}
        >
          {sidebarOpen ? "◀" : "▶"}
        </motion.button>

        {/* Map Container */}
        <div className="absolute inset-0 w-full h-full" style={{ zIndex: 5 }}>
          {/* Mobile-Optimized Search & Controls */}
          <div className="absolute top-4 left-4 right-4 md:left-auto md:right-4 md:w-80 z-[1000] pointer-events-auto">
            <motion.div
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.4 }}
              className="md:bg-white/95 md:dark:bg-gray-800/95 md:backdrop-blur-xl md:rounded-2xl md:shadow-2xl md:border md:border-gray-200/50 md:dark:border-gray-700/50 md:p-4"
            >
              {/* Search Bar with Integrated Button */}
              <form onSubmit={handleSearch} className="relative shadow-lg md:shadow-none rounded-xl">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for places..."
                  className="w-full h-11 pl-4 pr-12 bg-white md:bg-gray-50 dark:bg-gray-800 md:dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm text-gray-900 dark:text-white placeholder-gray-400 transition-all text-sm"
                />
                <button
                  type="submit"
                  disabled={loading || !searchQuery.trim()}
                  className="absolute right-1 top-1 bottom-1 w-9 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg shadow-sm hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center p-0"
                >
                  <FaSearch className="h-3.5 w-3.5" />
                </button>
              </form>

              {/* Desktop Location Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  if (currentLocation) {
                    setCenter(currentLocation);
                    setZoom(14);
                    setMapBounds(null);
                  }
                }}
                className="hidden md:flex w-full h-11 mt-3 bg-gradient-to-br from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white rounded-xl hover:shadow-lg transition-all shadow-md items-center justify-center gap-2 font-semibold text-sm"
                title="My Location"
              >
                <FaLocationArrow className="h-4 w-4" />
                Go to My Location
              </motion.button>
            </motion.div>
          </div>

          {/* Mobile Bottom-Right Location FAB */}
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => {
              if (currentLocation) {
                setCenter(currentLocation);
                setZoom(14);
                setMapBounds(null);
              }
            }}
            className="absolute bottom-24 right-4 z-[1000] md:hidden w-12 h-12 bg-gradient-to-br from-indigo-600 to-blue-600 text-white rounded-full shadow-lg hover:shadow-xl flex items-center justify-center pointer-events-auto"
            title="My Location"
          >
            <FaLocationArrow className="h-5 w-5" />
          </motion.button>

          {/* Map Wrapper with explicit height */}
          <div style={{ width: '100%', height: '600px', position: 'relative', zIndex: 1 }}>
            <MapContainer
              center={[center.lat, center.lng]}
              zoom={zoom}
              style={{ width: "100%", height: "100%" }}
              scrollWheelZoom={true}
              zoomControl={true}
              preferCanvas={true}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                maxZoom={19}
              />
            <InvalidateSize />
            <Recenter center={center} zoom={zoom} />
            {mapBounds && <FitBounds bounds={mapBounds} />}

            {/* Current Location Marker */}
            {currentLocation && (
              <Marker position={currentLocation}>
                <Popup>Your Location</Popup>
              </Marker>
            )}

            {/* Place Markers */}
            {places.map((place, index) => (
              <Marker
                key={place.place_id || index}
                position={{
                  lat: place.geometry.location.lat,
                  lng: place.geometry.location.lng,
                }}
                eventHandlers={{ click: () => handlePlaceClick(place) }}
              >
                <Popup>
                  <div 
                    className="p-1 cursor-pointer hover:bg-blue-50 rounded transition-colors"
                    onClick={() => handlePlaceClick(place)}
                  >
                    <h3 className="font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1">
                      {place.name}
                      <FaInfoCircle className="h-3 w-3" />
                    </h3>
                    <p className="text-sm text-gray-600">{place.vicinity}</p>
                    {typeof place._distanceKm === "number" && (
                      <p className="text-xs text-gray-600 mt-1">
                        {place._distanceKm.toFixed(2)} km away
                      </p>
                    )}
                    <p className="text-xs text-blue-600 mt-1 font-medium">
                      Click for details →
                    </p>
                  </div>
                </Popup>
              </Marker>
            ))}

            {/* Saved Location Markers */}
            {savedLocations.map((loc) => (
              <Marker
                key={loc._id}
                position={{
                  lat: loc.coordinates.lat,
                  lng: loc.coordinates.lng,
                }}
              >
                <Popup>{loc.name}</Popup>
              </Marker>
            ))}

            {/* Route Polyline and Markers */}
            {routeData && routeData.geometry && (
              <>
                {/* Route Line */}
                <Polyline
                  positions={routeData.geometry.coordinates.map(([lng, lat]) => [lat, lng])}
                  color="#3b82f6"
                  weight={5}
                  opacity={0.7}
                />
                
                {/* Origin Marker */}
                {routeOrigin && (
                  <Marker
                    position={[routeOrigin.lat, routeOrigin.lng]}
                    icon={L.divIcon({
                      className: 'custom-div-icon',
                      html: `<div style="background-color: #10b981; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 16px; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">A</div>`,
                      iconSize: [32, 32],
                      iconAnchor: [16, 16],
                    })}
                  >
                    <Popup>
                      <div className="font-semibold">Start: {routeOrigin.name}</div>
                    </Popup>
                  </Marker>
                )}

                {/* Destination Marker */}
                {routeDest && (
                  <Marker
                    position={[routeDest.lat, routeDest.lng]}
                    icon={L.divIcon({
                      className: 'custom-div-icon',
                      html: `<div style="background-color: #ef4444; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 16px; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">B</div>`,
                      iconSize: [32, 32],
                      iconAnchor: [16, 16],
                    })}
                  >
                    <Popup>
                      <div className="font-semibold">Destination: {routeDest.name}</div>
                    </Popup>
                  </Marker>
                )}
              </>
            )}

            {/* Directions removed - no polyline */}
          </MapContainer>
          </div>
        </div>

        {/* Place Details Modal */}
        <AnimatePresence>
          {placeDetails && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setPlaceDetails(null)}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-purple-600 p-6 rounded-t-3xl">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h2 className="text-2xl font-bold text-white mb-2">
                        {placeDetails.name}
                      </h2>
                      {placeDetails.vicinity && (
                        <p className="text-blue-100 text-sm">
                          {placeDetails.vicinity}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => setPlaceDetails(null)}
                      className="ml-4 p-2 hover:bg-white/20 rounded-full transition-colors"
                    >
                      <FaTimes className="h-6 w-6 text-white" />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                  {loadingDetails && (
                    <div className="flex justify-center py-8">
                      <LoadingSpinner />
                    </div>
                  )}

                  {/* Wikipedia Image */}
                  {placeDetails.wikipedia?.thumbnail && (
                    <div className="rounded-2xl overflow-hidden shadow-lg">
                      <img
                        src={placeDetails.wikipedia.thumbnail}
                        alt={placeDetails.name}
                        className="w-full h-64 object-cover"
                      />
                    </div>
                  )}

                  {/* Place Info Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    {placeDetails.rating && (
                      <div className="flex items-center gap-2 bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-xl">
                        <FaStar className="h-5 w-5 text-yellow-500" />
                        <div>
                          <p className="text-xs text-gray-600 dark:text-gray-400">Rating</p>
                          <p className="font-bold text-gray-900 dark:text-white">
                            {placeDetails.rating} / 5
                          </p>
                        </div>
                      </div>
                    )}
                    {typeof placeDetails._distanceKm === 'number' && (
                      <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-xl">
                        <FaMapPin className="h-5 w-5 text-blue-500" />
                        <div>
                          <p className="text-xs text-gray-600 dark:text-gray-400">Distance</p>
                          <p className="font-bold text-gray-900 dark:text-white">
                            {placeDetails._distanceKm.toFixed(2)} km
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Wikipedia Description */}
                  {placeDetails.wikipedia?.extract && (
                    <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-700 dark:to-gray-700 p-4 rounded-2xl">
                      <div className="flex items-center gap-2 mb-3">
                        <FaInfoCircle className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                        <h3 className="font-bold text-gray-900 dark:text-white">About</h3>
                      </div>
                      <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed line-clamp-6">
                        {placeDetails.wikipedia.extract}
                      </p>
                      {placeDetails.wikipedia.url && (
                        <a
                          href={placeDetails.wikipedia.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 mt-3 text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-semibold text-sm transition-colors"
                        >
                          <span>Read more on Wikipedia</span>
                          <FaExternalLinkAlt className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  )}

                  {/* Place Types/Categories */}
                  {placeDetails.types && placeDetails.types.length > 0 && (
                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                        <FaMapMarkedAlt className="h-4 w-4 text-blue-600" />
                        Categories
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {placeDetails.types.slice(0, 8).map((type, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-xs font-medium"
                          >
                            {type.replace(/_/g, ' ')}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Coordinates */}
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-2xl">
                    <h3 className="font-bold text-gray-900 dark:text-white mb-2">Location Coordinates</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 font-mono">
                      {placeDetails.geometry.location.lat.toFixed(6)}, {placeDetails.geometry.location.lng.toFixed(6)}
                    </p>
                  </div>

                  {/* Reviews Section */}
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-gray-900 dark:text-white text-lg flex items-center gap-2">
                        <FaStar className="h-5 w-5 text-yellow-500" />
                        Reviews {placeReviews.length > 0 && `(${placeReviews.length})`}
                      </h3>
                      {!showReviewForm && (
                        <button
                          onClick={() => setShowReviewForm(true)}
                          className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                        >
                          Write Review
                        </button>
                      )}
                    </div>

                    {/* Review Form */}
                    {showReviewForm && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-blue-50 dark:bg-gray-700 p-4 rounded-xl mb-4"
                      >
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Write a Review</h4>
                        
                        {/* Star Rating Input */}
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Rating
                          </label>
                          <div className="flex gap-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                type="button"
                                onClick={() => setNewReview({ ...newReview, rating: star })}
                                className="focus:outline-none"
                              >
                                <FaStar
                                  className={`h-8 w-8 transition-colors ${
                                    star <= newReview.rating
                                      ? "text-yellow-500"
                                      : "text-gray-300 dark:text-gray-600"
                                  }`}
                                />
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Title Input */}
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Title
                          </label>
                          <input
                            type="text"
                            value={newReview.title}
                            onChange={(e) => setNewReview({ ...newReview, title: e.target.value })}
                            placeholder="Sum up your experience"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                          />
                        </div>

                        {/* Comment Input */}
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Your Review
                          </label>
                          <textarea
                            value={newReview.comment}
                            onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                            placeholder="Share your experience with others"
                            rows={4}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                          />
                        </div>

                        {/* Form Actions */}
                        <div className="flex gap-2">
                          <button
                            onClick={submitReview}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                          >
                            Submit Review
                          </button>
                          <button
                            onClick={() => {
                              setShowReviewForm(false);
                              setNewReview({ rating: 5, title: "", comment: "" });
                            }}
                            className="bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 text-gray-800 dark:text-white px-4 py-2 rounded-lg transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </motion.div>
                    )}

                    {/* Reviews List */}
                    {loadingReviews && (
                      <div className="flex justify-center py-8">
                        <LoadingSpinner />
                      </div>
                    )}

                    {!loadingReviews && placeReviews.length === 0 && (
                      <div className="text-center py-8">
                        <FaStar className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                        <p className="text-gray-500 dark:text-gray-400">No reviews yet. Be the first to review!</p>
                      </div>
                    )}

                    {!loadingReviews && placeReviews.length > 0 && (
                      <div className="space-y-4 max-h-96 overflow-y-auto">
                        {placeReviews.map((review) => (
                          <div
                            key={review._id}
                            className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <div className="flex">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <FaStar
                                        key={star}
                                        className={`h-4 w-4 ${
                                          star <= review.rating
                                            ? "text-yellow-500"
                                            : "text-gray-300 dark:text-gray-600"
                                        }`}
                                      />
                                    ))}
                                  </div>
                                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                    {review.user?.name || "Anonymous"}
                                  </span>
                                </div>
                                <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                                  {review.title}
                                </h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  {review.comment}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 mt-2">
                              <span>{new Date(review.createdAt).toLocaleDateString()}</span>
                              {review.helpful > 0 && (
                                <span className="flex items-center gap-1">
                                  <FaStar className="h-3 w-3" />
                                  {review.helpful} helpful
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className={`grid gap-3 ${placeDetails.types && placeDetails.types.includes('gas_station') ? 'grid-cols-3' : 'grid-cols-2'}`}>
                    <button
                      onClick={() => {
                        setCenter({
                          lat: placeDetails.geometry.location.lat,
                          lng: placeDetails.geometry.location.lng,
                        });
                        setPlaceDetails(null);
                      }}
                      className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl transition-colors"
                    >
                      <FaMapPin className="h-4 w-4" />
                      <span>View on Map</span>
                    </button>
                    
                    {/* Gas Station Booking Button - Only show for gas stations */}
                    {placeDetails.types && placeDetails.types.includes('gas_station') && (
                      <button
                        onClick={() => {
                          setSelectedGasStation(placeDetails);
                          setGasStationModalOpen(true);
                        }}
                        className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-xl transition-colors"
                      >
                        <FaTicketAlt className="h-4 w-4" />
                        <span>Book Fuel</span>
                      </button>
                    )}
                    
                    {/* Gas Agency Booking Button - Only show for gas agencies */}
                    {placeDetails.types && placeDetails.types.includes('gas_agency') && (
                      <button
                        onClick={() => {
                          setSelectedGasAgency(placeDetails);
                          setGasAgencyModalOpen(true);
                        }}
                        className="flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-4 rounded-xl transition-colors"
                      >
                        <FaTicketAlt className="h-4 w-4" />
                        <span>Book Cylinder</span>
                      </button>
                    )}
                    
                    {/* Shopping Mall Booking Button - Only show for shopping malls */}
                    {placeDetails.types && placeDetails.types.includes('shopping_mall') && (
                      <button
                        onClick={() => {
                          setSelectedShoppingMall(placeDetails);
                          setShoppingMallModalOpen(true);
                        }}
                        className="flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-3 px-4 rounded-xl transition-colors"
                      >
                        <FaShoppingBag className="h-4 w-4" />
                        <span>Book Services</span>
                      </button>
                    )}

                    {/* Hospital Booking Button - Only show for hospitals */}
                    {placeDetails.types && placeDetails.types.includes('hospital') && (
                      <button
                        onClick={() => {
                          setSelectedHospital(placeDetails);
                          setHospitalModalOpen(true);
                        }}
                        className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold py-3 px-4 rounded-xl transition-colors"
                      >
                        <FaHospital className="h-4 w-4" />
                        <span>Book Appointment</span>
                      </button>
                    )}

                    {/* Pharmacy Booking Button - Only show for pharmacies */}
                    {placeDetails.types && placeDetails.types.includes('pharmacy') && (
                      <button
                        onClick={() => {
                          setSelectedPharmacy(placeDetails);
                          setPharmacyModalOpen(true);
                        }}
                        className="flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold py-3 px-4 rounded-xl transition-colors"
                      >
                        <FaPrescription className="h-4 w-4" />
                        <span>Book Medicines</span>
                      </button>
                    )}
                    
                    <button
                      onClick={() => {
                        saveLocation(
                          placeDetails.geometry.location.lat,
                          placeDetails.geometry.location.lng,
                          placeDetails.name
                        );
                      }}
                      className="flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-xl transition-colors"
                    >
                      <FaBookmark className="h-4 w-4" />
                      <span>Save Place</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Booking Modal */}
        <BookingModal
          isOpen={bookingModalOpen}
          onClose={() => setBookingModalOpen(false)}
          bookingType={bookingType}
          placeDetails={selectedPlaceForBooking}
        />

        {/* Gas Station Booking Modal */}
        <GasStationBookingModal
          isOpen={gasStationModalOpen}
          onClose={() => {
            setGasStationModalOpen(false);
            setSelectedGasStation(null);
          }}
          gasStation={selectedGasStation}
        />

        {/* Gas Agency Booking Modal */}
        <GasAgencyBookingModal
          isOpen={gasAgencyModalOpen}
          onClose={() => {
            setGasAgencyModalOpen(false);
            setSelectedGasAgency(null);
          }}
          agencyDetails={selectedGasAgency}
        />

        {/* Shopping Mall Booking Modal */}
        <ShoppingMallBookingModal
          isOpen={shoppingMallModalOpen}
          onClose={() => {
            setShoppingMallModalOpen(false);
            setSelectedShoppingMall(null);
          }}
          mallDetails={selectedShoppingMall}
        />

        {/* Hospital Booking Modal */}
        <HospitalBookingModal
          isOpen={hospitalModalOpen}
          onClose={() => {
            setHospitalModalOpen(false);
            setSelectedHospital(null);
          }}
          hospitalDetails={selectedHospital}
        />

        {/* Pharmacy Booking Modal */}
        <PharmacyBookingModal
          isOpen={pharmacyModalOpen}
          onClose={() => {
            setPharmacyModalOpen(false);
            setSelectedPharmacy(null);
          }}
          pharmacyDetails={selectedPharmacy}
        />

        {/* Event Booking Modal */}
        <EventBookingModal
          isOpen={eventModalOpen}
          onClose={() => {
            setEventModalOpen(false);
            setSelectedEvent(null);
          }}
          venueDetails={selectedEvent}
        />

        {/* Wellness Booking Modal */}
        <WellnessBookingModal
          isOpen={wellnessModalOpen}
          onClose={() => {
            setWellnessModalOpen(false);
            setSelectedWellness(null);
          }}
          centerDetails={selectedWellness}
        />

        {/* Activity Booking Modal (Adventure, Theme Park, Guided Tour, Cruise, Boat Ride, Hostel, Resort, Homestay) */}
        <ActivityBookingModal
          isOpen={activityModalOpen}
          onClose={() => {
            setActivityModalOpen(false);
            setSelectedActivity(null);
          }}
          placeDetails={selectedActivity}
          activityType={selectedActivityType}
        />
      </div>
    </div>
  );
};

export default Maps;
