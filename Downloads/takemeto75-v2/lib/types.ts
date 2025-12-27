// ===========================================
// CORE TYPES
// ===========================================

export type Tier = 'base' | 'premium' | 'luxe';

export interface Coordinates {
  lat: number;
  lon: number;
}

export interface Airport {
  code: string;
  name: string;
  city: string;
  lat: number;
  lon: number;
}

export interface Destination {
  city: string;
  country: string;
  airport: string;
  lat: number;
  lon: number;
  region: string;
  weather: WeatherData;
  distance: number; // miles from user
  blurb: string;
}

export interface WeatherData {
  avgTemp: number; // Fahrenheit
  condition: string;
  isSunny: boolean;
  isInRange: boolean; // 69-78°F
  humidity: number;
  forecast: DayForecast[];
}

export interface DayForecast {
  date: string;
  high: number;
  low: number;
  condition: string;
  isSunny: boolean;
}

// ===========================================
// TRAVEL DATES
// ===========================================

export interface TravelDates {
  checkIn: string; // YYYY-MM-DD
  checkOut: string; // YYYY-MM-DD
  display: {
    checkIn: string; // "Fri, Dec 27"
    checkOut: string; // "Mon, Dec 30"
  };
  nights: number;
}

// ===========================================
// FLIGHT TYPES (Duffel)
// ===========================================

export interface FlightSearch {
  origin: string; // Airport code
  destination: string; // Airport code
  departureDate: string;
  returnDate: string;
  passengers: number;
  cabinClass: 'economy' | 'premium_economy' | 'business' | 'first';
}

export interface FlightOffer {
  id: string;
  price: number;
  currency: string;
  airline: string;
  airlineLogo?: string;
  outbound: FlightSegment;
  inbound: FlightSegment;
  cabinClass: string;
  baggageIncluded: boolean;
  refundable: boolean;
}

export interface FlightSegment {
  departure: {
    airport: string;
    time: string; // ISO datetime
  };
  arrival: {
    airport: string;
    time: string;
  };
  duration: string; // "2h 45m"
  stops: number;
  carrier: string;
  flightNumber: string;
}

// ===========================================
// HOTEL TYPES (Booking.com)
// ===========================================

export interface HotelSearch {
  city: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  rooms: number;
  starRating: number[]; // [3], [4], or [5]
  minReviewScore: number; // 80 = 8.0
}

export interface HotelOffer {
  id: string;
  name: string;
  starRating: number;
  reviewScore: number;
  reviewCount: number;
  price: number;
  currency: string;
  address: string;
  distanceFromCenter: string;
  photos: string[];
  amenities: string[];
  roomType: string;
  freeCancellation: boolean;
  breakfastIncluded: boolean;
  url: string; // Deep link
}

// ===========================================
// COMBINED TRIP
// ===========================================

export interface TripPackage {
  id: string;
  tier: Tier;
  destination: Destination;
  dates: TravelDates;
  flight: FlightOffer;
  hotel: HotelOffer;
  totalPrice: number;
  currency: string;
  breakdown: {
    flight: number;
    hotel: number;
    markup: number;
  };
  aiReasoning: string; // Claude's explanation for this selection
}

// ===========================================
// BOOKING FLOW
// ===========================================

export interface BookingRequest {
  tripPackageId: string;
  passenger: PassengerInfo;
  payment?: PaymentInfo;
}

export interface PassengerInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other';
}

export interface PaymentInfo {
  cardNumber: string;
  expiryMonth: string;
  expiryYear: string;
  cvc: string;
  cardholderName: string;
}

export interface BookingResult {
  success: boolean;
  flightBookingRef?: string;
  hotelBookingRef?: string;
  flightConfirmationUrl?: string;
  hotelConfirmationUrl?: string;
  error?: string;
  refundDeadline?: string; // ISO datetime - 1 hour from booking
}

// ===========================================
// API RESPONSES
// ===========================================

export interface DestinationsResponse {
  destinations: Destination[];
  userAirport: Airport;
  dates: TravelDates;
}

export interface SearchResponse {
  packages: {
    base?: TripPackage;
    premium?: TripPackage;
    luxe?: TripPackage;
  };
  destination: Destination;
  dates: TravelDates;
}

export interface ApiError {
  error: string;
  code: string;
  details?: string;
}

// ===========================================
// TIER CONFIGURATION
// ===========================================

export const TIER_CONFIG: Record<Tier, {
  name: string;
  description: string;
  priceRange: string;
  hotelStars: number[];
  cabinClass: 'economy' | 'premium_economy' | 'business' | 'first';
  color: string;
  gradient: string;
  hotelBrands?: string[]; // Preferred brands for Luxe
}> = {
  base: {
    name: 'Base',
    description: '3-star hotel • Economy flight',
    priceRange: '$400-800',
    hotelStars: [3],
    cabinClass: 'economy',
    color: '#6B7280',
    gradient: 'from-gray-500 to-gray-700',
  },
  premium: {
    name: 'Premium',
    description: '4-star hotel • Premium economy',
    priceRange: '$800-1,500',
    hotelStars: [4],
    cabinClass: 'premium_economy',
    color: '#F59E0B',
    gradient: 'from-amber-500 to-orange-600',
  },
  luxe: {
    name: 'Luxe',
    description: '5-star hotel • Business class',
    priceRange: '$1,500+',
    hotelStars: [5],
    cabinClass: 'business',
    color: '#8B5CF6',
    gradient: 'from-violet-500 to-purple-700',
    hotelBrands: ['Four Seasons', 'Ritz-Carlton', 'St. Regis', 'Aman', 'Mandarin Oriental'],
  },
};
