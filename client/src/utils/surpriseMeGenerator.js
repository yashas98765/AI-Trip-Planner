/**
 * Surprise Me Trip Generator
 * Generates random trip suggestions for spontaneous travel planning
 */

// Destination database with detailed characteristics
const destinationDatabase = [
  // Beach Destinations
  { name: 'Goa', category: 'beach', vibe: 'party', season: 'winter', budgetRange: ['economy', 'comfort', 'premium'], emoji: '🏖️', description: 'Beaches, nightlife, Portuguese heritage' },
  { name: 'Pondicherry', category: 'beach', vibe: 'relaxed', season: 'winter', budgetRange: ['budget', 'economy', 'comfort'], emoji: '🌊', description: 'French colonial charm, serene beaches' },
  { name: 'Andaman Islands', category: 'beach', vibe: 'adventure', season: 'winter', budgetRange: ['comfort', 'premium', 'luxury'], emoji: '🏝️', description: 'Crystal clear waters, diving, island hopping' },
  { name: 'Kerala Backwaters', category: 'nature', vibe: 'relaxed', season: 'winter', budgetRange: ['economy', 'comfort', 'premium'], emoji: '🚤', description: 'Houseboat cruises, lush greenery' },
  { name: 'Gokarna', category: 'beach', vibe: 'spiritual', season: 'winter', budgetRange: ['budget', 'economy'], emoji: '⛱️', description: 'Pristine beaches, temple town, backpacker haven' },
  
  // Mountain Destinations
  { name: 'Leh-Ladakh', category: 'mountains', vibe: 'adventure', season: 'summer', budgetRange: ['comfort', 'premium', 'luxury'], emoji: '🏔️', description: 'High altitude desert, monasteries, adventure' },
  { name: 'Manali', category: 'mountains', vibe: 'adventure', season: 'summer', budgetRange: ['economy', 'comfort', 'premium'], emoji: '⛷️', description: 'Snow-capped peaks, skiing, adventure sports' },
  { name: 'Shimla', category: 'mountains', vibe: 'relaxed', season: 'summer', budgetRange: ['economy', 'comfort'], emoji: '🚞', description: 'Colonial architecture, toy train, scenic views' },
  { name: 'Darjeeling', category: 'mountains', vibe: 'relaxed', season: 'spring', budgetRange: ['economy', 'comfort'], emoji: '🚂', description: 'Tea gardens, toy train, Himalayan views' },
  { name: 'Spiti Valley', category: 'mountains', vibe: 'adventure', season: 'summer', budgetRange: ['comfort', 'premium'], emoji: '🏔️', description: 'Remote Himalayan desert, ancient monasteries' },
  { name: 'Rishikesh', category: 'spiritual', vibe: 'adventure', season: 'spring', budgetRange: ['budget', 'economy', 'comfort'], emoji: '🧘', description: 'Yoga capital, rafting, spiritual retreat' },
  
  // Heritage & Cultural
  { name: 'Jaipur', category: 'heritage', vibe: 'cultural', season: 'winter', budgetRange: ['economy', 'comfort', 'premium'], emoji: '🏰', description: 'Pink city, forts, palaces, royal heritage' },
  { name: 'Udaipur', category: 'heritage', vibe: 'romantic', season: 'winter', budgetRange: ['comfort', 'premium', 'luxury'], emoji: '🏛️', description: 'City of lakes, palace hotels, romantic setting' },
  { name: 'Varanasi', category: 'spiritual', vibe: 'cultural', season: 'winter', budgetRange: ['budget', 'economy', 'comfort'], emoji: '🛕', description: 'Ancient city, Ganga ghats, spiritual experiences' },
  { name: 'Agra', category: 'heritage', vibe: 'cultural', season: 'winter', budgetRange: ['economy', 'comfort', 'premium'], emoji: '🕌', description: 'Taj Mahal, Mughal architecture, historical monuments' },
  { name: 'Hampi', category: 'heritage', vibe: 'cultural', season: 'winter', budgetRange: ['budget', 'economy'], emoji: '🏛️', description: 'Ancient ruins, boulder landscapes, UNESCO site' },
  { name: 'Khajuraho', category: 'heritage', vibe: 'cultural', season: 'winter', budgetRange: ['economy', 'comfort'], emoji: '🏛️', description: 'Temple sculptures, ancient art, UNESCO site' },
  
  // City & Urban
  { name: 'Mumbai', category: 'city', vibe: 'urban', season: 'winter', budgetRange: ['comfort', 'premium', 'luxury'], emoji: '🏙️', description: 'Bollywood, street food, colonial architecture' },
  { name: 'Delhi', category: 'city', vibe: 'cultural', season: 'winter', budgetRange: ['economy', 'comfort', 'premium'], emoji: '🏛️', description: 'Capital city, monuments, diverse culture' },
  { name: 'Bangalore', category: 'city', vibe: 'urban', season: 'all', budgetRange: ['comfort', 'premium', 'luxury'], emoji: '🌳', description: 'Garden city, pubs, tech hub, pleasant weather' },
  { name: 'Kolkata', category: 'city', vibe: 'cultural', season: 'winter', budgetRange: ['budget', 'economy', 'comfort'], emoji: '🎭', description: 'Cultural capital, colonial architecture, festivals' },
  
  // Nature & Wildlife
  { name: 'Coorg', category: 'nature', vibe: 'relaxed', season: 'winter', budgetRange: ['economy', 'comfort', 'premium'], emoji: '☕', description: 'Coffee plantations, misty hills, waterfalls' },
  { name: 'Munnar', category: 'nature', vibe: 'relaxed', season: 'all', budgetRange: ['economy', 'comfort', 'premium'], emoji: '🍵', description: 'Tea estates, rolling hills, cool climate' },
  { name: 'Jim Corbett', category: 'wildlife', vibe: 'adventure', season: 'winter', budgetRange: ['comfort', 'premium', 'luxury'], emoji: '🐅', description: 'Tiger reserve, jungle safaris, wildlife' },
  { name: 'Ranthambore', category: 'wildlife', vibe: 'adventure', season: 'winter', budgetRange: ['comfort', 'premium', 'luxury'], emoji: '🐆', description: 'Tiger safaris, ancient fort, wildlife photography' },
  { name: 'Wayanad', category: 'nature', vibe: 'relaxed', season: 'all', budgetRange: ['economy', 'comfort'], emoji: '🌲', description: 'Spice plantations, waterfalls, trekking' },
  
  // Offbeat
  { name: 'Meghalaya', category: 'nature', vibe: 'adventure', season: 'all', budgetRange: ['economy', 'comfort'], emoji: '🌧️', description: 'Living root bridges, wettest place, waterfalls' },
  { name: 'Sikkim', category: 'mountains', vibe: 'adventure', season: 'spring', budgetRange: ['economy', 'comfort', 'premium'], emoji: '🏔️', description: 'Mountain kingdom, monasteries, Kanchenjunga' },
  { name: 'Zanskar Valley', category: 'mountains', vibe: 'adventure', season: 'summer', budgetRange: ['premium', 'luxury'], emoji: '❄️', description: 'Remote valley, frozen river trek, adventure' },
  { name: 'Tawang', category: 'spiritual', vibe: 'adventure', season: 'spring', budgetRange: ['economy', 'comfort'], emoji: '🏔️', description: 'Monasteries, mountain passes, Tibetan culture' },
];

// Interest categories with associated activities
const interestCategories = [
  { id: 'adventure', label: 'Adventure', weight: 1.2 },
  { id: 'culture', label: 'Culture', weight: 1.0 },
  { id: 'nature', label: 'Nature', weight: 1.0 },
  { id: 'food', label: 'Food', weight: 0.8 },
  { id: 'photography', label: 'Photography', weight: 0.9 },
  { id: 'shopping', label: 'Shopping', weight: 0.7 },
  { id: 'nightlife', label: 'Nightlife', weight: 0.8 },
  { id: 'wellness', label: 'Wellness', weight: 0.9 },
  { id: 'wildlife', label: 'Wildlife', weight: 1.1 },
  { id: 'beach', label: 'Beach', weight: 1.0 },
];

// Travel styles
const travelStyles = [
  { id: 'relaxed', label: 'Relaxed Explorer', description: 'Take it easy, enjoy the moment' },
  { id: 'balanced', label: 'Balanced Traveler', description: 'Mix of activities and relaxation' },
  { id: 'packed', label: 'Adventure Seeker', description: 'Pack in as much as possible' },
  { id: 'luxury', label: 'Luxury Traveler', description: 'Comfort and premium experiences' },
];

/**
 * Get a random item from an array
 */
const getRandomItem = (array) => {
  return array[Math.floor(Math.random() * array.length)];
};

/**
 * Get random items from an array (without duplicates)
 */
const getRandomItems = (array, count) => {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(count, array.length));
};

/**
 * Generate random date in future (within next 6 months)
 */
const generateRandomDate = (minDays = 7, maxDays = 180) => {
  const today = new Date();
  const randomDays = Math.floor(Math.random() * (maxDays - minDays)) + minDays;
  const futureDate = new Date(today);
  futureDate.setDate(today.getDate() + randomDays);
  return futureDate.toISOString().split('T')[0];
};

/**
 * Calculate trip duration based on season and budget
 */
const calculateTripDuration = (budget) => {
  const durationMap = {
    'budget': [2, 4],       // 2-4 days
    'economy': [3, 5],      // 3-5 days
    'comfort': [4, 7],      // 4-7 days
    'premium': [5, 9],      // 5-9 days
    'luxury': [7, 12],      // 7-12 days
  };
  
  const [min, max] = durationMap[budget] || [3, 5];
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

/**
 * Generate a surprise trip suggestion
 */
export const generateSurpriseMeTrip = (preferences = {}) => {
  // Select random destination (can be influenced by preferences)
  let selectedDestination;
  
  if (preferences.category) {
    // Filter by preferred category
    const filteredDestinations = destinationDatabase.filter(
      dest => dest.category === preferences.category
    );
    selectedDestination = getRandomItem(filteredDestinations.length > 0 ? filteredDestinations : destinationDatabase);
  } else {
    selectedDestination = getRandomItem(destinationDatabase);
  }
  
  // Select budget from destination's suitable range or random
  const budget = preferences.budget || getRandomItem(selectedDestination.budgetRange);
  
  // Calculate trip duration
  const duration = calculateTripDuration(budget);
  
  // Generate dates
  const startDate = generateRandomDate(7, 120);
  const endDateObj = new Date(startDate);
  endDateObj.setDate(endDateObj.getDate() + duration);
  const endDate = endDateObj.toISOString().split('T')[0];
  
  // Generate random number of travelers (weighted towards 1-4)
  const travelers = Math.random() < 0.7 
    ? Math.floor(Math.random() * 4) + 1  // 1-4 (70% probability)
    : Math.floor(Math.random() * 6) + 5; // 5-10 (30% probability)
  
  // Select random interests (2-4 interests)
  const numInterests = Math.floor(Math.random() * 3) + 2; // 2-4 interests
  const interests = getRandomItems(interestCategories, numInterests).map(i => i.id);
  
  // Select travel style (influenced by destination vibe)
  let travelStyle;
  if (selectedDestination.vibe === 'adventure') {
    travelStyle = Math.random() < 0.7 ? 'packed' : 'balanced';
  } else if (selectedDestination.vibe === 'relaxed') {
    travelStyle = Math.random() < 0.7 ? 'relaxed' : 'balanced';
  } else if (['premium', 'luxury'].includes(budget)) {
    travelStyle = 'luxury';
  } else {
    travelStyle = getRandomItem(travelStyles).id;
  }
  
  // Generate accommodation preference
  const accommodationMap = {
    'budget': 'hostel',
    'economy': 'hotel',
    'comfort': 'hotel',
    'premium': 'resort',
    'luxury': 'resort',
  };
  const accommodation = accommodationMap[budget] || 'hotel';
  
  // Generate transport preference
  const transportOptions = ['flight', 'train', 'car'];
  const transport = getRandomItem(transportOptions);
  
  // Create the surprise trip object
  const surpriseTrip = {
    destination: selectedDestination.name,
    startDate,
    endDate,
    travelers,
    budget,
    interests,
    travelStyle,
    accommodation,
    transport,
    // Additional metadata
    _metadata: {
      category: selectedDestination.category,
      vibe: selectedDestination.vibe,
      emoji: selectedDestination.emoji,
      description: selectedDestination.description,
      season: selectedDestination.season,
      duration,
    }
  };
  
  return surpriseTrip;
};

/**
 * Generate multiple surprise trip options
 */
export const generateMultipleSurprises = (count = 3, preferences = {}) => {
  const trips = [];
  const usedDestinations = new Set();
  
  for (let i = 0; i < count; i++) {
    let trip;
    let attempts = 0;
    
    // Try to generate unique destinations
    do {
      trip = generateSurpriseMeTrip(preferences);
      attempts++;
    } while (usedDestinations.has(trip.destination) && attempts < 10);
    
    usedDestinations.add(trip.destination);
    trips.push(trip);
  }
  
  return trips;
};

/**
 * Get a catchy tagline for the surprise trip
 */
export const getSurpriseTagline = (trip) => {
  const taglines = [
    `✨ Your adventure awaits in ${trip.destination}!`,
    `🎲 Feeling lucky? Try ${trip.destination}!`,
    `🌟 Discover the magic of ${trip.destination}!`,
    `🎯 Perfect match: ${trip.destination} for ${trip.travelers} ${trip.travelers === 1 ? 'person' : 'people'}!`,
    `🚀 Let's explore ${trip.destination} together!`,
    `🎊 ${trip.destination} is calling your name!`,
    `🌈 Make memories in ${trip.destination}!`,
    `⚡ Spontaneous trip to ${trip.destination}? Why not!`,
  ];
  
  return getRandomItem(taglines);
};

/**
 * Get budget-friendly tips for the destination
 */
export const getBudgetTips = (budget) => {
  const tips = {
    budget: 'Travel off-season, use public transport, try street food, stay in hostels',
    economy: 'Book in advance, use local restaurants, mix hostel and budget hotels',
    comfort: 'Balance activities and relaxation, book hotels with breakfast included',
    premium: 'Choose 3-4 star hotels, include some luxury experiences, guided tours',
    luxury: 'Premium hotels, fine dining, private tours, exclusive experiences',
  };
  
  return tips[budget] || tips.economy;
};

const surpriseMeUtils = {
  generateSurpriseMeTrip,
  generateMultipleSurprises,
  getSurpriseTagline,
  getBudgetTips,
};

export default surpriseMeUtils;
