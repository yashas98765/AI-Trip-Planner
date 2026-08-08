/**
 * Auto Packing List Generator
 * Generates personalized packing list based on trip details
 */

/**
 * Generate comprehensive packing list
 */
export const generatePackingList = (trip) => {
  const duration = trip.duration || calculateDuration(trip.startDate, trip.endDate);
  const destination = (trip.destination?.city || trip.destination || '').toLowerCase();
  const travelers = trip.travelers || 1;
  const travelStyle = (trip.travelStyle || '').toLowerCase();
  const interests = trip.interests || [];
  const weatherPreference = (trip.weatherPreference || '').toLowerCase();

  // Determine weather/climate
  const climate = determineClimate(destination, weatherPreference);
  
  // Determine traveler type
  const travelerType = determineTravelerType(trip);

  const packingList = {
    clothes: generateClothingList(duration, climate, travelStyle, interests),
    essentials: generateEssentials(duration, travelStyle),
    medicines: generateMedicinesList(duration, climate, travelers),
    documents: generateDocumentsList(trip),
    electronics: generateElectronicsList(duration, interests),
    toiletries: generateToiletriesList(duration, travelers),
    adventure: generateAdventureGear(interests),
    misc: generateMiscItems(travelStyle, duration),
  };

  return {
    packingList,
    climate,
    travelerType,
    duration,
    totalItems: Object.values(packingList).reduce((sum, cat) => sum + cat.length, 0),
  };
};

const calculateDuration = (startDate, endDate) => {
  if (!startDate || !endDate) return 5; // default
  const start = new Date(startDate);
  const end = new Date(endDate);
  return Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
};

const determineClimate = (destination, weatherPref) => {
  // Mountain destinations
  if (/manali|shimla|leh|ladakh|darjeeling|mussoorie|nainital|ooty|munnar|coorg/i.test(destination)) {
    return 'cold';
  }
  // Beach destinations
  if (/goa|kerala|andaman|pondicherry|puri|vizag/i.test(destination)) {
    return 'hot';
  }
  // Desert destinations
  if (/jaipur|jaisalmer|jodhpur|bikaner|udaipur/i.test(destination)) {
    return 'hot-dry';
  }
  
  // Based on weather preference
  if (weatherPref === 'cool' || weatherPref === 'snow') return 'cold';
  if (weatherPref === 'warm') return 'hot';
  
  return 'moderate';
};

const determineTravelerType = (trip) => {
  const style = (trip.travelStyle || '').toLowerCase();
  const interests = trip.interests || [];
  
  if (style === 'backpacker' || interests.includes('adventure')) return 'backpacker';
  if (style === 'luxury' || style === 'premium') return 'luxury';
  if (trip.travelers >= 4) return 'family';
  return 'regular';
};

const generateClothingList = (duration, climate, style, interests) => {
  const clothes = [];
  
  // Base clothing (always needed)
  clothes.push(
    { item: 'Underwear', quantity: duration + 2, category: 'essential' },
    { item: 'Socks', quantity: Math.ceil(duration * 1.5), category: 'essential' }
  );

  // Climate-based
  if (climate === 'cold') {
    clothes.push(
      { item: 'Thermal wear (top & bottom)', quantity: 2, category: 'cold' },
      { item: 'Sweaters / Hoodies', quantity: 2, category: 'cold' },
      { item: 'Jacket / Windcheater', quantity: 1, category: 'cold' },
      { item: 'Woolen cap / Beanie', quantity: 1, category: 'cold' },
      { item: 'Gloves', quantity: 1, category: 'cold' },
      { item: 'Muffler / Scarf', quantity: 1, category: 'cold' },
      { item: 'Warm pants / Jeans', quantity: Math.min(duration, 3), category: 'cold' },
      { item: 'Full sleeve shirts', quantity: Math.min(duration - 1, 4), category: 'cold' }
    );
  } else if (climate === 'hot' || climate === 'hot-dry') {
    clothes.push(
      { item: 'T-shirts / Tops', quantity: Math.min(duration + 1, 7), category: 'hot' },
      { item: 'Shorts / Skirts', quantity: Math.min(Math.ceil(duration / 2), 4), category: 'hot' },
      { item: 'Light pants / Jeans', quantity: Math.min(duration - 2, 3), category: 'hot' },
      { item: 'Comfortable sandals / Slippers', quantity: 1, category: 'hot' },
      { item: 'Cap / Hat (sun protection)', quantity: 1, category: 'hot' },
      { item: 'Sunglasses', quantity: 1, category: 'hot' }
    );
    
    if (climate === 'hot') {
      clothes.push(
        { item: 'Swimwear / Beachwear', quantity: 2, category: 'beach' },
        { item: 'Beach towel', quantity: 1, category: 'beach' }
      );
    }
  } else {
    clothes.push(
      { item: 'T-shirts', quantity: Math.min(duration, 5), category: 'regular' },
      { item: 'Shirts / Tops', quantity: Math.min(Math.ceil(duration / 2), 3), category: 'regular' },
      { item: 'Pants / Jeans', quantity: Math.min(duration - 1, 3), category: 'regular' },
      { item: 'Light jacket', quantity: 1, category: 'regular' }
    );
  }

  // Style-based
  if (style === 'luxury' || style === 'premium') {
    clothes.push(
      { item: 'Formal outfit (dinner/events)', quantity: 1, category: 'luxury' },
      { item: 'Dress shoes', quantity: 1, category: 'luxury' }
    );
  }

  // Activity-based
  if (interests.includes('hiking') || interests.includes('adventure')) {
    clothes.push(
      { item: 'Hiking pants / Trekking pants', quantity: 2, category: 'adventure' },
      { item: 'Quick-dry shirts', quantity: 3, category: 'adventure' }
    );
  }

  // Always needed
  clothes.push(
    { item: 'Comfortable walking shoes', quantity: 1, category: 'essential' },
    { item: 'Sleepwear / Nightwear', quantity: 2, category: 'essential' }
  );

  return clothes;
};

const generateEssentials = (duration, style) => {
  return [
    { item: 'Backpack / Day bag', priority: 'high' },
    { item: 'Water bottle', priority: 'high' },
    { item: 'Sunscreen (SPF 50+)', priority: 'high' },
    { item: 'Moisturizer / Face cream', priority: 'medium' },
    { item: 'Lip balm', priority: 'medium' },
    { item: 'Hand sanitizer', priority: 'high' },
    { item: 'Wet wipes / Tissues', priority: 'high' },
    { item: 'Reusable shopping bag', priority: 'medium' },
    { item: 'Locks (for luggage)', priority: 'high' },
    { item: 'Travel pillow & eye mask', priority: style === 'luxury' ? 'high' : 'low' },
    { item: 'Earplugs', priority: 'low' },
    { item: 'Laundry bag', priority: duration > 5 ? 'high' : 'low' },
  ];
};

const generateMedicinesList = (duration, climate, travelers) => {
  const medicines = [
    { item: 'Personal prescription medicines', priority: 'critical', note: 'With prescription' },
    { item: 'Paracetamol / Fever tablets', priority: 'high' },
    { item: 'Antacid / Digestion tablets', priority: 'high' },
    { item: 'Motion sickness tablets', priority: 'medium' },
    { item: 'Band-aids & antiseptic cream', priority: 'high' },
    { item: 'Cold & cough medicine', priority: 'medium' },
    { item: 'Pain relief spray / ointment', priority: 'medium' },
    { item: 'Insect repellent / Mosquito cream', priority: 'medium' },
  ];

  if (climate === 'cold') {
    medicines.push({ item: 'Vaporub / Inhaler', priority: 'medium' });
  }

  if (duration > 7 || travelers > 2) {
    medicines.push(
      { item: 'Diarrhea medicine', priority: 'high' },
      { item: 'Allergy tablets', priority: 'medium' }
    );
  }

  return medicines;
};

const generateDocumentsList = (trip) => {
  const docs = [
    { item: 'Valid ID (Aadhar / Passport)', priority: 'critical', checked: false },
    { item: 'Booking confirmations (hotels, flights)', priority: 'critical', checked: false },
    { item: 'Travel insurance papers', priority: 'high', checked: false },
    { item: 'Emergency contact list', priority: 'high', checked: false },
    { item: 'Credit/Debit cards', priority: 'critical', checked: false },
    { item: 'Cash (sufficient amount)', priority: 'high', checked: false },
    { item: 'Photocopies of important documents', priority: 'medium', checked: false },
  ];

  const destination = (trip.destination?.city || trip.destination || '').toLowerCase();
  
  // International travel
  if (/dubai|singapore|thailand|maldives|bali|nepal|bhutan/i.test(destination)) {
    docs.unshift(
      { item: 'Passport (valid 6+ months)', priority: 'critical', checked: false },
      { item: 'Visa documents', priority: 'critical', checked: false },
      { item: 'Foreign currency/forex card', priority: 'high', checked: false }
    );
  }

  // Specific permits
  if (/leh|ladakh|sikkim|spiti/i.test(destination)) {
    docs.push({ item: 'Inner line permit / Protected area permit', priority: 'critical', checked: false });
  }

  return docs;
};

const generateElectronicsList = (duration, interests) => {
  const electronics = [
    { item: 'Mobile phone & charger', priority: 'critical' },
    { item: 'Power bank (10000mAh+)', priority: 'high' },
    { item: 'Universal adapter (if international)', priority: 'high' },
    { item: 'Earphones / Headphones', priority: 'medium' },
  ];

  if (interests.includes('photography') || duration > 5) {
    electronics.push(
      { item: 'Camera & accessories', priority: 'high' },
      { item: 'Extra memory cards', priority: 'medium' },
      { item: 'Tripod (compact)', priority: 'low' }
    );
  }

  if (duration > 7) {
    electronics.push(
      { item: 'Laptop / Tablet (if needed)', priority: 'medium' },
      { item: 'E-reader / Kindle', priority: 'low' }
    );
  }

  return electronics;
};

const generateToiletriesList = (duration, travelers) => {
  return [
    { item: 'Toothbrush & toothpaste', priority: 'critical' },
    { item: 'Soap / Body wash', priority: 'high' },
    { item: 'Shampoo & conditioner', priority: 'high' },
    { item: 'Deodorant / Perfume', priority: 'high' },
    { item: 'Razor / Shaving kit', priority: 'medium' },
    { item: 'Hair brush / comb', priority: 'medium' },
    { item: 'Nail cutter', priority: 'medium' },
    { item: 'Feminine hygiene products', priority: 'high', note: 'If needed' },
    { item: 'Contact lens solution', priority: 'high', note: 'If applicable' },
    { item: 'Towel (quick-dry)', priority: duration > 5 ? 'high' : 'medium' },
  ];
};

const generateAdventureGear = (interests) => {
  const gear = [];

  if (interests.includes('hiking') || interests.includes('trekking') || interests.includes('adventure')) {
    gear.push(
      { item: 'Hiking boots / Trekking shoes', priority: 'critical' },
      { item: 'Trekking poles', priority: 'medium' },
      { item: 'Headlamp / Flashlight', priority: 'high' },
      { item: 'Rain cover for backpack', priority: 'high' },
      { item: 'First aid kit (comprehensive)', priority: 'high' }
    );
  }

  if (interests.includes('camping')) {
    gear.push(
      { item: 'Sleeping bag', priority: 'critical' },
      { item: 'Camping tent', priority: 'critical' },
      { item: 'Portable stove & utensils', priority: 'high' }
    );
  }

  if (interests.includes('water sports') || interests.includes('beach')) {
    gear.push(
      { item: 'Waterproof bag / dry bag', priority: 'high' },
      { item: 'Underwater camera / GoPro', priority: 'medium' }
    );
  }

  return gear;
};

const generateMiscItems = (style, duration) => {
  const items = [
    { item: 'Snacks for journey', priority: 'medium' },
    { item: 'Reusable cutlery', priority: 'low' },
    { item: 'Travel journal & pen', priority: 'low' },
    { item: 'Books / Entertainment', priority: 'low' },
    { item: 'Zip-lock bags (various sizes)', priority: 'medium' },
  ];

  if (style === 'backpacker') {
    items.push(
      { item: 'Duct tape (small roll)', priority: 'low' },
      { item: 'Multi-tool / Swiss knife', priority: 'medium' },
      { item: 'Clothes line & clips', priority: 'medium' }
    );
  }

  if (duration > 10) {
    items.push({ item: 'Travel laundry detergent', priority: 'medium' });
  }

  return items;
};
