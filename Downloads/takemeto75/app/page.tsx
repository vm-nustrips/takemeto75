'use client';

import { useState, useEffect } from 'react';

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
  claudeReasoning: string;
}

type Tier = 'base' | 'premium' | 'luxe';

const loadingMessages = [
  "🌴 Scanning paradise destinations...",
  "✈️ Finding the perfect flights...",
  "🏨 Curating luxury stays...",
  "🌡️ Checking weather forecasts...",
  "🎯 Optimizing your perfect trip...",
  "✨ Almost there...",
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
  const [loadingMessage, setLoadingMessage] = useState(loadingMessages[0]);

  useEffect(() => {
    fetchDestinations();
  }, []);

  const fetchDestinations = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/destinations');
      const data = await response.json();
      setDestinations(data.destinations);
    } catch (error) {
      console.error('Error fetching destinations:', error);
    }
    setLoading(false);
  };

  const searchPackage = async () => {
    if (!selectedDestination) return;
    
    setSearchingPackage(true);
    setShowPackageModal(true);
    setTripPackage(null);
    
    // Rotate loading messages
    let msgIndex = 0;
    const msgInterval = setInterval(() => {
      msgIndex = (msgIndex + 1) % loadingMessages.length;
      setLoadingMessage(loadingMessages[msgIndex]);
    }, 2000);

    try {
      const response = await fetch('/api/package', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destinationId: selectedDestination.id,
          tier: selectedTier,
          nights: nights,
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
    const hotelTotal = tripPackage.hotel.pricePerNight * nights;
    return Math.round(tripPackage.flight.price + hotelTotal);
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
          <nav className="flex gap-6 text-sm font-medium">
            <a href="#destinations" className="hover:text-[var(--coral)] transition">Destinations</a>
            <a href="#how" className="hover:text-[var(--coral)] transition">How It Works</a>
          </nav>
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
                      {dest.city.toUpperCase()}
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
          <div className="bg-[var(--cream)] rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border-4 border-[var(--forest)]">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="font-display text-2xl text-[var(--forest)]">
                    {selectedDestination.city.toUpperCase()}
                  </h3>
                  <p className="text-[var(--forest-light)]">{selectedDestination.country} • {selectedDestination.description}</p>
                </div>
                <button
                  onClick={() => setSelectedDestination(null)}
                  className="text-[var(--forest)] hover:text-[var(--coral)] text-2xl"
                >
                  ✕
                </button>
              </div>

              {/* Weather Preview */}
              <div className="bg-white rounded-2xl p-4 mb-4 border-2 border-[var(--forest)]">
                <p className="text-sm font-medium text-[var(--forest)] mb-3">5-Day Forecast</p>
                <div className="grid grid-cols-5 gap-3">
                  {selectedDestination.weather.slice(0, 5).map((day, i) => (
                    <div key={i} className="text-center">
                      <p className="text-xs text-[var(--forest-light)]">{getDayName(day.date)}</p>
                      <p className="font-display text-xl text-[var(--coral)]">{day.temp}°</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Highlights */}
              <div className="bg-[var(--sand)] rounded-2xl p-4 mb-6">
                <p className="text-sm font-medium text-[var(--forest)] mb-3">💡 Local Tips</p>
                <ul className="space-y-2">
                  {selectedDestination.highlights?.map((tip, i) => (
                    <li key={i} className="text-sm text-[var(--forest)]">{tip}</li>
                  ))}
                </ul>
              </div>

              {/* Tier Selection */}
              <p className="font-display text-lg text-[var(--forest)] mb-4">CHOOSE YOUR TIER</p>
              
              <div className="space-y-3 mb-6">
                {(['base', 'premium', 'luxe'] as Tier[]).map((tier) => (
                  <div
                    key={tier}
                    className={`tier-option ${selectedTier === tier ? 'selected' : ''}`}
                    onClick={() => setSelectedTier(tier)}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-display">{tierDescriptions[tier].label}</p>
                        <p className="text-sm opacity-75">{tierDescriptions[tier].desc}</p>
                      </div>
                      <p className="font-display text-xl">{tierDescriptions[tier].price}</p>
                    </div>
                  </div>
                ))}
              </div>

              <button 
                className="btn-coral w-full"
                onClick={searchPackage}
              >
                ✨ FIND MY PERFECT PACKAGE
              </button>
              
              <p className="text-center text-sm text-[var(--forest-light)] mt-3">
                Our AI will analyze flights + hotels and pick the best combo for you
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Package Result Modal */}
      {showPackageModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-[var(--cream)] rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border-4 border-[var(--forest)]">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="font-display text-2xl text-[var(--forest)]">
                    YOUR {selectedTier.toUpperCase()} PACKAGE
                  </h3>
                  <p className="text-[var(--forest-light)]">
                    {selectedDestination?.city}, {selectedDestination?.country}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowPackageModal(false);
                    setSelectedDestination(null);
                    setTripPackage(null);
                    setNights(3);
                  }}
                  className="text-[var(--forest)] hover:text-[var(--coral)] text-2xl"
                >
                  ✕
                </button>
              </div>

              {searchingPackage ? (
                <div className="text-center py-16">
                  <div className="relative w-24 h-24 mx-auto mb-6">
                    <div className="absolute inset-0 border-4 border-[var(--sand)] rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-[var(--coral)] border-t-transparent rounded-full spinner"></div>
                    <div className="absolute inset-0 flex items-center justify-center text-3xl">
                      ✈️
                    </div>
                  </div>
                  <p className="font-display text-xl text-[var(--forest)] mb-2">
                    {loadingMessage}
                  </p>
                  <p className="text-sm text-[var(--forest-light)]">
                    Finding the perfect {selectedTier} package for you
                  </p>
                </div>
              ) : tripPackage ? (
                <div className="space-y-6">
                  {/* AI Reasoning */}
                  <div className="claude-reasoning">
                    <p className="text-sm font-medium text-[var(--forest)] mb-1">✨ Why we picked this:</p>
                    <p className="text-[var(--forest)]">{tripPackage.claudeReasoning}</p>
                  </div>

                  {/* Nights Selector */}
                  <div className="bg-white rounded-2xl p-4 border-2 border-[var(--forest)]">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-display text-sm text-[var(--forest)]">TRIP LENGTH</p>
                        <p className="text-sm text-[var(--forest-light)]">Adjust your stay</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => updateNights(nights - 1)}
                          className="w-10 h-10 rounded-full border-2 border-[var(--forest)] flex items-center justify-center font-display hover:bg-[var(--sand)] transition"
                          disabled={nights <= 1}
                        >
                          −
                        </button>
                        <span className="font-display text-2xl w-16 text-center">{nights} {nights === 1 ? 'night' : 'nights'}</span>
                        <button 
                          onClick={() => updateNights(nights + 1)}
                          className="w-10 h-10 rounded-full border-2 border-[var(--forest)] flex items-center justify-center font-display hover:bg-[var(--sand)] transition"
                          disabled={nights >= 14}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Flight */}
                  <div className="bg-white rounded-2xl p-5 border-2 border-[var(--forest)]">
                    <p className="text-xs font-medium text-[var(--coral)] mb-2">✈️ FLIGHT (ROUNDTRIP)</p>
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-display text-lg">{tripPackage.flight.airline}</p>
                        <p className="text-sm text-[var(--forest-light)]">
                          {tripPackage.flight.cabin} • {tripPackage.flight.stops === 0 ? 'Nonstop' : `${tripPackage.flight.stops} stop(s)`} • {tripPackage.flight.duration}
                        </p>
                      </div>
                      <p className="font-display text-xl text-[var(--coral)]">${tripPackage.flight.price}</p>
                    </div>
                  </div>

                  {/* Hotel */}
                  <div className="bg-white rounded-2xl p-5 border-2 border-[var(--forest)]">
                    <p className="text-xs font-medium text-[var(--coral)] mb-2">🏨 HOTEL ({nights} {nights === 1 ? 'NIGHT' : 'NIGHTS'})</p>
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-display text-lg">{tripPackage.hotel.name}</p>
                        <p className="text-sm text-[var(--forest-light)]">
                          {tripPackage.hotel.starRating}★ • {tripPackage.hotel.reviewScore}/100 • {tripPackage.hotel.roomType}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-display text-xl text-[var(--coral)]">${tripPackage.hotel.pricePerNight * nights}</p>
                        <p className="text-xs text-[var(--forest-light)]">${tripPackage.hotel.pricePerNight}/night</p>
                      </div>
                    </div>
                  </div>

                  {/* Total */}
                  <div className="bg-[var(--forest)] text-white rounded-2xl p-5">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-display text-lg">TOTAL PACKAGE</p>
                        <p className="text-sm opacity-75">{nights} nights in paradise</p>
                      </div>
                      <p className="font-display text-3xl">${calculateTotalWithNights()}</p>
                    </div>
                  </div>

                  <button className="btn-coral w-full">
                    BOOK NOW →
                  </button>
                  
                  <p className="text-center text-xs text-[var(--forest-light)]">
                    🛡️ Free cancellation for 1 hour after booking
                  </p>
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-4xl mb-4">😅</p>
                  <p className="text-[var(--forest)] font-display">Oops! Something went wrong.</p>
                  <p className="text-sm text-[var(--forest-light)] mt-2">Please try again</p>
                  <button 
                    onClick={() => setShowPackageModal(false)}
                    className="btn-coral mt-4"
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
