import { Airport, Coordinates } from './types';

// ===========================================
// DESTINATION DATABASE
// ===========================================

export interface DestinationData {
  city: string;
  country: string;
  airport: string;
  lat: number;
  lon: number;
  region: string;
  blurb: string;
  costIndex: number; // 1-5, used for Base tier (1 = cheapest)
}

export const DESTINATIONS: DestinationData[] = [
  // Caribbean & Central America
  { city: 'San Juan', country: 'Puerto Rico', airport: 'SJU', lat: 18.4655, lon: -66.1057, region: 'caribbean', costIndex: 3, blurb: "Old San Juan's colorful streets, world-class beaches, and no passport needed. The piña colada was invented here." },
  { city: 'Cancun', country: 'Mexico', airport: 'CUN', lat: 21.1619, lon: -86.8515, region: 'caribbean', costIndex: 2, blurb: 'Turquoise Caribbean waters, ancient Mayan ruins, and tacos al pastor at 2am. The Hotel Zone delivers.' },
  { city: 'Nassau', country: 'Bahamas', airport: 'NAS', lat: 25.0343, lon: -77.3963, region: 'caribbean', costIndex: 4, blurb: 'Pink sand beaches, swimming pigs, and that famous Bahamas blue. Just a short hop from Florida.' },
  { city: 'Punta Cana', country: 'Dominican Republic', airport: 'PUJ', lat: 18.5601, lon: -68.3725, region: 'caribbean', costIndex: 2, blurb: 'All-inclusive paradise with 30 miles of white sand. Golf, spa, repeat.' },
  { city: 'Aruba', country: 'Aruba', airport: 'AUA', lat: 12.5211, lon: -70.0167, region: 'caribbean', costIndex: 3, blurb: "One Happy Island. Consistent trade winds, zero hurricanes, and flamingos on the beach." },
  { city: 'San Jose', country: 'Costa Rica', airport: 'SJO', lat: 9.9281, lon: -84.0907, region: 'central_america', costIndex: 2, blurb: 'Gateway to cloud forests, volcanoes, and the pura vida lifestyle. Coffee tours mandatory.' },
  { city: 'Panama City', country: 'Panama', airport: 'PTY', lat: 9.0820, lon: -79.3835, region: 'central_america', costIndex: 2, blurb: 'Watch ships transit the Canal, explore Casco Viejo, then escape to San Blas islands.' },
  { city: 'Belize City', country: 'Belize', airport: 'BZE', lat: 17.5392, lon: -88.3089, region: 'central_america', costIndex: 2, blurb: "The Great Blue Hole awaits. Snorkel the second-largest barrier reef, explore Mayan temples." },
  
  // US Domestic
  { city: 'San Diego', country: 'USA', airport: 'SAN', lat: 32.7157, lon: -117.1611, region: 'us_west', costIndex: 3, blurb: 'Perfect weather, craft beer capital, and fish tacos that ruin you for anywhere else.' },
  { city: 'Los Angeles', country: 'USA', airport: 'LAX', lat: 34.0522, lon: -118.2437, region: 'us_west', costIndex: 4, blurb: 'Beach cities, hiking trails, and the best food scene in America. Skip Hollywood.' },
  { city: 'Phoenix', country: 'USA', airport: 'PHX', lat: 33.4484, lon: -112.0740, region: 'us_southwest', costIndex: 2, blurb: 'Desert sunsets, world-class spas, and that dry heat everyone talks about.' },
  { city: 'Scottsdale', country: 'USA', airport: 'PHX', lat: 33.4942, lon: -111.9261, region: 'us_southwest', costIndex: 4, blurb: 'Luxury desert vibes. Golf, spa treatments, and restaurant patios with mountain views.' },
  { city: 'Miami', country: 'USA', airport: 'MIA', lat: 25.7617, lon: -80.1918, region: 'us_southeast', costIndex: 4, blurb: 'Art Deco, Cuban coffee, and beach clubs. The energy is unmatched.' },
  { city: 'Key West', country: 'USA', airport: 'EYW', lat: 24.5551, lon: -81.7800, region: 'us_southeast', costIndex: 4, blurb: 'End of the road. Hemingway bars, sunset at Mallory Square, and six-toed cats.' },
  { city: 'Tampa', country: 'USA', airport: 'TPA', lat: 27.9506, lon: -82.4572, region: 'us_southeast', costIndex: 2, blurb: 'Underrated gem. Ybor City cigars, craft breweries, and Clearwater Beach nearby.' },
  { city: 'Savannah', country: 'USA', airport: 'SAV', lat: 32.0809, lon: -81.0912, region: 'us_southeast', costIndex: 2, blurb: "Spanish moss, historic squares, and the best fried chicken you've ever had." },
  { city: 'Charleston', country: 'USA', airport: 'CHS', lat: 32.7765, lon: -79.9311, region: 'us_southeast', costIndex: 3, blurb: 'Southern charm perfected. Cobblestone streets, she-crab soup, and rooftop bars.' },
  { city: 'Austin', country: 'USA', airport: 'AUS', lat: 30.2672, lon: -97.7431, region: 'us_south', costIndex: 3, blurb: 'Live music, breakfast tacos, and Barton Springs. Keep it weird.' },
  { city: 'San Antonio', country: 'USA', airport: 'SAT', lat: 29.4241, lon: -98.4936, region: 'us_south', costIndex: 2, blurb: 'The Riverwalk, historic missions, and Tex-Mex that slaps.' },
  { city: 'Honolulu', country: 'USA', airport: 'HNL', lat: 21.3069, lon: -157.8583, region: 'hawaii', costIndex: 4, blurb: 'Waikiki sunsets, Diamond Head hikes, and poke bowls for days.' },
  { city: 'Maui', country: 'USA', airport: 'OGG', lat: 20.7984, lon: -156.3319, region: 'hawaii', costIndex: 5, blurb: 'Road to Hana, Haleakala sunrise, and beaches that look photoshopped.' },
  
  // South America
  { city: 'Medellin', country: 'Colombia', airport: 'MDE', lat: 6.2476, lon: -75.5658, region: 'south_america', costIndex: 1, blurb: 'City of eternal spring. Transformed from notorious to must-visit. The metro is art.' },
  { city: 'Cartagena', country: 'Colombia', airport: 'CTG', lat: 10.3910, lon: -75.4794, region: 'south_america', costIndex: 2, blurb: 'Walled city romance. Colonial colors, ceviche, and Caribbean vibes.' },
  { city: 'Lima', country: 'Peru', airport: 'LIM', lat: -12.0464, lon: -77.0428, region: 'south_america', costIndex: 2, blurb: 'The food capital of South America. Ceviche, pisco sours, and Miraflores cliffs.' },
  { city: 'Buenos Aires', country: 'Argentina', airport: 'EZE', lat: -34.6037, lon: -58.3816, region: 'south_america', costIndex: 1, blurb: 'Tango, steak, and Malbec. Paris of South America with better food.' },
  { city: 'Santiago', country: 'Chile', airport: 'SCL', lat: -33.4489, lon: -70.6693, region: 'south_america', costIndex: 2, blurb: 'Wine country doorstep, Andes views, and a food scene on the rise.' },
  
  // Europe (seasonal 75°)
  { city: 'Lisbon', country: 'Portugal', airport: 'LIS', lat: 38.7223, lon: -9.1393, region: 'europe', costIndex: 2, blurb: 'Pastel de nata, tram 28, and rooftop bars with river views. Affordable and unforgettable.' },
  { city: 'Barcelona', country: 'Spain', airport: 'BCN', lat: 41.3851, lon: 2.1734, region: 'europe', costIndex: 3, blurb: "Gaudí's masterpieces, beach, and tapas until midnight. La Rambla is a skip." },
  { city: 'Seville', country: 'Spain', airport: 'SVQ', lat: 37.3891, lon: -5.9845, region: 'europe', costIndex: 2, blurb: 'Flamenco, tapas crawls, and the most beautiful plaza in Spain.' },
  { city: 'Rome', country: 'Italy', airport: 'FCO', lat: 41.9028, lon: 12.4964, region: 'europe', costIndex: 3, blurb: 'Ancient ruins, perfect pasta, and gelato research. Every corner is a postcard.' },
  { city: 'Athens', country: 'Greece', airport: 'ATH', lat: 37.9838, lon: 23.7275, region: 'europe', costIndex: 2, blurb: 'Acropolis views, mezze spreads, and island-hopping potential.' },
  { city: 'Dubrovnik', country: 'Croatia', airport: 'DBV', lat: 42.6507, lon: 18.0944, region: 'europe', costIndex: 3, blurb: "King's Landing IRL. Walk the walls, swim in the Adriatic, day trip to Montenegro." },
  
  // Asia & Pacific
  { city: 'Tokyo', country: 'Japan', airport: 'NRT', lat: 35.6762, lon: 139.6503, region: 'asia', costIndex: 4, blurb: 'The future and tradition collide. Ramen at 3am, temples at dawn.' },
  { city: 'Seoul', country: 'South Korea', airport: 'ICN', lat: 37.5665, lon: 126.9780, region: 'asia', costIndex: 3, blurb: 'K-beauty, Korean BBQ, and palaces. The nightlife is legendary.' },
  { city: 'Taipei', country: 'Taiwan', airport: 'TPE', lat: 25.0330, lon: 121.5654, region: 'asia', costIndex: 2, blurb: 'Night markets, bubble tea origin story, and the best dumplings outside Shanghai.' },
  { city: 'Singapore', country: 'Singapore', airport: 'SIN', lat: 1.3521, lon: 103.8198, region: 'asia', costIndex: 4, blurb: "Clean, efficient, and the hawker centers are UNESCO-worthy." },
  { city: 'Bali', country: 'Indonesia', airport: 'DPS', lat: -8.3405, lon: 115.0920, region: 'asia', costIndex: 1, blurb: 'Rice terraces, surf breaks, and $5 massages. Digital nomad central.' },
  { city: 'Bangkok', country: 'Thailand', airport: 'BKK', lat: 13.7563, lon: 100.5018, region: 'asia', costIndex: 1, blurb: 'Street food heaven, rooftop bars, and temples that deliver.' },
  { city: 'Sydney', country: 'Australia', airport: 'SYD', lat: -33.8688, lon: 151.2093, region: 'oceania', costIndex: 4, blurb: 'Opera House, Bondi Beach, and flat whites that changed coffee forever.' },
  
  // Middle East & Africa
  { city: 'Dubai', country: 'UAE', airport: 'DXB', lat: 25.2048, lon: 55.2708, region: 'middle_east', costIndex: 4, blurb: 'Excess perfected. Desert safaris, indoor skiing, and brunch culture.' },
  { city: 'Tel Aviv', country: 'Israel', airport: 'TLV', lat: 32.0853, lon: 34.7818, region: 'middle_east', costIndex: 3, blurb: 'Mediterranean beaches, incredible food scene, and Bauhaus architecture.' },
  { city: 'Marrakech', country: 'Morocco', airport: 'RAK', lat: 31.6295, lon: -7.9811, region: 'africa', costIndex: 2, blurb: 'Souks, riads, and tagine. The sensory overload you need.' },
  { city: 'Cape Town', country: 'South Africa', airport: 'CPT', lat: -33.9249, lon: 18.4241, region: 'africa', costIndex: 2, blurb: 'Table Mountain, wine country, and penguins. Actually penguins.' },
];

// ===========================================
// US AIRPORTS
// ===========================================

export const US_AIRPORTS: Airport[] = [
  { code: 'JFK', name: 'New York JFK', city: 'New York', lat: 40.6413, lon: -73.7781 },
  { code: 'LAX', name: 'Los Angeles', city: 'Los Angeles', lat: 33.9416, lon: -118.4085 },
  { code: 'ORD', name: "Chicago O'Hare", city: 'Chicago', lat: 41.9742, lon: -87.9073 },
  { code: 'DFW', name: 'Dallas/Fort Worth', city: 'Dallas', lat: 32.8998, lon: -97.0403 },
  { code: 'DEN', name: 'Denver', city: 'Denver', lat: 39.8561, lon: -104.6737 },
  { code: 'SFO', name: 'San Francisco', city: 'San Francisco', lat: 37.6213, lon: -122.3790 },
  { code: 'SEA', name: 'Seattle-Tacoma', city: 'Seattle', lat: 47.4502, lon: -122.3088 },
  { code: 'ATL', name: 'Atlanta', city: 'Atlanta', lat: 33.6407, lon: -84.4277 },
  { code: 'BOS', name: 'Boston Logan', city: 'Boston', lat: 42.3656, lon: -71.0096 },
  { code: 'MIA', name: 'Miami', city: 'Miami', lat: 25.7959, lon: -80.2870 },
  { code: 'PHX', name: 'Phoenix', city: 'Phoenix', lat: 33.4373, lon: -112.0078 },
  { code: 'IAH', name: 'Houston', city: 'Houston', lat: 29.9902, lon: -95.3368 },
  { code: 'MSP', name: 'Minneapolis', city: 'Minneapolis', lat: 44.8848, lon: -93.2223 },
  { code: 'DTW', name: 'Detroit', city: 'Detroit', lat: 42.2162, lon: -83.3554 },
  { code: 'PHL', name: 'Philadelphia', city: 'Philadelphia', lat: 39.8729, lon: -75.2437 },
  { code: 'LGA', name: 'New York LaGuardia', city: 'New York', lat: 40.7769, lon: -73.8740 },
  { code: 'EWR', name: 'Newark', city: 'Newark', lat: 40.6895, lon: -74.1745 },
  { code: 'SAN', name: 'San Diego', city: 'San Diego', lat: 32.7338, lon: -117.1933 },
  { code: 'AUS', name: 'Austin', city: 'Austin', lat: 30.1975, lon: -97.6664 },
  { code: 'PDX', name: 'Portland', city: 'Portland', lat: 45.5898, lon: -122.5951 },
];

// ===========================================
// UTILITY FUNCTIONS
// ===========================================

/**
 * Calculate distance between two coordinates in miles (Haversine formula)
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 3959; // Earth's radius in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Find the nearest US airport to given coordinates
 */
export function findNearestAirport(lat: number, lon: number): Airport {
  let nearest = US_AIRPORTS[0];
  let minDist = Infinity;

  for (const airport of US_AIRPORTS) {
    const dist = calculateDistance(lat, lon, airport.lat, airport.lon);
    if (dist < minDist) {
      minDist = dist;
      nearest = airport;
    }
  }
  return nearest;
}

/**
 * Get destinations sorted by distance from a given airport
 */
export function getDestinationsByDistance(
  airportCode: string
): DestinationData[] {
  const airport = US_AIRPORTS.find((a) => a.code === airportCode);
  if (!airport) return DESTINATIONS;

  return [...DESTINATIONS]
    .map((dest) => ({
      ...dest,
      distance: calculateDistance(airport.lat, airport.lon, dest.lat, dest.lon),
    }))
    .sort((a, b) => a.distance - b.distance);
}
