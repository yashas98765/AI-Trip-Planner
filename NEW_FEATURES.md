# New Features Guide - AI Trip Planner

## 🌤️ Weather-Based Suggestions

### Backend APIs

**Get Current Weather**
```javascript
GET /api/maps/weather/current?lat=12.9716&lng=77.5946
```

**Get Weather Forecast (7 days)**
```javascript
GET /api/maps/weather/forecast?lat=12.9716&lng=77.5946&days=7
```

**Get Travel Suggestions**
```javascript
GET /api/maps/weather/travel-suggestions?lat=12.9716&lng=77.5946&startDate=2026-03-01&endDate=2026-03-07
```

### Frontend Usage

```javascript
import { mapsAPI } from './services/api';
import { WeatherWidget } from './components/ui';

// Get current weather
const weather = await mapsAPI.getCurrentWeather({ lat: 12.9716, lng: 77.5946 });

// Get forecast
const forecast = await mapsAPI.getWeatherForecast({ lat: 12.9716, lng: 77.5946, days: 7 });

// Get travel suggestions
const suggestions = await mapsAPI.getTravelSuggestions({ 
  lat: 12.9716, 
  lng: 77.5946,
  startDate: '2026-03-01',
  endDate: '2026-03-07'
});

// Use the widget component
<WeatherWidget lat={12.9716} lng={77.5946} />
```

### Features

- Real-time weather data using Open-Meteo API (free, no API key required)
- 7-day weather forecast with temperature, precipitation, wind speed
- Smart travel suggestions based on weather conditions
- Weather scoring system (excellent/good/fair/poor)
- Activity recommendations based on forecast
- Warning alerts for extreme weather conditions

---

## 🗺️ Route Optimization

### Backend APIs

**Optimize Multi-Stop Route**
```javascript
POST /api/maps/route/optimize
Body: {
  "waypoints": [
    { "lat": 12.9716, "lng": 77.5946 },
    { "lat": 13.0827, "lng": 77.5880 },
    { "lat": 12.9352, "lng": 77.6245 }
  ]
}
```

**Get Route Between Two Points**
```javascript
GET /api/maps/route?startLat=12.9716&startLng=77.5946&endLat=13.0827&endLng=77.5880&alternatives=true
```

### Frontend Usage

```javascript
import { mapsAPI } from './services/api';

// Optimize route with multiple stops
const optimized = await mapsAPI.optimizeRoute([
  { lat: 12.9716, lng: 77.5946 }, // Start
  { lat: 13.0827, lng: 77.5880 }, // Stop 1
  { lat: 12.9352, lng: 77.6245 }  // Stop 2
]);

console.log("Optimized order:", optimized.data.optimizedOrder);
console.log("Total distance:", optimized.data.distance, "meters");
console.log("Total duration:", optimized.data.duration, "seconds");

// Get route with alternatives
const route = await mapsAPI.getRoute({
  startLat: 12.9716,
  startLng: 77.5946,
  endLat: 13.0827,
  endLng: 77.5880,
  alternatives: true
});
```

### Features

- Uses OSRM (Open Source Routing Machine) - free routing service
- Traveling Salesman Problem (TSP) optimization for multi-stop routes
- Route alternatives with different paths
- Turn-by-turn navigation instructions
- Distance and duration estimates
- GeoJSON route geometry for map visualization

---

## 🏨 Hotel and Place Recommendation System

### Backend API

**Get Recommended Places**
```javascript
GET /api/maps/recommendations?lat=12.9716&lng=77.5946&type=hotel&rating=3.5&budget=3
```

Parameters:
- `lat`, `lng` - Location coordinates
- `type` - Place type (hotel, restaurant, tourist_attraction, etc.)
- `rating` - Minimum rating filter (1-5)
- `budget` - Price level preference (1-4)

### Frontend Usage

```javascript
import { mapsAPI } from './services/api';

const recommendations = await mapsAPI.getRecommendations({
  lat: 12.9716,
  lng: 77.5946,
  type: 'hotel',
  rating: 3.5,
  budget: 3
});

recommendations.data.places.forEach(place => {
  console.log(place.name);
  console.log("Recommendation Score:", place.recommendationScore);
  console.log("User Rating:", place.userRating);
  console.log("Reviews:", place.userReviewCount);
});
```

### Recommendation Algorithm

The system calculates a recommendation score (0-100) based on:

1. **Rating Score (30 points max)**
   - Higher ratings get more points
   - Based on both OSM data and user reviews

2. **Review Count (20 points max)**
   - More reviews = more reliable
   - Popular places ranked higher

3. **Distance Bonus (10 points max)**
   - < 1km: +10 points
   - 1-3km: +5 points
   - 3-5km: +2 points

4. **Budget Match (10 points max)**
   - Matches your budget preference
   - Closer price level = higher score

---

## ⭐ User Reviews + Rating Prediction

### Backend APIs

**Create Review**
```javascript
POST /api/reviews
Body: {
  "placeId": "way_123456",
  "placeName": "Taj Mahal",
  "placeType": "attraction",
  "rating": 5,
  "title": "Absolutely stunning!",
  "comment": "A must-visit landmark...",
  "visitDate": "2026-02-15",
  "location": { "lat": 27.1751, "lng": 78.0421 }
}
```

**Get Place Reviews**
```javascript
GET /api/reviews/place/way_123456?sort=-rating&limit=20&page=1
```

**Get My Reviews**
```javascript
GET /api/reviews/my-reviews
```

**Update Review**
```javascript
PUT /api/reviews/:id
Body: { "rating": 4, "comment": "Updated review..." }
```

**Delete Review**
```javascript
DELETE /api/reviews/:id
```

**Mark Review as Helpful**
```javascript
POST /api/reviews/:id/helpful
```

**Get Predicted Rating (ML-based)**
```javascript
GET /api/reviews/predict?placeType=hotel&location={"lat":12.97,"lng":77.59}
```

### Frontend Usage

```javascript
import { reviewAPI } from './services/api';

// Create a review
await reviewAPI.createReview({
  placeId: 'way_123456',
  placeName: 'Taj Mahal',
  placeType: 'attraction',
  rating: 5,
  title: 'Absolutely beautiful',
  comment: 'The architecture is stunning...',
  visitDate: '2026-02-15'
});

// Get reviews with stats
const { data } = await reviewAPI.getPlaceReviews('way_123456');
console.log("Average Rating:", data.stats.avgRating);
console.log("Total Reviews:", data.stats.totalReviews);
console.log("Distribution:", data.stats.distribution);

// Get rating prediction
const prediction = await reviewAPI.getPredictedRating({
  placeType: 'hotel'
});
console.log("Predicted Rating:", prediction.data.predicted);
console.log("Confidence:", prediction.data.confidence);
```

### Database Schema

**Review Model** (`models/Review.js`):
- user (ref to User)
- placeId (OSM ID)
- placeName
- placeType (restaurant/hotel/attraction/other)
- rating (1-5)
- title (max 100 chars)
- comment (max 1000 chars)
- photos (array of URLs)
- visitDate
- helpfulCount
- helpfulBy (array of user IDs)
- verified status
- location coordinates
- timestamps

### Rating Prediction System

The ML-based prediction analyzes:
1. User's past review patterns
2. Ratings for similar place types
3. Historical preferences
4. Returns confidence level (high/medium/low)

---

## 🚀 How to Use These Features

### 1. Weather Integration in Trip Planning

```javascript
// In TripPlanner component
const [weatherData, setWeatherData] = useState(null);

useEffect(() => {
  if (destination.lat && destination.lng) {
    mapsAPI.getTravelSuggestions({
      lat: destination.lat,
      lng: destination.lng,
      startDate: values.startDate,
      endDate: values.endDate
    }).then(res => {
      setWeatherData(res.data);
      
      // Show warnings if poor weather
      if (res.data.suggestions.overall === 'poor') {
        toast.warning("Weather conditions may be challenging for your dates");
      }
    });
  }
}, [destination, values.startDate, values.endDate]);
```

### 2. Route Optimization for Itinerary

```javascript
// Optimize daily itinerary
const places = trip.itinerary.flatMap(day => day.activities);
const waypoints = places.map(p => ({ lat: p.lat, lng: p.lng }));

const optimized = await mapsAPI.optimizeRoute(waypoints);

// Update itinerary with optimized order
const optimizedPlaces = optimized.data.optimizedOrder.map(i => places[i]);
```

### 3. Show Recommendations in Maps

```javascript
// Get hotel recommendations near destination
const hotels = await mapsAPI.getRecommendations({
  lat: currentLocation.lat,
  lng: currentLocation.lng,
  type: 'hotel',
  rating: 4.0,
  budget: userBudget
});

// Display sorted by recommendation score
hotels.data.places.forEach(hotel => {
  addMarkerToMap(hotel);
});
```

### 4. Review System Integration

```javascript
// After visiting a place, prompt for review
const handleVisitComplete = async (place) => {
  const shouldReview = window.confirm("Would you like to review this place?");
  
  if (shouldReview) {
    const rating = prompt("Rate from 1-5:");
    const comment = prompt("Share your experience:");
    
    await reviewAPI.createReview({
      placeId: place.place_id,
      placeName: place.name,
      placeType: 'attraction',
      rating: parseInt(rating),
      title: `Visited ${place.name}`,
      comment: comment
    });
  }
};
```

---

## 📊 API Response Examples

### Weather Response
```json
{
  "success": true,
  "data": {
    "temperature": 28.5,
    "feelsLike": 30.2,
    "humidity": 65,
    "precipitation": 0,
    "windSpeed": 12.5,
    "weatherCode": 2,
    "description": "Partly cloudy",
    "icon": "⛅",
    "unit": "°C"
  }
}
```

### Route Optimization Response
```json
{
  "success": true,
  "data": {
    "distance": 15420,
    "duration": 1850,
    "optimizedOrder": [0, 2, 1, 3],
    "geometry": {...},
    "legs": [...]
  }
}
```

### Review Stats Response
```json
{
  "success": true,
  "data": {
    "reviews": [...],
    "stats": {
      "avgRating": 4.3,
      "totalReviews": 127,
      "distribution": {
        "1": 3,
        "2": 5,
        "3": 15,
        "4": 45,
        "5": 59
      }
    }
  }
}
```

---

## 🎯 Next Steps

1. **Integrate Weather Widget** - Add to Maps page sidebar
2. **Create Route Planner UI** - Drag-and-drop waypoint ordering
3. **Build Review UI Components** - Star ratings, comment forms
4. **Add Recommendation Filters** - Budget sliders, rating filters
5. **ML Enhancement** - Train better prediction models with user data

---

## 📝 Notes

- All services use free APIs (no API keys needed except Gemini AI)
- Weather data from Open-Meteo (https://open-meteo.com/)
- Routing from OSRM (https://project-osrm.org/)
- Respect rate limits for free services
- Consider caching weather/route data
- Review moderation may be needed for production

---

## 🐛 Troubleshooting

**Weather not loading?**
- Check lat/lng coordinates are valid
- Verify Open-Meteo API is accessible

**Route optimization failing?**
- Ensure at least 2 waypoints provided
- Check OSRM service  status

**Reviews not saving?**
- User must be authenticated
- Check required fields (rating, title, comment)

**Recommendations empty?**
- Try increasing search radius
- Lower minimum rating filter
- Check if places exist in OSM database
