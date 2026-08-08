const express = require("express");
const { protect: auth } = require("../middleware/auth");
const freeMapService = require("../services/freeMapService");
const mapsController = require("../controllers/mapsController");
const User = require("../models/User");
const { logger } = require("../middleware/logging");

const router = express.Router();

/**
 * @route   GET /api/maps/places/nearby
 * @desc    Get nearby places (hotels, restaurants, attractions) using OSM/Overpass
 */
router.get("/places/nearby", async (req, res) => {
  try {
    const { lat, lng, radius = 5000, type = "tourist_attraction", keyword } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: "Latitude and longitude are required",
      });
    }

    const location = `${lat},${lng}`;
    // Convert "all" to null for the service
    const searchType = type === "all" ? null : type;
    
    const data = await freeMapService.nearbySearch(
      location,
      parseInt(radius, 10),
      searchType,
      keyword
    );

    logger.info(`Found ${data.results.length} places near ${location} with type: ${type}`);

    res.json({
      success: true,
      data: {
        places: data.results,
        status: data.status
      },
    });
  } catch (error) {
    logger.error("Nearby places error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching nearby places",
    });
  }
});

/**
 * @route   GET /api/maps/places/search
 * @desc    Search for places using Nominatim
 */
router.get("/places/search", async (req, res) => {
  try {
    const { query, location, radius = 50000, type } = req.query;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: "Search query is required",
      });
    }

    const data = await freeMapService.searchPlaces(
      query,
      location,
      parseInt(radius, 10),
      type
    );

    res.json({
      success: true,
      data: {
        places: data.results,
        status: data.status
      },
    });
  } catch (error) {
    logger.error("Places search error:", error);
    res.status(500).json({
      success: false,
      message: "Error searching places",
    });
  }
});

/**
 * @route   GET /api/maps/geocode
 * @desc    Geocode an address to coordinates using Nominatim
 */
router.get("/geocode", async (req, res) => {
  try {
    const { address } = req.query;

    if (!address) {
      return res.status(400).json({
        success: false,
        message: "Address is required",
      });
    }

    const result = await freeMapService.geocode(address);

    res.json({
      success: true,
      result
    });
  } catch (error) {
    logger.error("Geocoding error:", error.message);
    
    // Return user-friendly error message
    res.status(error.message.includes('not found') ? 404 : 500).json({
      success: false,
      message: error.message || "Error geocoding address. Please try again.",
    });
  }
});

/**
 * @route   GET /api/maps/reverse-geocode
 * @desc    Reverse geocode coordinates to address
 */
router.get("/reverse-geocode", async (req, res) => {
  try {
    const { lat, lng } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: "Latitude and longitude are required",
      });
    }

    const result = await freeMapService.reverseGeocode(parseFloat(lat), parseFloat(lng));

    res.json({
      success: true,
      result
    });
  } catch (error) {
    logger.error("Reverse geocoding error:", error);
    res.status(500).json({
      success: false,
      message: "Error reverse geocoding coordinates",
    });
  }
});

/**
 * @route   GET /api/maps/directions
 * @desc    Get directions using OSRM
 */
router.get("/directions", async (req, res) => {
  try {
    const { origin, destination, mode = "driving" } = req.query;

    if (!origin || !destination) {
      return res.status(400).json({
        success: false,
        message: "Origin and destination are required",
      });
    }

    const data = await freeMapService.getDirections(origin, destination, mode);

    res.json({
      success: true,
      data
    });
  } catch (error) {
    logger.error("Directions error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching directions",
    });
  }
});

/**
 * @route   GET /api/maps/distance
 * @desc    Calculate distance between two locations (supports addresses or coordinates)
 */
router.get("/distance", async (req, res) => {
  try {
    const { from, to } = req.query;

    if (!from || !to) {
      return res.status(400).json({
        success: false,
        message: "Both 'from' and 'to' parameters are required",
      });
    }

    // Check if inputs are coordinates or addresses
    const isCoordinate = (str) => /^-?\d+\.?\d*,-?\d+\.?\d*$/.test(str);

    let fromCoords = from;
    let toCoords = to;

    // Geocode addresses if needed
    if (!isCoordinate(from)) {
      const geocoded = await freeMapService.geocode(from);
      fromCoords = `${geocoded.location.lat},${geocoded.location.lng}`;
    }

    if (!isCoordinate(to)) {
      const geocoded = await freeMapService.geocode(to);
      toCoords = `${geocoded.location.lat},${geocoded.location.lng}`;
    }

    // Parse coordinates for fallback calculation
    const [fromLat, fromLng] = fromCoords.split(',').map(parseFloat);
    const [toLat, toLng] = toCoords.split(',').map(parseFloat);

    // Try to get directions first
    let directions;
    try {
      directions = await freeMapService.getDirections(fromCoords, toCoords, "driving");
    } catch (dirError) {
      logger.warn("Directions API failed, using Haversine distance:", dirError.message);
      directions = null;
    }
    
    if (directions && directions.routes && directions.routes.length > 0) {
      const route = directions.routes[0];
      const leg = route.legs[0];
      
      res.json({
        success: true,
        data: {
          from: from,
          to: to,
          distance: {
            meters: leg.distance.value,
            kilometers: (leg.distance.value / 1000).toFixed(2),
            text: leg.distance.text,
          },
          duration: {
            seconds: leg.duration.value,
            minutes: Math.round(leg.duration.value / 60),
            text: leg.duration.text,
          },
        },
      });
    } else {
      // Fallback to Haversine distance calculation
      const distanceKm = freeMapService.calculateDistance(fromLat, fromLng, toLat, toLng);
      const distanceMeters = Math.round(distanceKm * 1000);
      const estimatedDurationMinutes = Math.round(distanceKm / 60 * 60); // Assume 60 km/h average speed
      
      res.json({
        success: true,
        data: {
          from: from,
          to: to,
          distance: {
            meters: distanceMeters,
            kilometers: distanceKm.toFixed(2),
            text: `${distanceKm.toFixed(1)} km`,
          },
          duration: {
            seconds: estimatedDurationMinutes * 60,
            minutes: estimatedDurationMinutes,
            text: `${estimatedDurationMinutes} mins`,
          },
        },
      });
    }
  } catch (error) {
    logger.error("Distance calculation error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error calculating distance. Please check location names and try again.",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

// --- SAVED LOCATIONS (Database Logic) ---

/**
 * @route   POST /api/maps/save-location
 * @desc    Save user's current location
 * @access  Private
 */
router.post("/save-location", auth, async (req, res) => {
  try {
    const { name, lat, lng, address } = req.body;

    if (!name || !lat || !lng) {
      return res.status(400).json({
        success: false,
        message: "Name, latitude, and longitude are required",
      });
    }

    // Get address if not provided
    let locationAddress = address;
    if (!locationAddress) {
      try {
        const rev = await freeMapService.reverseGeocode(parseFloat(lat), parseFloat(lng));
        locationAddress = rev.formatted_address;
      } catch (err) {
        locationAddress = `${lat}, ${lng}`;
      }
    }

    const user = await User.findById(req.user.id);

    // Check if location already exists (100m proximity)
    const existingLocation = user.savedDestinations.find(
      (dest) =>
        freeMapService.calculateDistance(
          dest.coordinates.lat,
          dest.coordinates.lng,
          parseFloat(lat),
          parseFloat(lng)
        ) < 0.1
    );

    if (existingLocation) {
      return res.status(400).json({
        success: false,
        message: "Location already saved",
      });
    }

    user.savedDestinations.push({
      name,
      coordinates: { lat: parseFloat(lat), lng: parseFloat(lng) },
      address: locationAddress,
    });

    await user.save();

    res.json({
      success: true,
      message: "Location saved successfully",
      data: {
        savedDestinations: user.savedDestinations,
      },
    });
  } catch (error) {
    logger.error("Save location error:", error);
    res.status(500).json({
      success: false,
      message: "Error saving location",
    });
  }
});

/**
 * @route   GET /api/maps/saved-locations
 * @desc    Get user's saved locations
 * @access  Private
 */
router.get("/saved-locations", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    res.json({
      success: true,
      data: {
        savedDestinations: user.savedDestinations,
      },
    });
  } catch (error) {
    logger.error("Get saved locations error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching saved locations",
    });
  }
});

/**
 * @route   DELETE /api/maps/saved-locations/:id
 * @desc    Remove a saved location
 * @access  Private
 */
router.delete("/saved-locations/:id", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    const locationIndex = user.savedDestinations.findIndex(
      (dest) => dest._id.toString() === req.params.id
    );

    if (locationIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Saved location not found",
      });
    }

    user.savedDestinations.splice(locationIndex, 1);
    await user.save();

    res.json({
      success: true,
      message: "Location removed successfully",
      data: {
        savedDestinations: user.savedDestinations,
      },
    });
  } catch (error) {
    logger.error("Remove saved location error:", error);
    res.status(500).json({
      success: false,
      message: "Error removing saved location",
    });
  }
});

// ============= NEW FEATURES =============

/**
 * @route   GET /api/maps/weather/current
 * @desc    Get current weather for a location
 * @access  Public
 */
router.get("/weather/current", mapsController.getCurrentWeather);

/**
 * @route   GET /api/maps/weather/forecast
 * @desc    Get weather forecast for a location
 * @access  Public
 */
router.get("/weather/forecast", mapsController.getWeatherForecast);

/**
 * @route   GET /api/maps/weather/travel-suggestions
 * @desc    Get weather-based travel suggestions
 * @access  Public
 */
router.get("/weather/travel-suggestions", mapsController.getTravelSuggestions);

/**
 * @route   POST /api/maps/route/optimize
 * @desc    Optimize route for multiple waypoints
 * @access  Public
 */
router.post("/route/optimize", mapsController.optimizeRoute);

/**
 * @route   GET /api/maps/route
 * @desc    Get route between two points
 * @access  Public
 */
router.get("/route", mapsController.getRoute);

/**
 * @route   GET /api/maps/recommendations
 * @desc    Get recommended hotels and places
 * @access  Public
 */
router.get("/recommendations", mapsController.getRecommendedPlaces);

module.exports = router;
