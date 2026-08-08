const { validationResult } = require("express-validator");
const axios = require("axios");
const mapService = require("../services/freeMapService");
const WeatherService = require("../services/weatherService");
const RouteOptimizer = require("../services/routeOptimizer");
const Review = require("../models/Review");

const weatherService = new WeatherService();
const routeOptimizer = new RouteOptimizer();

// Mock places data - replace with Google Places API in production
const mockPlacesData = {
  restaurants: [
    {
      id: "rest_1",
      name: "Le Bernardin",
      category: "Fine Dining",
      cuisine: "French Seafood",
      rating: 4.8,
      priceLevel: 4,
      location: {
        address: "155 W 51st St, New York, NY 10019",
        coordinates: { lat: 40.7614, lng: -73.9776 },
      },
      hours: {
        monday: "5:30 PM - 10:30 PM",
        tuesday: "5:30 PM - 10:30 PM",
        wednesday: "5:30 PM - 10:30 PM",
        thursday: "5:30 PM - 10:30 PM",
        friday: "5:30 PM - 10:30 PM",
        saturday: "5:30 PM - 10:30 PM",
        sunday: "Closed",
      },
      photos: ["photo1.jpg", "photo2.jpg"],
      reviews: [
        {
          author: "John D.",
          rating: 5,
          text: "Exceptional seafood and impeccable service.",
          date: "2024-01-15",
        },
      ],
      phone: "+1 212-554-1515",
      website: "https://le-bernardin.com",
      amenities: ["Reservations Required", "Valet Parking", "Wine Pairing"],
    },
  ],
  attractions: [
    {
      id: "attr_1",
      name: "Statue of Liberty",
      category: "Monument",
      rating: 4.6,
      location: {
        address: "Liberty Island, New York, NY 10004",
        coordinates: { lat: 40.6892, lng: -74.0445 },
      },
      description: "Iconic symbol of freedom and democracy",
      hours: {
        monday: "9:00 AM - 5:00 PM",
        tuesday: "9:00 AM - 5:00 PM",
        wednesday: "9:00 AM - 5:00 PM",
        thursday: "9:00 AM - 5:00 PM",
        friday: "9:00 AM - 5:00 PM",
        saturday: "9:00 AM - 5:00 PM",
        sunday: "9:00 AM - 5:00 PM",
      },
      ticketPrice: {
        adult: 25,
        child: 12,
        currency: "USD",
      },
      photos: ["statue1.jpg", "statue2.jpg"],
      tags: ["History", "Monument", "Photography", "Iconic"],
      accessibility: true,
      estimatedVisitTime: "3-4 hours",
    },
  ],
  hotels: [
    {
      id: "hotel_1",
      name: "The Plaza",
      category: "Luxury Hotel",
      rating: 4.5,
      priceLevel: 4,
      location: {
        address: "768 5th Ave, New York, NY 10019",
        coordinates: { lat: 40.7648, lng: -73.9754 },
      },
      amenities: [
        "Spa",
        "Fitness Center",
        "Restaurant",
        "Room Service",
        "Concierge",
      ],
      photos: ["plaza1.jpg", "plaza2.jpg"],
      phone: "+1 212-759-3000",
      website: "https://theplazany.com",
    },
  ],
};

// Search places (restaurants, attractions, hotels)
const searchPlaces = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation errors",
        errors: errors.array(),
      });
    }

    const {
      query,
      location,
      radius = 50000, // meters
      type = null,
      limit = 10,
    } = req.query;

    if (!query || query.trim() === '') {
      return res.status(400).json({
        success: false,
        message: "Query parameter is required",
      });
    }

    // Use real geocoding search via Nominatim
    const searchResult = await mapService.searchPlaces(query, location, radius, type);
    
    // Format the response to match expected structure
    const results = (searchResult.results || []).map(place => ({
      name: place.name || place.formatted_address.split(',')[0],
      display_name: place.formatted_address,
      lat: place.geometry.location.lat,
      lon: place.geometry.location.lng,
      address: place.formatted_address,
      place_id: place.place_id,
      type: place.types?.[0] || 'location',
    })).slice(0, parseInt(limit) || 10);

    res.json({
      success: true,
      results,
      totalResults: results.length,
    });
  } catch (error) {
    console.error("Search places error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to search places",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Get place details
const getPlaceDetails = async (req, res) => {
  try {
    const { placeId } = req.params;

    // Search in all categories
    let place = null;
    const allPlaces = [
      ...mockPlacesData.restaurants,
      ...mockPlacesData.attractions,
      ...mockPlacesData.hotels,
    ];

    place = allPlaces.find((p) => p.id === placeId);

    if (!place) {
      return res.status(404).json({
        success: false,
        message: "Place not found",
      });
    }

    // In production, fetch additional details from Google Places API
    const detailedPlace = {
      ...place,
      nearbyPlaces: [
        {
          id: "nearby_1",
          name: "Central Park",
          category: "Park",
          distance: "0.3 miles",
          walkingTime: "6 minutes",
        },
        {
          id: "nearby_2",
          name: "Times Square",
          category: "Tourist Attraction",
          distance: "0.5 miles",
          walkingTime: "10 minutes",
        },
      ],
      transportation: {
        subway: ["N, Q, R, W lines"],
        bus: ["M5, M7, M104"],
        parking: "Valet parking available",
        taxi: "Available 24/7",
      },
      weather: {
        current: "72°F",
        condition: "Partly cloudy",
        forecast: "Sunny, high 75°F",
      },
    };

    res.json({
      success: true,
      data: {
        place: detailedPlace,
      },
    });
  } catch (error) {
    console.error("Get place details error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get place details",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Get directions between two points
const getDirections = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation errors",
        errors: errors.array(),
      });
    }

    const {
      origin,
      destination,
      mode = "driving", // driving, walking, transit, bicycling
      waypoints,
      alternatives = false,
    } = req.query;

    // In production, use Google Directions API
    const directions = {
      routes: [
        {
          summary: "via FDR Dr",
          distance: "8.2 miles",
          duration: "22 minutes",
          steps: [
            {
              instruction: "Head north on 5th Ave toward E 59th St",
              distance: "0.3 miles",
              duration: "2 minutes",
              maneuver: "turn-right",
            },
            {
              instruction: "Turn right onto FDR Dr",
              distance: "5.8 miles",
              duration: "15 minutes",
              maneuver: "turn-right",
            },
            {
              instruction: "Take exit 18 for Brooklyn Bridge",
              distance: "2.1 miles",
              duration: "5 minutes",
              maneuver: "exit-right",
            },
          ],
          trafficCondition: "moderate",
          estimatedCost: {
            fuel: 2.5,
            tolls: 0,
            parking: 15,
            currency: "USD",
          },
        },
      ],
      alternatives: alternatives
        ? [
            {
              summary: "via West Side Hwy",
              distance: "9.1 miles",
              duration: "28 minutes",
              description: "Slightly longer but scenic route",
            },
          ]
        : [],
      origin: {
        name: origin,
        coordinates: { lat: 40.7648, lng: -73.9754 },
      },
      destination: {
        name: destination,
        coordinates: { lat: 40.7061, lng: -74.0087 },
      },
      mode,
      waypoints: waypoints ? waypoints.split("|") : [],
    };

    res.json({
      success: true,
      data: directions,
    });
  } catch (error) {
    console.error("Get directions error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get directions",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Get nearby places
const getNearbyPlaces = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation errors",
        errors: errors.array(),
      });
    }

    const {
      latitude,
      longitude,
      radius = 1000,
      type = "all",
      keyword,
    } = req.query;

    // Validate coordinates
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    
    if (!mapService.validateCoordinates(lat, lng)) {
      return res.status(400).json({
        success: false,
        message: "Invalid coordinates provided",
      });
    }

    // Use real map service to fetch nearby places
    const location = `${lat},${lng}`;
    const searchRadius = parseInt(radius);
    
    // Map 'all' to null for the service (it will return amenities)
    const searchType = type === "all" ? null : type;
    
    const searchResults = await mapService.nearbySearch(
      location,
      searchRadius,
      searchType,
      keyword || null
    );

    // Transform results to match expected format
    const places = searchResults.results.map((place) => {
      const placeLat = place.geometry.location.lat;
      const placeLng = place.geometry.location.lng;
      const distance = mapService.calculateDistance(lat, lng, placeLat, placeLng);
      
      return {
        id: place.place_id,
        name: place.name,
        category: place.types && place.types.length > 0 ? place.types[0] : "place",
        rating: place.rating || 4.0,
        location: {
          address: place.vicinity || place.formatted_address || "",
          coordinates: {
            lat: placeLat,
            lng: placeLng,
          },
        },
        geometry: place.geometry,
        distance: Math.round(distance * 1000), // Convert km to meters
        walkingTime: Math.round((distance * 1000) / 80), // Rough estimate: 80m/min
        photos: place.photos || [],
        types: place.types || [],
      };
    });

    res.json({
      success: true,
      data: {
        places,
        center: {
          latitude: lat,
          longitude: lng,
        },
        radius: searchRadius,
        totalResults: places.length,
      },
    });
  } catch (error) {
    console.error("Get nearby places error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get nearby places",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Geocode address
const geocodeAddress = async (req, res) => {
  try {
    const { address } = req.query;

    if (!address) {
      return res.status(400).json({
        success: false,
        message: "Address is required",
      });
    }

    // Use real geocoding service
    const geocodeResult = await mapService.geocode(address);
    
    if (!geocodeResult || !geocodeResult.location) {
      return res.status(404).json({
        success: false,
        message: "Location not found",
      });
    }

    res.json({
      success: true,
      result: geocodeResult,
    });
  } catch (error) {
    console.error("Geocode address error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to geocode address",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Reverse geocode coordinates
const reverseGeocode = async (req, res) => {
  try {
    const { latitude, longitude } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: "Latitude and longitude are required",
      });
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    
    if (!mapService.validateCoordinates(lat, lng)) {
      return res.status(400).json({
        success: false,
        message: "Invalid coordinates provided",
      });
    }

    // Use real reverse geocoding service
    const location = `${lat},${lng}`;
    const reverseGeocodeResult = await mapService.reverseGeocode(location);
    
    if (!reverseGeocodeResult) {
      return res.status(404).json({
        success: false,
        message: "Address not found for these coordinates",
      });
    }

    res.json({
      success: true,
      data: reverseGeocodeResult,
    });
  } catch (error) {
    console.error("Reverse geocode error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to reverse geocode coordinates",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Get travel time matrix
const getTravelTimeMatrix = async (req, res) => {
  try {
    const {
      origins,
      destinations,
      mode = "driving",
      units = "metric",
    } = req.query;

    if (!origins || !destinations) {
      return res.status(400).json({
        success: false,
        message: "Origins and destinations are required",
      });
    }

    // In production, use Google Distance Matrix API
    const matrix = {
      origin_addresses: origins.split("|"),
      destination_addresses: destinations.split("|"),
      rows: [
        {
          elements: [
            {
              distance: { text: "8.2 mi", value: 13200 },
              duration: { text: "22 mins", value: 1320 },
              status: "OK",
            },
            {
              distance: { text: "12.1 mi", value: 19500 },
              duration: { text: "35 mins", value: 2100 },
              status: "OK",
            },
          ],
        },
      ],
      status: "OK",
    };

    res.json({
      success: true,
      data: matrix,
    });
  } catch (error) {
    console.error("Get travel time matrix error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get travel time matrix",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
}

// Weather endpoints
async function getCurrentWeather(req, res) {
  try {
    const { lat, lng } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: "Latitude and longitude are required",
      });
    }

    const weather = await weatherService.getCurrentWeather(
      parseFloat(lat),
      parseFloat(lng)
    );

    res.json({
      success: true,
      data: weather,
    });
  } catch (error) {
    console.error("Get current weather error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch weather",
    });
  }
}

async function getWeatherForecast(req, res) {
  try {
    const { lat, lng, days = 30 } = req.query; // Changed default from 7 to 30 days

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: "Latitude and longitude are required",
      });
    }

    // Validate days parameter (1-30 days)
    const requestedDays = Math.min(Math.max(parseInt(days), 1), 30);

    const forecast = await weatherService.getWeatherForecast(
      parseFloat(lat),
      parseFloat(lng),
      requestedDays
    );

    res.json({
      success: true,
      data: {
        forecast: forecast,
        totalDays: forecast.length,
        forecastDays: forecast.filter(d => d.dataType === 'forecast').length,
        estimateDays: forecast.filter(d => d.dataType === 'climate_estimate' || d.dataType === 'estimate').length,
        note: requestedDays > 16 
          ? 'Days 1-16: Real-time forecast, Days 17+: Climate-based estimates'
          : 'Real-time forecast data'
      },
    });
  } catch (error) {
    console.error("Get weather forecast error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch forecast",
    });
  }
}

async function getTravelSuggestions(req, res) {
  try {
    const { lat, lng, startDate, endDate } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: "Latitude and longitude are required",
      });
    }

    const suggestions = await weatherService.getTravelSuggestions(
      parseFloat(lat),
      parseFloat(lng),
      startDate,
      endDate
    );

    res.json({
      success: true,
      data: suggestions,
    });
  } catch (error) {
    console.error("Get travel suggestions error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to get travel suggestions",
    });
  }
}

// Route optimization endpoints
async function optimizeRoute(req, res) {
  try {
    const { waypoints } = req.body;

    if (!waypoints || !Array.isArray(waypoints) || waypoints.length < 2) {
      return res.status(400).json({
        success: false,
        message: "At least 2 waypoints required",
      });
    }

    const optimized = await routeOptimizer.optimizeRoute(waypoints);

    res.json({
      success: true,
      data: optimized,
    });
  } catch (error) {
    console.error("Optimize route error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to optimize route",
    });
  }
}

async function getRoute(req, res) {
  try {
    const { startLat, startLng, endLat, endLng, alternatives } = req.query;

    if (!startLat || !startLng || !endLat || !endLng) {
      return res.status(400).json({
        success: false,
        message: "Start and end coordinates are required",
      });
    }

    const route = await routeOptimizer.getRoute(
      { lat: parseFloat(startLat), lng: parseFloat(startLng) },
      { lat: parseFloat(endLat), lng: parseFloat(endLng) },
      alternatives === 'true'
    );

    res.json({
      success: true,
      data: route,
    });
  } catch (error) {
    console.error("Get route error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to get route",
    });
  }
}

// Hotel and place recommendations
async function getRecommendedPlaces(req, res) {
  try {
    const { lat, lng, type = 'hotel', budget, rating, minRating, radius } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: "Latitude and longitude are required",
      });
    }

    // Use minRating or rating parameter, default to 3.5
    const minimumRating = parseFloat(minRating || rating || 3.5);
    
    // Use radius parameter or default to 5km
    const searchRadius = radius ? parseFloat(radius) : 5000;

    // Get nearby places - format location as "lat,lng" string
    const location = `${parseFloat(lat)},${parseFloat(lng)}`;
    const placesResponse = await mapService.nearbySearch(
      location,
      searchRadius,
      type,
      null // keyword
    );

    const places = placesResponse.results || [];

    if (!places || places.length === 0) {
      return res.json({
        success: true,
        data: {
          recommendations: [],
          total: 0,
        },
      });
    }

    // Get reviews for these places
    const placeIds = places.map(p => p.place_id);
    let reviews = [];
    
    try {
      reviews = await Review.aggregate([
        { $match: { placeId: { $in: placeIds } } },
        {
          $group: {
            _id: "$placeId",
            avgRating: { $avg: "$rating" },
            reviewCount: { $sum: 1 },
          },
        },
      ]);
    } catch (reviewError) {
      console.log("Review query failed, continuing without reviews:", reviewError.message);
      reviews = [];
    }

    // Merge reviews with places
    const recommendedPlaces = places.map(place => {
      const placeReview = reviews.find(r => r._id === place.place_id);
      return {
        ...place,
        userRating: placeReview?.avgRating || null,
        userReviewCount: placeReview?.reviewCount || 0,
        recommendationScore: calculateRecommendationScore(
          place,
          placeReview,
          minimumRating,
          budget
        ),
      };
    });

    // Sort by recommendation score
    recommendedPlaces.sort((a, b) => b.recommendationScore - a.recommendationScore);

    res.json({
      success: true,
      data: {
        recommendations: recommendedPlaces.slice(0, 20),
        total: recommendedPlaces.length,
      },
    });
  } catch (error) {
    console.error("Get recommended places error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to get recommendations",
    });
  }
}

function calculateRecommendationScore(place, review, minRating, budget) {
  let score = 50; // Base score

  // Rating score (0-30 points)
  const rating = review?.avgRating || place.rating || 0;
  if (rating >= minRating) {
    score += (rating / 5) * 30;
  }

  // Review count score (0-20 points)
  const reviewCount = review?.reviewCount || 0;
  score += Math.min(reviewCount / 10, 20);

  // Distance bonus (closer is better, 0-10 points)
  const distance = place._distanceKm || 0;
  if (distance < 1) score += 10;
  else if (distance < 3) score += 5;
  else if (distance < 5) score += 2;

  // Budget match (if applicable)
  if (budget && place.priceLevel) {
    const priceDiff = Math.abs(parseInt(budget) - place.priceLevel);
    score += Math.max(0, 10 - priceDiff * 3);
  }

  return Math.round(score);
}

module.exports = {
  searchPlaces,
  getPlaceDetails,
  getDirections,
  getNearbyPlaces,
  geocodeAddress,
  reverseGeocode,
  getTravelTimeMatrix,
  // New features
  getCurrentWeather,
  getWeatherForecast,
  getTravelSuggestions,
  optimizeRoute,
  getRoute,
  getRecommendedPlaces,
};
