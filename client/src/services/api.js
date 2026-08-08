import axios from "axios";

// Create axios instance with base configuration
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "/api",
  timeout: 120000, // 2 minutes for AI generation
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Enable sending cookies
});

// Flag to prevent multiple simultaneous refresh attempts
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors and token refresh
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Skip refresh for login/register
    if (
      (error.response?.status === 401 && !originalRequest._retry) &&
      !originalRequest.url.includes("/auth/login") &&
      !originalRequest.url.includes("/auth/register")
    ) {
      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Try to refresh the token
        const response = await api.post("/auth/refresh");
        const { accessToken } = response.data;

        // Store new token
        localStorage.setItem("token", accessToken);

        // Update authorization header
        api.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;

        // Process queued requests with new token
        processQueue(null, accessToken);

        // Retry original request
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed, logout user
        processQueue(refreshError, null);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login";
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// Authentication API calls
export const authAPI = {
  register: (userData) => api.post("/auth/register", userData),
  login: (credentials) => api.post("/auth/login", credentials),
  getProfile: () => api.get("/auth/me"),
  updateProfile: (profileData) => api.put("/auth/profile", profileData),
  changePassword: (passwordData) =>
    api.post("/auth/change-password", passwordData),
  saveDestination: (destinationData) =>
    api.post("/auth/save-destination", destinationData),
  logout: () => api.post("/auth/logout"),
};

// AI API calls
export const aiAPI = {
  generateItinerary: (itineraryData) =>
    api.post("/ai/generate-itinerary", itineraryData, { timeout: 90000 }),
  optimizeItinerary: (optimizationData) =>
    api.post("/ai/optimize-itinerary", optimizationData, { timeout: 300000 }),
  getTravelSuggestions: (preferencesData) =>
    api.post("/ai/travel-suggestions", preferencesData),
  getDestinationInsights: (destinationData) =>
    api.post("/ai/destination-insights", destinationData),
  getRecommendations: () => api.get("/ai/recommendations"),
  refreshRecommendations: () => api.post("/ai/recommendations/refresh"),
  chat: (messageData) => api.post("/ai/chat", messageData),
};

// Trip API calls
export const tripAPI = {
  getTrips: (params = {}) => api.get("/trips", { params }),
  getTripById: (id) => api.get(`/trips/${id}`),
  createTrip: (tripData) => api.post("/trips", tripData),
  updateTrip: (id, tripData) => api.put(`/trips/${id}`, tripData),
  updateTripStatus: (id, status) => api.patch(`/trips/${id}/status`, { status }),
  deleteTrip: (id) => api.delete(`/trips/${id}`),
  getTripExpenses: (id) => api.get(`/trips/${id}/expenses`),
  addTripExpense: (id, expenseData) => api.post(`/trips/${id}/expenses`, expenseData),
  updateTripExpense: (id, expenseId, expenseData) => api.put(`/trips/${id}/expenses/${expenseId}`, expenseData),
  deleteTripExpense: (id, expenseId) => api.delete(`/trips/${id}/expenses/${expenseId}`),
  getPublicTrips: (params = {}) => api.get("/trips/public", { params }),
  getSharedTrip: (id) => api.get(`/trips/shared/${id}`), // Public endpoint for shared trips
  getSharedTripByToken: (token) => api.get(`/trips/share/${token}`), // Public endpoint for shared trips by token
  cloneTrip: (id) => api.post(`/trips/${id}/clone`),
  getTripStats: () => api.get("/trips/stats"),
  getUpcomingTrips: (params = {}) => api.get("/trips/upcoming", { params }),
  getPastTrips: (params = {}) => api.get("/trips/past", { params }),
  getRecentTrips: () => api.get("/trips/recent"),
  shareTrip: (id) => api.post(`/trips/${id}/share`),
  addCollaborator: (id, collaboratorData) => api.post(`/trips/${id}/collaborators`, collaboratorData),
};

// Maps API calls (using consolidated backend route)
export const mapsAPI = {
  getNearbyPlaces: (params = {}) => api.get("/maps/places/nearby", { params }),
  searchPlaces: (params = {}) => api.get("/maps/places/search", { params }),
  getDirections: (params = {}) => api.get("/maps/directions", { params }),
  geocodeAddress: (params = {}) => api.get("/maps/geocode", { params }),
  reverseGeocode: (params = {}) => api.get("/maps/reverse-geocode", { params }),
  saveLocation: (locationData) => api.post("/maps/save-location", locationData),
  getSavedLocations: () => api.get("/maps/saved-locations"),
  deleteSavedLocation: (id) => api.delete(`/maps/saved-locations/${id}`),
  // New features
  getCurrentWeather: (params = {}) => api.get("/maps/weather/current", { params }),
  getWeatherForecast: (params = {}) => api.get("/maps/weather/forecast", { params }),
  getTravelSuggestions: (params = {}) => api.get("/maps/weather/travel-suggestions", { params }),
  optimizeRoute: (waypoints) => api.post("/maps/route/optimize", { waypoints }),
  getRoute: (params = {}) => api.get("/maps/route", { params }),
  getRecommendations: (params = {}) => api.get("/maps/recommendations", { params }),
};

// Reviews API calls
export const reviewAPI = {
  createReview: (reviewData) => api.post("/reviews", reviewData),
  getPlaceReviews: (placeId, params = {}) => api.get(`/reviews/place/${placeId}`, { params }),
  getMyReviews: () => api.get("/reviews/my-reviews"),
  updateReview: (id, reviewData) => api.put(`/reviews/${id}`, reviewData),
  deleteReview: (id) => api.delete(`/reviews/${id}`),
  markHelpful: (id) => api.post(`/reviews/${id}/helpful`),
  getPredictedRating: (params = {}) => api.get("/reviews/predict", { params }),
};

// Payment API calls
export const paymentAPI = {
  createOrder: (paymentData) => api.post("/payments/create-order", paymentData),
  verifyPayment: (verificationData) => api.post("/payments/verify", verificationData),
  getPaymentDetails: (paymentId) => api.get(`/payments/${paymentId}`),
  initiateRefund: (refundData) => api.post("/payments/refund", refundData),
};

// Booking API calls
export const bookingAPI = {
  createBooking: (bookingData) => api.post("/bookings", bookingData),
  getBookings: (params = {}) => api.get("/bookings", { params }),
  getUpcomingBookings: () => api.get("/bookings/upcoming"),
  getPastBookings: () => api.get("/bookings/past"),
  getBookingById: (id) => api.get(`/bookings/${id}`),
  getBookingByReference: (reference) => api.get(`/bookings/reference/${reference}`),
  updateBooking: (id, bookingData) => api.put(`/bookings/${id}`, bookingData),
  cancelBooking: (id, reason) => api.patch(`/bookings/${id}/cancel`, { reason }),
  updateBookingStatus: (id, status) => api.patch(`/bookings/${id}/status`, { status }),
  deleteBooking: (id) => api.delete(`/bookings/${id}`),
  getBookingStats: () => api.get("/bookings/stats"),
  resendBookingEmail: (id) => api.post(`/bookings/${id}/resend-email`),
  
  // Gas Agency bookings
  getGasAgencyBookings: () => api.get("/gas-agency/bookings"),
  cancelGasAgencyBooking: (id) => api.patch(`/gas-agency/booking/${id}/cancel`),
  
  // Shopping Mall bookings
  getShoppingMallBookings: () => api.get("/shopping-mall/bookings"),
  cancelShoppingMallBooking: (id) => api.patch(`/shopping-mall/booking/${id}/cancel`),
  
  // Hospital bookings
  getHospitalBookings: () => api.get("/hospital/bookings"),
  cancelHospitalBooking: (id) => api.patch(`/hospital/booking/${id}/cancel`),
  
  // Pharmacy bookings
  getPharmacyBookings: () => api.get("/pharmacy/bookings"),
  cancelPharmacyBooking: (id) => api.patch(`/pharmacy/booking/${id}/cancel`),
  
  // Event bookings
  createEventBooking: (data) => api.post("/events", data),
  getEventBookings: () => api.get("/events"),
  getEventBookingById: (id) => api.get(`/events/${id}`),
  updateEventBooking: (id, data) => api.patch(`/events/${id}`, data),
  cancelEventBooking: (id) => api.delete(`/events/${id}`),
  resendEventEmail: (id) => api.post(`/events/${id}/resend-email`),

  // Wellness bookings
  createWellnessBooking: (data) => api.post("/wellness", data),
  getWellnessBookings: () => api.get("/wellness"),
  getWellnessBookingById: (id) => api.get(`/wellness/${id}`),
  updateWellnessBooking: (id, data) => api.patch(`/wellness/${id}`, data),
  cancelWellnessBooking: (id) => api.delete(`/wellness/${id}`),
  resendWellnessEmail: (id) => api.post(`/wellness/${id}/resend-email`),

  // Activity bookings (Adventure, Theme Parks, Guided Tours, Cruise, Boat Ride, Hostel, Resort, Homestay)
  createActivityBooking: (data) => api.post("/activity", data),
  getActivityBookings: () => api.get("/activity"),
  getActivityBookingById: (id) => api.get(`/activity/${id}`),
  updateActivityBooking: (id, data) => api.patch(`/activity/${id}`, data),
  cancelActivityBooking: (id) => api.delete(`/activity/${id}`),
  resendActivityEmail: (id) => api.post(`/activity/${id}/resend-email`),
};

// User API calls
export const userAPI = {
  getUsers: (params = {}) => api.get("/users", { params }),
  getUserById: (id) => api.get(`/users/${id}`),
  updateUser: (id, userData) => api.put(`/users/${id}`, userData),
  deleteUser: (id) => api.delete(`/users/${id}`),
  getUserStats: () => api.get("/users/stats"),
  updatePreferences: (preferences) =>
    api.put("/users/preferences", preferences),
  uploadAvatar: (formData) =>
    api.post("/users/avatar", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  updateProfile: (profileData) => api.put("/auth/profile", profileData),
  changePassword: (passwordData) =>
    api.post("/auth/change-password", passwordData),
};

// Error handling utility
export const handleApiError = (error) => {
  if (error.response) {
    // Server responded with error status
    const { status, data } = error.response;
    return {
      message: data.message || "An error occurred",
      status,
      errors: data.errors || null,
    };
  } else if (error.request) {
    // Request was made but no response received
    return {
      message: "Network error. Please check your connection.",
      status: 0,
      errors: null,
    };
  } else {
    // Something else happened
    return {
      message: error.message || "An unexpected error occurred",
      status: 0,
      errors: null,
    };
  }
};

export default api;
