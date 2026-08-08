/**
 * Trip Score Calculator Utility
 * Calculates various compatibility and quality scores for trips
 */

/**
 * Calculate Relaxation Score (0-100)
 * Based on: activities, pace, accommodation type
 */
export const calculateRelaxationScore = (trip) => {
  let score = 50; // Base score

  // Analyze activities
  const relaxingActivities = ['spa', 'beach', 'yoga', 'meditation', 'resort', 'pool', 'massage'];
  const itinerary = trip.itinerary || [];

  // Check daily activities
  itinerary.forEach(day => {
    if (day.activities) {
      const dailyActivitiesCount = day.activities.length;
      if (dailyActivitiesCount <= 2) score += 5; // Fewer activities = more relaxing
      if (dailyActivitiesCount >= 5) score -= 5; // Many activities = less relaxing

      day.activities.forEach(activity => {
        const activityText = activity.activity?.toLowerCase() || activity.toLowerCase();
        if (relaxingActivities.some(keyword => activityText.includes(keyword))) {
          score += 3;
        }
      });
    }
  });

  // Analyze accommodation
  const accommodation = trip.accommodationType?.toLowerCase() || '';
  if (accommodation.includes('resort') || accommodation.includes('spa')) score += 10;
  if (accommodation.includes('hostel')) score -= 5;
  if (accommodation.includes('luxury') || accommodation.includes('boutique')) score += 5;

  // Analyze travel style
  const travelStyle = trip.travelStyle?.toLowerCase() || '';
  if (travelStyle === 'relaxed' || travelStyle === 'leisure') score += 15;
  if (travelStyle === 'adventure' || travelStyle === 'backpacker') score -= 10;

  // Analyze duration (longer trips tend to be more relaxing if well-paced)
  const duration = trip.duration || 0;
  if (duration >= 7) score += 5;

  return Math.min(Math.max(score, 0), 100);
};

/**
 * Calculate Adventure Level (Low, Medium, High, Extreme)
 */
export const calculateAdventureLevel = (trip) => {
  let score = 0;

  const adventureActivities = ['trekking', 'hiking', 'climbing', 'rafting', 'paragliding', 
    'scuba', 'diving', 'safari', 'camping', 'bungee', 'skydiving', 'skiing', 'snowboarding'];
  
  const itinerary = trip.itinerary || [];
  
  itinerary.forEach(day => {
    if (day.activities) {
      day.activities.forEach(activity => {
        const activityText = activity.activity?.toLowerCase() || activity.toLowerCase();
        if (adventureActivities.some(keyword => activityText.includes(keyword))) {
          score += 10;
        }
      });
    }
  });

  // Analyze travel style
  const travelStyle = trip.travelStyle?.toLowerCase() || '';
  if (travelStyle === 'adventure' || travelStyle === 'backpacker') score += 20;
  if (travelStyle === 'relaxed' || travelStyle === 'luxury') score -= 10;

  // Analyze interests
  const interests = trip.interests || [];
  if (interests.includes('adventure')) score += 15;
  if (interests.includes('hiking') || interests.includes('camping')) score += 10;

  if (score >= 60) return { level: 'Extreme', score, icon: '🔥' };
  if (score >= 40) return { level: 'High', score, icon: '⛰️' };
  if (score >= 20) return { level: 'Medium', score, icon: '🚴' };
  return { level: 'Low', score, icon: '🚶' };
};

/**
 * Calculate Budget Fit (Poor, Fair, Good, Excellent)
 */
export const calculateBudgetFit = (trip) => {
  const budget = trip.budget || 0;
  const totalCost = trip.totalCost || trip.estimatedCost || budget;
  
  if (!budget || !totalCost) return { fit: 'Unknown', percentage: 0, color: 'gray' };

  const percentage = (totalCost / budget) * 100;

  if (percentage <= 75) return { fit: 'Excellent', percentage: 100 - percentage + 75, color: 'green', icon: '✅' };
  if (percentage <= 90) return { fit: 'Good', percentage: 90, color: 'blue', icon: '👍' };
  if (percentage <= 105) return { fit: 'Fair', percentage: 70, color: 'yellow', icon: '⚠️' };
  return { fit: 'Over Budget', percentage: 50, color: 'red', icon: '❌' };
};

/**
 * Calculate Cultural Immersion Score
 */
export const calculateCultureScore = (trip) => {
  let score = 0;

  const culturalActivities = ['museum', 'temple', 'historical', 'local market', 'cultural', 
    'heritage', 'monument', 'traditional', 'festival', 'local cuisine'];

  const itinerary = trip.itinerary || [];
  
  itinerary.forEach(day => {
    if (day.activities) {
      day.activities.forEach(activity => {
        const activityText = activity.activity?.toLowerCase() || activity.toLowerCase();
        if (culturalActivities.some(keyword => activityText.includes(keyword))) {
          score += 8;
        }
      });
    }
  });

  const interests = trip.interests || [];
  if (interests.includes('culture') || interests.includes('history')) score += 15;

  return Math.min(score, 100);
};

/**
 * Calculate Food Experience Score
 */
export const calculateFoodScore = (trip) => {
  let score = 30; // Base score

  const foodActivities = ['restaurant', 'food', 'cuisine', 'dining', 'cafe', 'street food', 
    'local food', 'culinary', 'wine', 'tasting'];

  const itinerary = trip.itinerary || [];
  
  itinerary.forEach(day => {
    if (day.activities) {
      day.activities.forEach(activity => {
        const activityText = activity.activity?.toLowerCase() || activity.toLowerCase();
        if (foodActivities.some(keyword => activityText.includes(keyword))) {
          score += 7;
        }
      });
    }
  });

  const interests = trip.interests || [];
  if (interests.includes('food') || interests.includes('culinary')) score += 20;

  return Math.min(score, 100);
};

/**
 * Calculate Sustainability Score
 */
export const calculateSustainabilityScore = (trip) => {
  let score = 50; // Neutral base

  // Transportation analysis
  const transport = trip.transportation?.toLowerCase() || '';
  if (transport.includes('train') || transport.includes('bus')) score += 15;
  if (transport.includes('flight')) score -= 10;
  if (transport.includes('bike') || transport.includes('walking')) score += 20;

  // Accommodation analysis
  const accommodation = trip.accommodationType?.toLowerCase() || '';
  if (accommodation.includes('eco') || accommodation.includes('homestay')) score += 15;
  if (accommodation.includes('resort') || accommodation.includes('luxury')) score -= 5;

  // Travel style
  const travelStyle = trip.travelStyle?.toLowerCase() || '';
  if (travelStyle === 'backpacker' || travelStyle === 'budget') score += 10;

  // Activities
  const itinerary = trip.itinerary || [];
  const sustainableActivities = ['hiking', 'walking tour', 'cycling', 'local market', 
    'eco', 'nature', 'wildlife sanctuary'];
  
  itinerary.forEach(day => {
    if (day.activities) {
      day.activities.forEach(activity => {
        const activityText = activity.activity?.toLowerCase() || activity.toLowerCase();
        if (sustainableActivities.some(keyword => activityText.includes(keyword))) {
          score += 5;
        }
      });
    }
  });

  return Math.min(Math.max(score, 0), 100);
};

/**
 * Get all trip scores in one object
 */
export const calculateAllScores = (trip) => {
  return {
    relaxation: calculateRelaxationScore(trip),
    adventure: calculateAdventureLevel(trip),
    budgetFit: calculateBudgetFit(trip),
    culture: calculateCultureScore(trip),
    food: calculateFoodScore(trip),
    sustainability: calculateSustainabilityScore(trip),
  };
};

/**
 * Get trip compatibility rating (Overall)
 */
export const getTripCompatibility = (scores) => {
  // Weight different scores
  const avgScore = (
    scores.relaxation * 0.2 +
    scores.adventure.score * 0.2 +
    scores.budgetFit.percentage * 0.3 +
    scores.culture * 0.15 +
    scores.food * 0.15
  );

  if (avgScore >= 85) return { rating: 'Excellent Match', emoji: '🌟', color: 'green' };
  if (avgScore >= 70) return { rating: 'Great Match', emoji: '✨', color: 'blue' };
  if (avgScore >= 55) return { rating: 'Good Match', emoji: '👍', color: 'yellow' };
  return { rating: 'Fair Match', emoji: '🤔', color: 'gray' };
};
