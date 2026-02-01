export interface Destination {
  id: string;
  city: string;
  country: string;
  lat: number;
  lon: number;
  airportCode: string;
  description: string;
  image: string;
  costOfLiving: 'low' | 'medium' | 'high';
  highlights: string[];
}

export interface WeatherDay {
  date: string;
  temp: number;
  condition: string;
  icon: string;
}

export interface DestinationWithWeather extends Destination {
  weather: WeatherDay[];
  avgTemp: number;
}

export type Tier = 'base' | 'premium' | 'luxe';

export interface FlightOffer {
  id: string;
  airline: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  stops: number;
  price: number;
  currency: string;
  cabin: string;
}

export interface HotelOffer {
  id: string;
  name: string;
  starRating: number;
  reviewScore: number;
  pricePerNight: number;
  totalPrice: number;
  currency: string;
  roomType: string;
  freeCancellation: boolean;
  breakfastIncluded: boolean;
  photo: string;
  isLuxuryBrand: boolean;
}

export interface TripPackage {
  flight: FlightOffer;
  hotel: HotelOffer;
  totalPrice: number;
  aiReasoning: string;
  departureDate: string;
  returnDate: string;
}

export interface ClaudeSelection {
  flightId: string;
  hotelId: string;
  reasoning: string;
}
