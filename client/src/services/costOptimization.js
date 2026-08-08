/**
 * Advanced Cost Optimization Service
 * Analyzes trip itineraries and provides cost-saving recommendations
 */

class CostOptimizationService {
  constructor() {
    this.optimizationStrategies = [
      'transportation',
      'accommodation',
      'activities',
      'food',
      'timing'
    ];
  }

  /**
   * Analyze trip cost and provide optimization suggestions
   */
  analyzeTripCost(trip) {
    const analysis = {
      totalCost: this.calculateTotalCost(trip),
      breakdown: this.getCostBreakdown(trip),
      potentialSavings: 0,
      recommendations: []
    };

    // Analyze each cost category
    for (const strategy of this.optimizationStrategies) {
      const recommendations = this[`optimize${this.capitalize(strategy)}`](trip);
      analysis.recommendations.push(...recommendations);
      analysis.potentialSavings += recommendations.reduce((sum, r) => sum + r.savings, 0);
    }

    // Sort recommendations by potential savings
    analysis.recommendations.sort((a, b) => b.savings - a.savings);

    return analysis;
  }

  /**
   * Calculate total trip cost
   */
  calculateTotalCost(trip) {
    if (!trip.itinerary || !trip.itinerary.days) return 0;

    return trip.itinerary.days.reduce((total, day) => {
      return total + (day.totalCost?.amount || 0);
    }, 0);
  }

  /**
   * Get cost breakdown by category
   */
  getCostBreakdown(trip) {
    const breakdown = {
      transportation: 0,
      accommodation: 0,
      activities: 0,
      food: 0,
      other: 0
    };

    if (!trip.itinerary || !trip.itinerary.days) return breakdown;

    trip.itinerary.days.forEach(day => {
      day.activities?.forEach(activity => {
        const cost = activity.cost?.amount || 0;
        const category = this.categorizeActivity(activity);
        breakdown[category] += cost;
      });
    });

    return breakdown;
  }

  /**
   * Optimize transportation costs
   */
  optimizeTransportation(trip) {
    const recommendations = [];

    // Example: Suggest public transport over taxis
    recommendations.push({
      category: 'transportation',
      title: 'Use Public Transportation',
      description: 'Save by using buses and trains instead of taxis',
      savings: 50,
      difficulty: 'easy',
      impact: 'medium'
    });

    // Example: Booking in advance
    recommendations.push({
      category: 'transportation',
      title: 'Book Transportation in Advance',
      description: 'Book flights and trains early for better rates',
      savings: 150,
      difficulty: 'easy',
      impact: 'high'
    });

    return recommendations;
  }

  /**
   * Optimize accommodation costs
   */
  optimizeAccommodation(trip) {
    const recommendations = [];

    const currentStyle = trip.preferences?.accommodation || 'hotel';

    if (currentStyle === 'hotel' || currentStyle === 'resort') {
      recommendations.push({
        category: 'accommodation',
        title: 'Consider Alternative Accommodation',
        description: 'Hostels or Airbnb can save significant costs',
        savings: 200,
        difficulty: 'easy',
        impact: 'high'
      });
    }

    recommendations.push({
      category: 'accommodation',
      title: 'Stay Outside City Center',
      description: 'Accommodations outside the center are often cheaper',
      savings: 100,
        difficulty: 'medium',
      impact: 'medium'
    });

    return recommendations;
  }

  /**
   * Optimize activity costs
   */
  optimizeActivities(trip) {
    const recommendations = [];

    recommendations.push({
      category: 'activities',
      title: 'Look for Free Activities',
      description: 'Many cities offer free walking tours, museums, and attractions',
      savings: 80,
      difficulty: 'easy',
      impact: 'medium'
    });

    recommendations.push({
      category: 'activities',
      title: 'Purchase City Passes',
      description: 'City tourist cards can provide bulk discounts',
      savings: 120,
      difficulty: 'easy',
      impact: 'high'
    });

    return recommendations;
  }

  /**
   * Optimize food costs
   */
  optimizeFood(trip) {
    const recommendations = [];

    recommendations.push({
      category: 'food',
      title: 'Eat Like a Local',
      description: 'Visit local markets and street food vendors instead of touristy restaurants',
      savings: 150,
      difficulty: 'easy',
      impact: 'high'
    });

    recommendations.push({
      category: 'food',
      title: 'Cook Some Meals',
      description: 'Choose accommodation with kitchen facilities',
      savings: 100,
      difficulty: 'medium',
      impact: 'medium'
    });

    return recommendations;
  }

  /**
   * Optimize based on timing
   */
  optimizeTiming(trip) {
    const recommendations = [];

    recommendations.push({
      category: 'timing',
      title: 'Travel in Off-Peak Season',
      description: 'Visiting during shoulder season can save significantly',
      savings: 300,
      difficulty: 'medium',
      impact: 'very high'
    });

    recommendations.push({
      category: 'timing',
      title: 'Book Midweek Flights',
      description: 'Tuesday and Wednesday flights are often cheaper',
      savings: 75,
      difficulty: 'easy',
      impact: 'medium'
    });

    return recommendations;
  }

  /**
   * Apply optimizations to trip
   */
  applyOptimizations(trip, selectedRecommendations) {
    const optimizedTrip = JSON.parse(JSON.stringify(trip));
    let totalSavings = 0;

    selectedRecommendations.forEach(recommendation => {
      totalSavings += recommendation.savings;
      // Apply specific changes based on recommendation type
      // This would modify the optimizedTrip object
    });

    optimizedTrip.estimatedSavings = totalSavings;
    optimizedTrip.optimizationApplied = true;

    return optimizedTrip;
  }

  /**
   * Helper methods
   */
  categorizeActivity(activity) {
    const type = activity.type?.toLowerCase() || '';
    if (type.includes('transport') || type.includes('transfer')) return 'transportation';
    if (type.includes('hotel') || type.includes('accommodation')) return 'accommodation';
    if (type.includes('meal') || type.includes('restaurant') || type.includes('food')) return 'food';
    if (type.includes('activity') || type.includes('tour') || type.includes('attraction')) return 'activities';
    return 'other';
  }

  capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}

const costOptimizationService = new CostOptimizationService();
export default costOptimizationService;
