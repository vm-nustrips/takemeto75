'use client';

import { useState, useEffect } from 'react';
import { getCountryFlag } from '@/lib/destination-catalog';

interface WeatherDay {
  date: string;
  temp: number;
  condition: string;
  icon: string;
}

interface Destination {
  id: string;
  city: string;
  country: string;
  description: string;
  image: string;
  airportCode: string;
  costOfLiving: string;
  highlights: string[];
}

interface DestinationWithWeather extends Destination {
  weather: WeatherDay[];
  avgTemp: number;
}

interface FlightOffer {
  id: string;
  airline: string;
  departureTime: string;
  duration: string;
  stops: number;
  price: number;
  cabin: string;
}

interface HotelOffer {
  id: string;
  name: string;
  starRating: number;
  reviewScore: number;
  totalPrice: number;
  pricePerNight: number;
  roomType: string;
  isLuxuryBrand: boolean;
}

interface TripPackage {
  flight: FlightOffer;
  hotel: HotelOffer;
  totalPrice: number;
  aiReasoning: string;
  departureDate: string;
  returnDate: string;
}

type Tier = 'base' | 'premium' | 'luxe';

const getLoadingMessages = (tier: Tier) => {
  const hotelText = tier === 'luxe' ? 'luxury stays' : tier === 'premium' ? 'top-rated hotels' : 'budget-friendly hotels';
  return [
    "🌴 Scanning paradise destinations...",
    "✈️ Finding the perfect flights...",
    `🏨 Curating ${hotelText}...`,
    "🌡️ Checking weather forecasts...",
    "🎯 Optimizing your perfect trip...",
    "✨ Almost there...",
  ];
};

const curatingQuotes = [
  { emoji: "🌴", text: "Your main character moment awaits..." },
  { emoji: "✨", text: "Curating immaculate vibes..." },
  { emoji: "🔥", text: "This trip is about to slap..." },
  { emoji: "💅", text: "Finding deals that understood the assignment..." },
  { emoji: "🌊", text: "Manifesting your perfect getaway..." },
  { emoji: "✈️", text: "Plot twist: you deserve this trip..." },
  { emoji: "🏝️", text: "No thoughts, just beach vibes loading..." },
  { emoji: "💫", text: "Serving wanderlust realness..." },
];

export default function Home() {
  const [destinations, setDestinations] = useState<DestinationWithWeather[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDestination, setSelectedDestination] = useState<DestinationWithWeather | null>(null);
  const [selectedTier, setSelectedTier] = useState<Tier>('premium');
  const [tripPackage, setTripPackage] = useState<TripPackage | null>(null);
  const [searchingPackage, setSearchingPackage] = useState(false);
  const [showPackageModal, setShowPackageModal] = useState(false);
  const [nights, setNights] = useState(3);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [userAirport, setUserAirport] = useState('SFO');
  const [locationDetected, setLocationDetected] = useState(false);
  const [isRoundTrip, setIsRoundTrip] = useState(true);
  const [isBooking, setIsBooking] = useState(false);
  const [destinationSummaries, setDestinationSummaries] = useState<Record<string, {summary: string; prices: {base: string; premium: string; luxe: string}}>>({});
  const [curatingQuoteIndex, setCuratingQuoteIndex] = useState(0);

  // Map of major cities to nearest airport codes
  const airports = [
    // US Airports
    { code: 'ATL', city: 'Atlanta' },
    { code: 'AUS', city: 'Austin' },
    { code: 'BNA', city: 'Nashville' },
    { code: 'BOS', city: 'Boston' },
    { code: 'BWI', city: 'Baltimore' },
    { code: 'CLE', city: 'Cleveland' },
    { code: 'CLT', city: 'Charlotte' },
    { code: 'CVG', city: 'Cincinnati' },
    { code: 'DCA', city: 'Washington DC' },
    { code: 'DEN', city: 'Denver' },
    { code: 'DFW', city: 'Dallas' },
    { code: 'DTW', city: 'Detroit' },
    { code: 'EWR', city: 'Newark' },
    { code: 'FLL', city: 'Fort Lauderdale' },
    { code: 'HNL', city: 'Honolulu' },
    { code: 'IAD', city: 'Washington Dulles' },
    { code: 'IAH', city: 'Houston' },
    { code: 'IND', city: 'Indianapolis' },
    { code: 'JAX', city: 'Jacksonville' },
    { code: 'JFK', city: 'New York JFK' },
    { code: 'LAS', city: 'Las Vegas' },
    { code: 'LAX', city: 'Los Angeles' },
    { code: 'LGA', city: 'New York LaGuardia' },
    { code: 'MCI', city: 'Kansas City' },
    { code: 'MCO', city: 'Orlando' },
    { code: 'MDW', city: 'Chicago Midway' },
    { code: 'MIA', city: 'Miami' },
    { code: 'MSP', city: 'Minneapolis' },
    { code: 'MSY', city: 'New Orleans' },
    { code: 'OAK', city: 'Oakland' },
    { code: 'ORD', city: 'Chicago O\'Hare' },
    { code: 'PBI', city: 'West Palm Beach' },
    { code: 'PDX', city: 'Portland' },
    { code: 'PHL', city: 'Philadelphia' },
    { code: 'PHX', city: 'Phoenix' },
    { code: 'PIT', city: 'Pittsburgh' },
    { code: 'RDU', city: 'Raleigh-Durham' },
    { code: 'RSW', city: 'Fort Myers' },
    { code: 'SAN', city: 'San Diego' },
    { code: 'SAT', city: 'San Antonio' },
    { code: 'SEA', city: 'Seattle' },
    { code: 'SFO', city: 'San Francisco' },
    { code: 'SJC', city: 'San Jose' },
    { code: 'SLC', city: 'Salt Lake City' },
    { code: 'SMF', city: 'Sacramento' },
    { code: 'SNA', city: 'Orange County' },
    { code: 'STL', city: 'St. Louis' },
    { code: 'TPA', city: 'Tampa' },
    // International - Europe
    { code: 'LHR', city: 'London Heathrow' },
    { code: 'LGW', city: 'London Gatwick' },
    { code: 'CDG', city: 'Paris' },
    { code: 'AMS', city: 'Amsterdam' },
    { code: 'FRA', city: 'Frankfurt' },
    { code: 'MUC', city: 'Munich' },
    { code: 'ZRH', city: 'Zurich' },
    { code: 'FCO', city: 'Rome' },
    { code: 'MXP', city: 'Milan' },
    { code: 'BCN', city: 'Barcelona' },
    { code: 'MAD', city: 'Madrid' },
    { code: 'LIS', city: 'Lisbon' },
    { code: 'ATH', city: 'Athens' },
    { code: 'VIE', city: 'Vienna' },
    { code: 'CPH', city: 'Copenhagen' },
    { code: 'ARN', city: 'Stockholm' },
    { code: 'OSL', city: 'Oslo' },
    { code: 'HEL', city: 'Helsinki' },
    { code: 'DUB', city: 'Dublin' },
    { code: 'EDI', city: 'Edinburgh' },
    { code: 'BRU', city: 'Brussels' },
    { code: 'PRG', city: 'Prague' },
    { code: 'WAW', city: 'Warsaw' },
    { code: 'IST', city: 'Istanbul' },
    // International - Asia Pacific
    { code: 'DEL', city: 'New Delhi' },
    { code: 'BOM', city: 'Mumbai' },
    { code: 'BLR', city: 'Bangalore' },
    { code: 'SIN', city: 'Singapore' },
    { code: 'HKG', city: 'Hong Kong' },
    { code: 'NRT', city: 'Tokyo Narita' },
    { code: 'HND', city: 'Tokyo Haneda' },
    { code: 'ICN', city: 'Seoul' },
    { code: 'PEK', city: 'Beijing' },
    { code: 'PVG', city: 'Shanghai' },
    { code: 'BKK', city: 'Bangkok' },
    { code: 'CGK', city: 'Jakarta' },
    { code: 'KUL', city: 'Kuala Lumpur' },
    { code: 'SYD', city: 'Sydney' },
    { code: 'MEL', city: 'Melbourne' },
    { code: 'AKL', city: 'Auckland' },
    // International - Americas & Middle East
    { code: 'YYZ', city: 'Toronto' },
    { code: 'YVR', city: 'Vancouver' },
    { code: 'MEX', city: 'Mexico City' },
    { code: 'GRU', city: 'São Paulo' },
    { code: 'EZE', city: 'Buenos Aires' },
    { code: 'BOG', city: 'Bogotá' },
    { code: 'SCL', city: 'Santiago' },
    { code: 'DXB', city: 'Dubai' },
    { code: 'DOH', city: 'Doha' },
    { code: 'TLV', city: 'Tel Aviv' },
    { code: 'JNB', city: 'Johannesburg' },
  ];

  const airportCoords: Record<string, {lat: number; lon: number}> = {
    // US Airports
    ATL: { lat: 33.6407, lon: -84.4277 },
    AUS: { lat: 30.1975, lon: -97.6664 },
    BNA: { lat: 36.1263, lon: -86.6774 },
    BOS: { lat: 42.3656, lon: -71.0096 },
    BWI: { lat: 39.1754, lon: -76.6683 },
    CLE: { lat: 41.4117, lon: -81.8498 },
    CLT: { lat: 35.2140, lon: -80.9431 },
    CVG: { lat: 39.0488, lon: -84.6678 },
    DCA: { lat: 38.8512, lon: -77.0402 },
    DEN: { lat: 39.8561, lon: -104.6737 },
    DFW: { lat: 32.8998, lon: -97.0403 },
    DTW: { lat: 42.2124, lon: -83.3534 },
    EWR: { lat: 40.6895, lon: -74.1745 },
    FLL: { lat: 26.0726, lon: -80.1527 },
    HNL: { lat: 21.3187, lon: -157.9225 },
    IAD: { lat: 38.9531, lon: -77.4565 },
    IAH: { lat: 29.9902, lon: -95.3368 },
    IND: { lat: 39.7173, lon: -86.2944 },
    JAX: { lat: 30.4941, lon: -81.6879 },
    JFK: { lat: 40.6413, lon: -73.7781 },
    LAS: { lat: 36.0840, lon: -115.1537 },
    LAX: { lat: 33.9425, lon: -118.4081 },
    LGA: { lat: 40.7769, lon: -73.8740 },
    MCI: { lat: 39.2976, lon: -94.7139 },
    MCO: { lat: 28.4312, lon: -81.3081 },
    MDW: { lat: 41.7868, lon: -87.7522 },
    MIA: { lat: 25.7959, lon: -80.2870 },
    MSP: { lat: 44.8848, lon: -93.2223 },
    MSY: { lat: 29.9934, lon: -90.2580 },
    OAK: { lat: 37.7213, lon: -122.2208 },
    ORD: { lat: 41.9742, lon: -87.9073 },
    PBI: { lat: 26.6832, lon: -80.0956 },
    PDX: { lat: 45.5898, lon: -122.5951 },
    PHL: { lat: 39.8744, lon: -75.2424 },
    PHX: { lat: 33.4373, lon: -112.0078 },
    PIT: { lat: 40.4915, lon: -80.2329 },
    RDU: { lat: 35.8801, lon: -78.7880 },
    RSW: { lat: 26.5362, lon: -81.7552 },
    SAN: { lat: 32.7336, lon: -117.1897 },
    SAT: { lat: 29.5337, lon: -98.4698 },
    SEA: { lat: 47.4502, lon: -122.3088 },
    SFO: { lat: 37.6213, lon: -122.379 },
    SJC: { lat: 37.3639, lon: -121.9289 },
    SLC: { lat: 40.7899, lon: -111.9791 },
    SMF: { lat: 38.6954, lon: -121.5908 },
    SNA: { lat: 33.6757, lon: -117.8678 },
    STL: { lat: 38.7487, lon: -90.3700 },
    TPA: { lat: 27.9755, lon: -82.5332 },
    // International - Europe
    LHR: { lat: 51.4700, lon: -0.4543 },
    LGW: { lat: 51.1537, lon: -0.1821 },
    CDG: { lat: 49.0097, lon: 2.5479 },
    AMS: { lat: 52.3105, lon: 4.7683 },
    FRA: { lat: 50.0379, lon: 8.5622 },
    MUC: { lat: 48.3537, lon: 11.7750 },
    ZRH: { lat: 47.4582, lon: 8.5555 },
    FCO: { lat: 41.8003, lon: 12.2389 },
    MXP: { lat: 45.6306, lon: 8.7281 },
    BCN: { lat: 41.2974, lon: 2.0833 },
    MAD: { lat: 40.4983, lon: -3.5676 },
    LIS: { lat: 38.7756, lon: -9.1354 },
    ATH: { lat: 37.9364, lon: 23.9445 },
    VIE: { lat: 48.1103, lon: 16.5697 },
    CPH: { lat: 55.6180, lon: 12.6508 },
    ARN: { lat: 59.6498, lon: 17.9238 },
    OSL: { lat: 60.1976, lon: 11.1004 },
    HEL: { lat: 60.3172, lon: 24.9633 },
    DUB: { lat: 53.4264, lon: -6.2499 },
    EDI: { lat: 55.9508, lon: -3.3615 },
    BRU: { lat: 50.9014, lon: 4.4844 },
    PRG: { lat: 50.1008, lon: 14.2600 },
    WAW: { lat: 52.1657, lon: 20.9671 },
    IST: { lat: 41.2753, lon: 28.7519 },
    // International - Asia Pacific
    DEL: { lat: 28.5562, lon: 77.1000 },
    BOM: { lat: 19.0896, lon: 72.8656 },
    BLR: { lat: 13.1986, lon: 77.7066 },
    SIN: { lat: 1.3644, lon: 103.9915 },
    HKG: { lat: 22.3080, lon: 113.9185 },
    NRT: { lat: 35.7720, lon: 140.3929 },
    HND: { lat: 35.5494, lon: 139.7798 },
    ICN: { lat: 37.4602, lon: 126.4407 },
    PEK: { lat: 40.0799, lon: 116.6031 },
    PVG: { lat: 31.1443, lon: 121.8083 },
    BKK: { lat: 13.6900, lon: 100.7501 },
    CGK: { lat: -6.1256, lon: 106.6559 },
    KUL: { lat: 2.7456, lon: 101.7099 },
    SYD: { lat: -33.9399, lon: 151.1753 },
    MEL: { lat: -37.6690, lon: 144.8410 },
    AKL: { lat: -37.0082, lon: 174.7850 },
    // International - Americas & Middle East
    YYZ: { lat: 43.6777, lon: -79.6248 },
    YVR: { lat: 49.1947, lon: -123.1792 },
    MEX: { lat: 19.4363, lon: -99.0721 },
    GRU: { lat: -23.4356, lon: -46.4731 },
    EZE: { lat: -34.8222, lon: -58.5358 },
    BOG: { lat: 4.7016, lon: -74.1469 },
    SCL: { lat: -33.3930, lon: -70.7858 },
    DXB: { lat: 25.2532, lon: 55.3657 },
    DOH: { lat: 25.2731, lon: 51.6081 },
    TLV: { lat: 32.0055, lon: 34.8854 },
    JNB: { lat: -26.1367, lon: 28.2411 },
  };

  const findNearestAirport = (lat: number, lon: number): string => {
    let nearest = 'SFO';
    let minDist = Infinity;
    
    for (const [code, coords] of Object.entries(airportCoords)) {
      const dist = Math.sqrt(Math.pow(coords.lat - lat, 2) + Math.pow(coords.lon - lon, 2));
      if (dist < minDist) {
        minDist = dist;
        nearest = code;
      }
    }
    return nearest;
  };

  useEffect(() => {
    // Request geolocation immediately on page load
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const airport = findNearestAirport(pos.coords.latitude, pos.coords.longitude);
          setUserAirport(airport);
          setLocationDetected(true);
          console.log('Detected airport:', airport);
        },
        (err) => {
          console.log('Geolocation error:', err.message);
          setLocationDetected(false);
          // Fetch with default airport if geolocation fails
          fetchDestinations('SFO');
        },
        { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
      );
    } else {
      fetchDestinations('SFO');
    }
  }, []);

  // Re-fetch destinations AND summaries when airport changes
  useEffect(() => {
    if (userAirport) {
      fetchDestinations(userAirport);
    }
  }, [userAirport]);

  // Fetch summaries when destinations change
  useEffect(() => {
    if (destinations.length > 0) {
      fetchSummariesForDestinations(destinations, userAirport);
    }
  }, [destinations]);

  // Rotate curating quotes when modal is loading
  useEffect(() => {
    if (selectedDestination && !destinationSummaries[selectedDestination.id]) {
      setCuratingQuoteIndex(Math.floor(Math.random() * curatingQuotes.length));
      const interval = setInterval(() => {
        setCuratingQuoteIndex(prev => (prev + 1) % curatingQuotes.length);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [selectedDestination, destinationSummaries]);

  const fetchDestinations = async (origin: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/discover?origin=${origin}`);
      const data = await response.json();
      setDestinations(data.destinations);
    } catch (error) {
      console.error('Error fetching destinations:', error);
    }
    setLoading(false);
  };

  const fetchSummariesForDestinations = (dests: DestinationWithWeather[], origin: string) => {
    // Clear existing summaries to show loading state
    setDestinationSummaries({});
    
    dests.forEach(async (dest: DestinationWithWeather) => {
      try {
        const summaryRes = await fetch('/api/summary', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ destinationId: dest.id, origin }),
        });
        const summaryData = await summaryRes.json();
        setDestinationSummaries(prev => ({
          ...prev,
          [dest.id]: { summary: summaryData.summary, prices: summaryData.prices }
        }));
      } catch (e) {
        console.error('Error fetching summary for', dest.id);
      }
    });
  };

  const searchPackage = async () => {
    if (!selectedDestination) return;
    
    setSearchingPackage(true);
    setShowPackageModal(true);
    setTripPackage(null);
    
    // Get tier-appropriate loading messages
    const messages = getLoadingMessages(selectedTier);
    setLoadingMessage(messages[0]);
    
    // Rotate loading messages
    let msgIndex = 0;
    const msgInterval = setInterval(() => {
      msgIndex = (msgIndex + 1) % messages.length;
      setLoadingMessage(messages[msgIndex]);
    }, 2000);

    try {
      const response = await fetch('/api/package', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destinationId: selectedDestination.id,
          tier: selectedTier,
          nights: nights,
          origin: userAirport,
        }),
      });

      const data = await response.json();
      setTripPackage(data);
    } catch (error) {
      console.error('Error searching package:', error);
    }
    
    clearInterval(msgInterval);
    setSearchingPackage(false);
  };

  const updateNights = (newNights: number) => {
    if (newNights < 1 || newNights > 14) return;
    setNights(newNights);
  };

  const calculateTotalWithNights = () => {
    if (!tripPackage) return 0;
    const flightPrice = isRoundTrip ? tripPackage.flight.price : Math.round(tripPackage.flight.price * 0.55);
    const hotelTotal = tripPackage.hotel.pricePerNight * nights;
    return Math.round(flightPrice + hotelTotal);
  };

  const handleBookNow = async () => {
    if (!tripPackage || !selectedDestination) return;
    
    setIsBooking(true);
    
    // If mock flight, redirect to Google Flights with pre-filled search
    if (tripPackage.flight.id.startsWith('mock_')) {
      const departDate = new Date();
      departDate.setDate(departDate.getDate() + 1);
      const returnDate = new Date(departDate);
      returnDate.setDate(returnDate.getDate() + nights);
      
      const googleFlightsUrl = `https://www.google.com/travel/flights?q=flights%20from%20${userAirport}%20to%20${selectedDestination.airportCode}`;
      window.open(googleFlightsUrl, '_blank');
      setIsBooking(false);
      return;
    }
    
    try {
      const response = await fetch('/api/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          flightId: tripPackage.flight.id,
          isRoundTrip,
        }),
      });
      
      const data = await response.json();
      
      if (data.success && data.checkoutUrl) {
        window.open(data.checkoutUrl, '_blank');
      } else {
        // Fallback to Google Flights
        const googleFlightsUrl = `https://www.google.com/travel/flights?q=flights%20from%20${userAirport}%20to%20${selectedDestination.airportCode}`;
        window.open(googleFlightsUrl, '_blank');
      }
    } catch (error) {
      console.error('Booking error:', error);
      // Fallback to Google Flights
      const googleFlightsUrl = `https://www.google.com/travel/flights?q=flights%20from%20${userAirport}%20to%20${selectedDestination.airportCode}`;
      window.open(googleFlightsUrl, '_blank');
    }
    
    setIsBooking(false);
  };

  const getDayName = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  };

  const tierDescriptions = {
    base: { label: 'BASE', desc: 'Budget-friendly • May have layovers • 3★ hotels', price: '$400-700' },
    premium: { label: 'PREMIUM', desc: 'Best value • Direct preferred • 4★ hotels', price: '$700-1,200' },
    luxe: { label: 'LUXE', desc: 'Ultimate comfort • Nonstop • 5★ luxury brands', price: '$1,500-3,000+' },
  };

  return (
    <main className="min-h-screen bg-[var(--cream)]">
      {/* Header */}
      <header className="bg-[var(--forest)] text-white py-4 px-6">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <h1 className="font-display text-2xl tracking-tight">TAKEMETO75</h1>
          <div className="flex items-center gap-6">
            <a href="#how" className="text-sm font-medium hover:text-[var(--coral)] transition">How It Works</a>
            <div className="flex items-center gap-2">
              <span className="text-sm opacity-75">Departing from</span>
              <select
                value={userAirport}
                onChange={(e) => setUserAirport(e.target.value)}
                className="bg-white/10 border border-white/30 rounded-lg px-3 py-1.5 text-sm font-display cursor-pointer hover:bg-white/20 transition focus:outline-none focus:ring-2 focus:ring-[var(--coral)]"
              >
                {[...airports].sort((a, b) => a.city.localeCompare(b.city)).map((ap) => (
                  <option key={ap.code} value={ap.code} className="text-[var(--forest)]">
                    {ap.city} - {ap.code}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </header>

      {/* Coral wave */}
      <div className="bg-[var(--coral)] h-16 relative">
        <svg className="absolute bottom-0 w-full" viewBox="0 0 1440 60" fill="none" preserveAspectRatio="none">
          <path d="M0 60L1440 60L1440 30C1200 60 960 0 720 30C480 60 240 0 0 30L0 60Z" fill="var(--cream)"/>
        </svg>
      </div>

      {/* Hero Section */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-display text-5xl md:text-7xl text-[var(--coral)] leading-tight mb-6">
            ESCAPE TO<br/>PERFECT WEATHER
          </h2>
          <p className="text-xl md:text-2xl text-[var(--forest)] mb-4">
            Work&apos;s not going anywhere... What about you?
          </p>
          <p className="text-lg text-[var(--forest-light)] mb-2">
            We find destinations near 75°F and our AI picks your perfect flight + hotel.
          </p>
          <p className="text-sm text-[var(--coral)] font-semibold">
            ✨ Smart package selection tailored to your style
          </p>
        </div>
      </section>

      {/* Destinations Section */}
      <section id="destinations" className="py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h3 className="font-display text-3xl text-[var(--forest)] mb-2">
              THIS WEEK&apos;S PERFECT ESCAPES
            </h3>
            <p className="text-[var(--forest-light)]">
              Real-time weather forecasts • AI-optimized packages • Book in 60 seconds
            </p>
          </div>

          {loading ? (
            <div className="grid md:grid-cols-3 gap-8">
              {[1, 2, 3].map(i => (
                <div key={i} className="destination-card p-6 loading-pulse">
                  <div className="h-48 bg-[var(--sand)] rounded-lg mb-4"></div>
                  <div className="h-6 bg-[var(--sand)] rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-[var(--sand)] rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-8">
              {destinations.map((dest) => (
                <div
                  key={dest.id}
                  className="destination-card cursor-pointer"
                  onClick={() => setSelectedDestination(dest)}
                >
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={dest.image}
                      alt={dest.city}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-4 right-4 weather-badge">
                      <span className="text-lg font-display">{dest.avgTemp}°F</span>
                    </div>
                  </div>
                  
                  <div className="p-5">
                    <h4 className="font-display text-xl text-[var(--forest)] mb-1">
                      {dest.city.toUpperCase()} {getCountryFlag(dest.country)}
                    </h4>
                    <p className="text-sm text-[var(--forest-light)] mb-4">
                      {dest.country} • {dest.description}
                    </p>

                    {/* 5-Day Forecast */}
                    <div className="grid grid-cols-5 gap-2 mb-4">
                      {dest.weather.slice(0, 5).map((day, i) => (
                        <div key={i} className="forecast-day">
                          <p className="text-xs font-medium text-[var(--forest-light)]">
                            {getDayName(day.date)}
                          </p>
                          <img src={`https:${day.icon}`} alt={day.condition} className="w-8 h-8 mx-auto" />
                          <p className="font-display text-lg text-[var(--coral)]">
                            {day.temp}°
                          </p>
                        </div>
                      ))}
                    </div>

                    <button className="btn-coral w-full text-sm">
                      Find My Package
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* How It Works */}
      <section id="how" className="py-16 px-6 bg-[var(--forest)] text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h3 className="font-display text-3xl mb-12">HOW IT WORKS</h3>
          
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="w-16 h-16 bg-[var(--coral)] rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="font-display text-2xl">1</span>
              </div>
              <h4 className="font-display text-lg mb-2">WE FIND 75°</h4>
              <p className="text-sm opacity-80">
                Real-time weather data finds perfect destinations.
              </p>
            </div>
            
            <div>
              <div className="w-16 h-16 bg-[var(--coral)] rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="font-display text-2xl">2</span>
              </div>
              <h4 className="font-display text-lg mb-2">PICK YOUR TIER</h4>
              <p className="text-sm opacity-80">
                Base, Premium, or Luxe based on your budget.
              </p>
            </div>
            
            <div>
              <div className="w-16 h-16 bg-[var(--coral)] rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="font-display text-2xl">3</span>
              </div>
              <h4 className="font-display text-lg mb-2">AI PICKS BEST</h4>
              <p className="text-sm opacity-80">
                Our AI analyzes options and selects the optimal combo.
              </p>
            </div>
            
            <div>
              <div className="w-16 h-16 bg-[var(--coral)] rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="font-display text-2xl">4</span>
              </div>
              <h4 className="font-display text-lg mb-2">BOOK & GO</h4>
              <p className="text-sm opacity-80">
                One click to checkout. You just show up.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Tier Selection Modal */}
      {selectedDestination && !showPackageModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-[var(--cream)] rounded-3xl max-w-lg w-full border-4 border-[var(--forest)]">
            <div className="p-5">
              {/* Header */}
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-display text-2xl text-[var(--forest)]">
                    {selectedDestination.city.toUpperCase()}
                  </h3>
                  <p className="text-sm text-[var(--forest-light)]">{selectedDestination.country}</p>
                </div>
                <button
                  onClick={() => setSelectedDestination(null)}
                  className="text-[var(--forest)] hover:text-[var(--coral)] text-2xl"
                >
                  ✕
                </button>
              </div>

              {/* Loading state while fetching summary */}
              {!destinationSummaries[selectedDestination.id] ? (
                <div className="text-center py-10">
                  <div className="relative w-16 h-16 mx-auto mb-4">
                    <div className="absolute inset-0 border-4 border-[var(--sand)] rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-[var(--coral)] border-t-transparent rounded-full spinner"></div>
                    <div className="absolute inset-0 flex items-center justify-center text-xl">🌴</div>
                  </div>
                  <p className="font-display text-base text-[var(--forest)]">Curating your getaway...</p>
                  <p className="text-sm text-[var(--forest-light)] mt-1">Finding deals from {userAirport}</p>
                </div>
              ) : (
                <>
                  {/* AI Summary with Tips */}
                  <div className="bg-[var(--sand)] rounded-xl p-3 mb-3">
                    <p className="text-sm text-[var(--forest)] leading-relaxed line-clamp-3">{destinationSummaries[selectedDestination.id].summary}</p>
                    {/* Tips with emojis */}
                    <div className="grid grid-cols-2 gap-1 mt-2 pt-2 border-t border-[var(--forest)]/10">
                      {selectedDestination.highlights?.slice(0, 4).map((tip, i) => (
                        <span key={i} className="text-[11px] text-[var(--forest-light)] truncate">{tip}</span>
                      ))}
                    </div>
                  </div>

                  {/* Compact Weather Bar */}
                  <div className="flex justify-between items-center bg-white rounded-xl px-3 py-2 mb-4 border border-[var(--forest)]/20">
                    {selectedDestination.weather.slice(0, 5).map((day, i) => (
                      <div key={i} className="text-center flex-1">
                        <p className="text-[10px] text-[var(--forest-light)]">{getDayName(day.date)}</p>
                        <img src={`https:${day.icon}`} alt={day.condition} className="w-7 h-7 mx-auto" />
                        <p className="font-display text-sm text-[var(--coral)]">{day.temp}°</p>
                      </div>
                    ))}
                  </div>

                  {/* Tier Selection - Compact */}
                  <div className="space-y-2 mb-4">
                    {(['base', 'premium', 'luxe'] as Tier[]).map((tier) => (
                      <div
                        key={tier}
                        className={`tier-option py-3 px-4 ${selectedTier === tier ? 'selected' : ''}`}
                        onClick={() => setSelectedTier(tier)}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-display text-sm">{tierDescriptions[tier].label}</p>
                            <p className="text-xs opacity-75">{tierDescriptions[tier].desc}</p>
                          </div>
                          <p className="font-display text-lg">
                            {destinationSummaries[selectedDestination.id]?.prices?.[tier] || tierDescriptions[tier].price}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button 
                    className="btn-coral w-full py-3"
                    onClick={searchPackage}
                  >
                    ✨ FIND MY PERFECT PACKAGE
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Package Result Modal */}
      {showPackageModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-[var(--cream)] rounded-3xl max-w-lg w-full border-4 border-[var(--forest)]">
            <div className="p-5">
              {/* Header */}
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-display text-xl text-[var(--forest)]">
                    YOUR {selectedTier.toUpperCase()} PACKAGE
                  </h3>
                  <p className="text-sm text-[var(--forest-light)]">
                    {userAirport} → {selectedDestination?.city}, {selectedDestination?.country}
                  </p>
                  {tripPackage && (
                    <p className="text-xs text-[var(--coral)] font-medium mt-1">
                      {(() => {
                        const dep = new Date(tripPackage.departureDate + 'T12:00:00');
                        const ret = new Date(dep);
                        ret.setDate(ret.getDate() + nights);
                        return `${dep.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} – ${ret.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}`;
                      })()}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => {
                    setShowPackageModal(false);
                    setSelectedDestination(null);
                    setTripPackage(null);
                    setNights(3);
                  }}
                  className="text-[var(--forest)] hover:text-[var(--coral)] text-xl"
                >
                  ✕
                </button>
              </div>

              {searchingPackage ? (
                <div className="text-center py-12">
                  <div className="relative w-20 h-20 mx-auto mb-4">
                    <div className="absolute inset-0 border-4 border-[var(--sand)] rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-[var(--coral)] border-t-transparent rounded-full spinner"></div>
                    <div className="absolute inset-0 flex items-center justify-center text-2xl">✈️</div>
                  </div>
                  <p className="font-display text-lg text-[var(--forest)] mb-1">{loadingMessage}</p>
                  <p className="text-sm text-[var(--forest-light)]">AI is selecting the best {selectedTier} combo for you</p>
                </div>
              ) : tripPackage ? (
                <div className="space-y-3">
                  {/* AI Reasoning - compact */}
                  <div className="bg-[var(--sand)] rounded-xl p-3">
                    <p className="text-xs font-medium text-[var(--forest)] mb-1">✨ Why we picked this:</p>
                    <p className="text-sm text-[var(--forest)] leading-snug">{tripPackage.aiReasoning}</p>
                  </div>

                  {/* Flight - compact */}
                  <div className="bg-white rounded-xl p-3 border border-[var(--forest)]/20">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-xs text-[var(--coral)] font-medium">✈️ FLIGHT ({isRoundTrip ? 'RT' : 'OW'})</p>
                        <p className="font-display text-base">{tripPackage.flight.airline}</p>
                        <p className="text-xs text-[var(--forest-light)]">
                          {tripPackage.flight.cabin} • {tripPackage.flight.stops === 0 ? 'Nonstop' : `${tripPackage.flight.stops} stop`} • {tripPackage.flight.duration}
                        </p>
                      </div>
                      <p className="font-display text-lg text-[var(--coral)]">
                        ${isRoundTrip ? Math.round(tripPackage.flight.price) : Math.round(tripPackage.flight.price * 0.55)}
                      </p>
                    </div>
                  </div>

                  {/* Hotel - compact */}
                  <div className="bg-white rounded-xl p-3 border border-[var(--forest)]/20">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-xs text-[var(--coral)] font-medium">🏨 HOTEL ({nights}N)</p>
                        <p className="font-display text-base">{tripPackage.hotel.name}</p>
                        <p className="text-xs text-[var(--forest-light)]">
                          {tripPackage.hotel.starRating}★ • {tripPackage.hotel.reviewScore}/100
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-display text-lg text-[var(--coral)]">${Math.round(tripPackage.hotel.pricePerNight * nights)}</p>
                        <p className="text-[10px] text-[var(--forest-light)]">${Math.round(tripPackage.hotel.pricePerNight)}/night</p>
                      </div>
                    </div>
                  </div>

                  {/* Total */}
                  <div className="bg-[var(--forest)] text-white rounded-xl p-4">
                    <div className="flex justify-between items-center">
                      <p className="font-display text-lg">TOTAL</p>
                      <p className="font-display text-2xl">${calculateTotalWithNights()}</p>
                    </div>
                  </div>

                  {/* Controls row - light design */}
                  <div className="flex justify-between items-center bg-white rounded-xl px-4 py-3 border border-[var(--forest)]/20">
                    {/* Round-trip checkbox - left */}
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isRoundTrip}
                        onChange={(e) => setIsRoundTrip(e.target.checked)}
                        className="w-4 h-4 rounded border-[var(--forest)] accent-[var(--coral)]"
                      />
                      <span className="text-sm text-[var(--forest)]">Round trip</span>
                    </label>
                    {/* Nights toggle - right */}
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => updateNights(nights - 1)}
                        className="w-7 h-7 rounded-full border-2 border-[var(--forest)] flex items-center justify-center text-sm font-display text-[var(--forest)] hover:bg-[var(--sand)] transition disabled:opacity-30"
                        disabled={nights <= 1}
                      >
                        −
                      </button>
                      <span className="text-sm font-display text-[var(--forest)] w-16 text-center">{nights} nights</span>
                      <button 
                        onClick={() => updateNights(nights + 1)}
                        className="w-7 h-7 rounded-full border-2 border-[var(--forest)] flex items-center justify-center text-sm font-display text-[var(--forest)] hover:bg-[var(--sand)] transition disabled:opacity-30"
                        disabled={nights >= 14}
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <button
                      className="btn-coral w-full py-3"
                      onClick={() => {
                        const dep = tripPackage.departureDate;
                        const ret = new Date(dep);
                        ret.setDate(ret.getDate() + nights);
                        const retStr = ret.toISOString().split('T')[0];
                        const cabin = selectedTier === 'luxe' ? 'BUSINESS' : selectedTier === 'premium' ? 'PREMIUM_ECONOMY' : 'ECONOMY';
                        const url = `https://www.booking.com/flights/search?type=ROUNDTRIP&adults=1&cabinClass=${cabin}&from=${userAirport}.AIRPORT&to=${selectedDestination?.airportCode}.AIRPORT&depart=${dep}&return=${retStr}`;
                        window.open(url, '_blank');
                      }}
                    >
                      BOOK FLIGHT →
                    </button>
                    <button
                      className="w-full py-3 rounded-full border-2 border-[var(--forest)] text-[var(--forest)] font-display text-sm hover:bg-[var(--forest)] hover:text-white transition"
                      onClick={() => {
                        const hotelName = encodeURIComponent(tripPackage.hotel.name);
                        const city = encodeURIComponent(selectedDestination?.city || '');
                        const dep = tripPackage.departureDate;
                        const ret = new Date(dep);
                        ret.setDate(ret.getDate() + nights);
                        const retStr = ret.toISOString().split('T')[0];
                        const url = `https://www.booking.com/searchresults.html?ss=${hotelName}+${city}&checkin=${dep}&checkout=${retStr}`;
                        window.open(url, '_blank');
                      }}
                    >
                      BOOK HOTEL →
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-3xl mb-3">😅</p>
                  <p className="text-[var(--forest)] font-display">Something went wrong</p>
                  <button 
                    onClick={() => setShowPackageModal(false)}
                    className="btn-coral mt-4 px-6"
                  >
                    GO BACK
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-[var(--sand)] py-8 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <p className="font-display text-xl text-[var(--forest)] mb-2">TAKEMETO75</p>
          <p className="text-sm text-[var(--forest-light)]">
            Life&apos;s too short for bad weather. © 2025
          </p>
        </div>
      </footer>
    </main>
  );
}
