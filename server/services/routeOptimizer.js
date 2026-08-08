const axios = require("axios");
const { logger } = require("../middleware/logging");

class RouteOptimizer {
  constructor() {
    // Using OSRM (Open Source Routing Machine) - free routing service
    this.osrmBase = "https://router.project-osrm.org";
  }

  /**
   * Get optimized route for multiple waypoints
   */
  async optimizeRoute(waypoints) {
    try {
      if (!waypoints || waypoints.length < 2) {
        throw new Error("At least 2 waypoints required");
      }

      // Format coordinates for OSRM: lng,lat;lng,lat;...
      const coordinates = waypoints
        .map(wp => `${wp.lng},${wp.lat}`)
        .join(";");

      const response = await axios.get(
        `${this.osrmBase}/trip/v1/driving/${coordinates}`,
        {
          params: {
            overview: "full",
            geometries: "geojson",
            steps: true,
            annotations: true,
          },
          timeout: 15000,
        }
      );

      if (response.data.code !== "Ok") {
        throw new Error("Route optimization failed");
      }

      const trip = response.data.trips[0];
      
      // Extract optimized waypoint order
      const optimizedOrder = trip.waypoints.map(wp => wp.waypoint_index);

      return {
        distance: Math.round(trip.distance), // meters
        duration: Math.round(trip.duration), // seconds
        geometry: trip.geometry,
        waypoints: trip.waypoints,
        optimizedOrder,
        legs: trip.legs.map(leg => ({
          distance: Math.round(leg.distance),
          duration: Math.round(leg.duration),
          steps: leg.steps.map(step => ({
            distance: Math.round(step.distance),
            duration: Math.round(step.duration),
            instruction: step.maneuver?.instruction || "",
            location: step.maneuver?.location,
          })),
        })),
      };
    } catch (error) {
      logger.error("Route optimization error:", error.message);
      throw new Error("Failed to optimize route");
    }
  }

  /**
   * Get route between two points
   */
  async getRoute(start, end, alternatives = false) {
    try {
      const coordinates = `${start.lng},${start.lat};${end.lng},${end.lat}`;

      const response = await axios.get(
        `${this.osrmBase}/route/v1/driving/${coordinates}`,
        {
          params: {
            overview: "full",
            geometries: "geojson",
            steps: true,
            alternatives: alternatives ? 3 : 0,
          },
          timeout: 10000,
        }
      );

      if (response.data.code !== "Ok") {
        throw new Error("Route calculation failed");
      }

      const routes = response.data.routes.map(route => ({
        distance: Math.round(route.distance),
        duration: Math.round(route.duration),
        geometry: route.geometry,
        legs: route.legs.map(leg => ({
          distance: Math.round(leg.distance),
          duration: Math.round(leg.duration),
          steps: leg.steps.map(step => ({
            distance: Math.round(step.distance),
            duration: Math.round(step.duration),
            instruction: step.maneuver?.instruction || "",
            location: step.maneuver?.location,
          })),
        })),
      }));

      // Return the first (best) route with totalDistance and totalDuration for compatibility
      const primaryRoute = routes[0];
      return {
        totalDistance: primaryRoute.distance, // in meters
        totalDuration: primaryRoute.duration, // in seconds
        geometry: primaryRoute.geometry,
        legs: primaryRoute.legs,
        routes: alternatives ? routes : undefined,
        waypoints: response.data.waypoints,
      };
    } catch (error) {
      logger.error("Route calculation error:", error.message);
      throw new Error("Failed to calculate route");
    }
  }

  /**
   * Calculate travel time matrix between multiple points
   */
  async getTravelMatrix(locations) {
    try {
      if (!locations || locations.length < 2) {
        throw new Error("At least 2 locations required");
      }

      const coordinates = locations
        .map(loc => `${loc.lng},${loc.lat}`)
        .join(";");

      const response = await axios.get(
        `${this.osrmBase}/table/v1/driving/${coordinates}`,
        {
          params: {
            annotations: "duration,distance",
          },
          timeout: 15000,
        }
      );

      if (response.data.code !== "Ok") {
        throw new Error("Matrix calculation failed");
      }

      return {
        durations: response.data.durations, // 2D array in seconds
        distances: response.data.distances, // 2D array in meters
        sources: response.data.sources,
        destinations: response.data.destinations,
      };
    } catch (error) {
      logger.error("Travel matrix error:", error.message);
      throw new Error("Failed to calculate travel matrix");
    }
  }

  /**
   * Suggest optimal daily itinerary based on locations
   */
  async optimizeDailyItinerary(places, startLocation, maxDailyDistance = 50000) {
    try {
      // Group places by proximity and optimize visiting order
      const allLocations = [startLocation, ...places];
      const matrix = await this.getTravelMatrix(allLocations);

      const days = [];
      let currentDay = [];
      let currentDistance = 0;
      const visited = new Set();

      // Simple greedy algorithm for daily grouping
      let currentIndex = 0; // Start from starting location
      visited.add(0);

      while (visited.size < allLocations.length) {
        let nearestIndex = -1;
        let nearestDistance = Infinity;

        // Find nearest unvisited location
        for (let i = 0; i < allLocations.length; i++) {
          if (!visited.has(i) && matrix.distances[currentIndex][i] < nearestDistance) {
            nearestDistance = matrix.distances[currentIndex][i];
            nearestIndex = i;
          }
        }

        if (nearestIndex === -1) break;

        // Check if adding this place exceeds daily limit
        if (currentDistance + nearestDistance > maxDailyDistance && currentDay.length > 0) {
          days.push([...currentDay]);
          currentDay = [];
          currentDistance = 0;
          currentIndex = 0; // Reset to start location
        } else {
          if (nearestIndex > 0) { // Don't add start location to places
            currentDay.push(places[nearestIndex - 1]);
          }
          currentDistance += nearestDistance;
          visited.add(nearestIndex);
          currentIndex = nearestIndex;
        }
      }

      if (currentDay.length > 0) {
        days.push(currentDay);
      }

      return {
        days,
        totalDays: days.length,
        estimatedTotalDistance: matrix.distances.reduce((sum, row) => 
          sum + row.reduce((a, b) => a + b, 0), 0
        ),
      };
    } catch (error) {
      logger.error("Daily itinerary optimization error:", error.message);
      throw new Error("Failed to optimize daily itinerary");
    }
  }
}

module.exports = RouteOptimizer;
