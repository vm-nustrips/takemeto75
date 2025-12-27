import { Destination } from './types';

export const destinations: Destination[] = [
  // Low cost of living - good for Base tier
  { 
    id: 'cancun', city: 'Cancún', country: 'Mexico', lat: 21.1619, lon: -86.8515, airportCode: 'CUN', 
    description: 'White sand beaches and turquoise waters', 
    image: 'https://picsum.photos/seed/cancun/800/600', 
    costOfLiving: 'low',
    highlights: ['🏖️ Hotel Zone has 14 miles of beaches', '🌮 $2 street tacos are incredible', '🚌 Easy day trips to Tulum & cenotes', '💵 USD widely accepted']
  },
  { 
    id: 'cartagena', city: 'Cartagena', country: 'Colombia', lat: 10.3910, lon: -75.4794, airportCode: 'CTG', 
    description: 'Colonial walled city on the Caribbean', 
    image: 'https://picsum.photos/seed/cartagena/800/600', 
    costOfLiving: 'low',
    highlights: ['🏰 UNESCO Old Town is walkable', '🍹 Best ceviche in South America', '⛵ Boat trips to Rosario Islands', '💃 Salsa bars everywhere']
  },
  { 
    id: 'phuket', city: 'Phuket', country: 'Thailand', lat: 7.8804, lon: 98.3923, airportCode: 'HKT', 
    description: 'Thai beaches and island hopping', 
    image: 'https://picsum.photos/seed/phuket/800/600', 
    costOfLiving: 'low',
    highlights: ['🛥️ Phi Phi Islands day trip is a must', '💆 $10 Thai massages on the beach', '🍜 Best pad thai costs $2', '🌅 Kata Beach for sunsets']
  },
  { 
    id: 'bali', city: 'Bali', country: 'Indonesia', lat: -8.6500, lon: 115.2167, airportCode: 'DPS', 
    description: 'Temples, rice terraces, and surf', 
    image: 'https://picsum.photos/seed/bali/800/600', 
    costOfLiving: 'low',
    highlights: ['🏄 Beginner surfing in Kuta', '🌾 Tegallalang rice terraces', '🐒 Ubud monkey forest', '💆 World-class spas for $30']
  },
  { 
    id: 'lisbon', city: 'Lisbon', country: 'Portugal', lat: 38.7223, lon: -9.1393, airportCode: 'LIS', 
    description: 'Coastal hills and pastel de nata', 
    image: 'https://picsum.photos/seed/lisbon/800/600', 
    costOfLiving: 'low',
    highlights: ['🚃 Iconic Tram 28 through old town', '🥐 Pastéis de Belém is the OG', '🍷 €5 wine everywhere', '🏖️ 30min to beach towns']
  },
  { 
    id: 'marrakech', city: 'Marrakech', country: 'Morocco', lat: 31.6295, lon: -7.9811, airportCode: 'RAK', 
    description: 'Souks, riads, and vibrant culture', 
    image: 'https://picsum.photos/seed/marrakech/800/600', 
    costOfLiving: 'low',
    highlights: ['🏨 Stay in a riad (traditional house)', '🛍️ Haggle in the souks - start at 30%', '🍵 Mint tea is always free', '🏜️ Desert trips available']
  },
  { 
    id: 'costa-rica', city: 'San José', country: 'Costa Rica', lat: 9.9281, lon: -84.0907, airportCode: 'SJO', 
    description: 'Rainforests, beaches, and wildlife', 
    image: 'https://picsum.photos/seed/costarica/800/600', 
    costOfLiving: 'low',
    highlights: ['🦥 Sloths everywhere in Manuel Antonio', '🌋 Arenal volcano hot springs', '🏄 Both Pacific & Caribbean coasts', '🌿 25% of country is national parks']
  },
  
  // Medium cost of living - good for Premium tier
  { 
    id: 'san-juan', city: 'San Juan', country: 'Puerto Rico', lat: 18.4655, lon: -66.1057, airportCode: 'SJU', 
    description: 'Colonial charm meets Caribbean vibes', 
    image: 'https://picsum.photos/seed/sanjuan/800/600', 
    costOfLiving: 'medium',
    highlights: ['🇺🇸 No passport needed (US territory)', '🏰 Old San Juan is stunning at night', '🍹 Birthplace of the piña colada', '🏖️ Condado Beach walkable from downtown']
  },
  { 
    id: 'barcelona', city: 'Barcelona', country: 'Spain', lat: 41.3874, lon: 2.1686, airportCode: 'BCN', 
    description: 'Gaudí, tapas, and Mediterranean beaches', 
    image: 'https://picsum.photos/seed/barcelona/800/600', 
    costOfLiving: 'medium',
    highlights: ['⛪ Book Sagrada Familia in advance', '🍷 €1 vermut at local bodegas', '🏖️ Barceloneta Beach is central', '🌃 Dinner starts at 9pm']
  },
  { 
    id: 'athens', city: 'Athens', country: 'Greece', lat: 37.9838, lon: 23.7275, airportCode: 'ATH', 
    description: 'Ancient history meets modern energy', 
    image: 'https://picsum.photos/seed/athens/800/600', 
    costOfLiving: 'medium',
    highlights: ['🏛️ Acropolis best at sunrise', '🥙 €3 gyros in Monastiraki', '⛴️ Easy ferries to islands', '🍸 Rooftop bars with Parthenon views']
  },
  { 
    id: 'san-diego', city: 'San Diego', country: 'USA', lat: 32.7157, lon: -117.1611, airportCode: 'SAN', 
    description: 'Perfect weather and laid-back vibes', 
    image: 'https://picsum.photos/seed/sandiego/800/600', 
    costOfLiving: 'medium',
    highlights: ['🌴 70°F basically year-round', '🌮 Best fish tacos in the US', '🦭 La Jolla seals are free to visit', '🍺 100+ craft breweries']
  },
  { 
    id: 'nassau', city: 'Nassau', country: 'Bahamas', lat: 25.0443, lon: -77.3504, airportCode: 'NAS', 
    description: 'Island paradise with crystal clear waters', 
    image: 'https://picsum.photos/seed/nassau/800/600', 
    costOfLiving: 'medium',
    highlights: ['🐷 Swimming pigs day trip', '🏝️ Paradise Island is connected by bridge', '🤿 Best snorkeling in the Caribbean', '🛳️ Can feel touristy on cruise days']
  },
  { 
    id: 'aruba', city: 'Oranjestad', country: 'Aruba', lat: 12.5211, lon: -70.0345, airportCode: 'AUA', 
    description: 'One happy island with perfect weather', 
    image: 'https://picsum.photos/seed/aruba/800/600', 
    costOfLiving: 'medium',
    highlights: ['☀️ Outside hurricane belt - always sunny', '🏖️ Eagle Beach ranked top 10 world', '🚗 Rent a UTV for the wild side', '💵 USD accepted everywhere']
  },
  { 
    id: 'rio', city: 'Rio de Janeiro', country: 'Brazil', lat: -22.9068, lon: -43.1729, airportCode: 'GIG', 
    description: 'Beaches, mountains, and samba', 
    image: 'https://picsum.photos/seed/rio/800/600', 
    costOfLiving: 'medium',
    highlights: ['🗻 Christ the Redeemer sunrise is magic', '🏖️ Ipanema > Copacabana (less crowded)', '🍹 Caipirinhas on the beach', '⚠️ Leave valuables at hotel']
  },
  { 
    id: 'cape-town', city: 'Cape Town', country: 'South Africa', lat: -33.9249, lon: 18.4241, airportCode: 'CPT', 
    description: 'Table Mountain and coastal beauty', 
    image: 'https://picsum.photos/seed/capetown/800/600', 
    costOfLiving: 'medium',
    highlights: ['⛰️ Table Mountain cable car is worth it', '🍷 World-class wine for $5/bottle', '🐧 Boulders Beach penguins', '💰 Great exchange rate for USD']
  },
  
  // High cost of living - good for Luxe tier  
  { 
    id: 'miami', city: 'Miami', country: 'USA', lat: 25.7617, lon: -80.1918, airportCode: 'MIA', 
    description: 'Art deco, beaches, and nightlife', 
    image: 'https://picsum.photos/seed/miami/800/600', 
    costOfLiving: 'high',
    highlights: ['🌴 South Beach Art Deco district', '🍽️ Wynwood for food halls & art', '🚤 Day trip to Key Biscayne', '🎉 Nightlife starts at midnight']
  },
  { 
    id: 'honolulu', city: 'Honolulu', country: 'USA', lat: 21.3069, lon: -157.8583, airportCode: 'HNL', 
    description: 'Tropical paradise in the Pacific', 
    image: 'https://picsum.photos/seed/honolulu/800/600', 
    costOfLiving: 'high',
    highlights: ['🌅 Diamond Head sunrise hike', '🏄 Learn to surf at Waikiki', '🍲 Poke bowls everywhere', '🚗 Rent a car to see North Shore']
  },
  { 
    id: 'nice', city: 'Nice', country: 'France', lat: 43.7102, lon: 7.2620, airportCode: 'NCE', 
    description: 'French Riviera glamour', 
    image: 'https://picsum.photos/seed/nice/800/600', 
    costOfLiving: 'high',
    highlights: ['🏖️ Promenade des Anglais stroll', '🚂 Train to Monaco in 20min', '🥐 Best socca (chickpea pancake)', '🎨 Matisse Museum is free']
  },
  { 
    id: 'dubai', city: 'Dubai', country: 'UAE', lat: 25.2048, lon: 55.2708, airportCode: 'DXB', 
    description: 'Futuristic skyline and desert adventures', 
    image: 'https://picsum.photos/seed/dubai/800/600', 
    costOfLiving: 'high',
    highlights: ['🏙️ Burj Khalifa sunset tickets sell fast', '🏜️ Desert safari worth it', '🛍️ Dubai Mall is overwhelming', '🍽️ Friday brunch is a thing']
  },
  { 
    id: 'sydney', city: 'Sydney', country: 'Australia', lat: -33.8688, lon: 151.2093, airportCode: 'SYD', 
    description: 'Harbour views and beach culture', 
    image: 'https://picsum.photos/seed/sydney/800/600', 
    costOfLiving: 'high',
    highlights: ['🌉 Walk across Harbour Bridge', '🏖️ Bondi to Coogee coastal walk', '☕ Best coffee culture outside Italy', '🦘 Blue Mountains day trip']
  },
  { 
    id: 'key-west', city: 'Key West', country: 'USA', lat: 24.5551, lon: -81.7800, airportCode: 'EYW', 
    description: 'Southernmost point with endless sunsets', 
    image: 'https://picsum.photos/seed/keywest/800/600', 
    costOfLiving: 'high',
    highlights: ['🌅 Mallory Square sunset ritual', '🚴 Rent a bike - island is tiny', '🥧 Key lime pie is mandatory', '🐓 Chickens roam free everywhere']
  },
];

export function getDestinationByAirport(code: string): Destination | undefined {
  return destinations.find(d => d.airportCode === code);
}
