'use client';

import { useState, useEffect } from 'react';
import { Destination, TripPackage, Tier, TravelDates, Airport, TIER_CONFIG } from '@/lib/types';
import { formatPrice, formatDateTime } from '@/lib/utils';

// ===========================================
// MAIN PAGE COMPONENT
// ===========================================

export default function Home() {
  const [step, setStep] = useState<'loading' | 'destinations' | 'packages' | 'booking'>('loading');
  const [userAirport, setUserAirport] = useState<Airport | null>(null);
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [dates, setDates] = useState<TravelDates | null>(null);
  const [selectedDestination, setSelectedDestination] = useState<Destination | null>(null);
  const [packages, setPackages] = useState<Record<Tier, TripPackage | undefined>>({
    base: undefined,
    premium: undefined,
    luxe: undefined,
  });
  const [selectedTier, setSelectedTier] = useState<Tier>('premium');
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get user location and fetch destinations
  useEffect(() => {
    async function init() {
      try {
        // Get geolocation
        let lat = 40.7128; // Default: NYC
        let lon = -74.006;

        if (navigator.geolocation) {
          try {
            const position = await new Promise<GeolocationPosition>((resolve, reject) => {
              navigator.geolocation.getCurrentPosition(resolve, reject, {
                timeout: 5000,
                maximumAge: 300000,
              });
            });
            lat = position.coords.latitude;
            lon = position.coords.longitude;
          } catch {
            console.log('Geolocation denied, using default');
          }
        }

        // Fetch destinations
        const response = await fetch(`/api/destinations?lat=${lat}&lon=${lon}`);
        const data = await response.json();

        setUserAirport(data.userAirport);
        setDestinations(data.destinations);
        setDates(data.dates);
        setStep('destinations');
      } catch (err) {
        console.error('Init error:', err);
        setError('Failed to load destinations');
        setStep('destinations');
      }
    }

    init();
  }, []);

  // Search for packages when destination selected
  async function handleDestinationSelect(destination: Destination) {
    if (!userAirport) return;

    setSelectedDestination(destination);
    setIsSearching(true);
    setStep('packages');

    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originAirport: userAirport.code,
          destinationCity: destination.city,
        }),
      });

      const data = await response.json();
      setPackages({
        base: data.packages.base,
        premium: data.packages.premium,
        luxe: data.packages.luxe,
      });
    } catch (err) {
      console.error('Search error:', err);
      setError('Failed to search packages');
    } finally {
      setIsSearching(false);
    }
  }

  // Handle booking
  async function handleBook(pkg: TripPackage) {
    // Open hotel booking in new tab (with AWIN tracking)
    if (pkg.hotel.url) {
      window.open(pkg.hotel.url, '_blank', 'noopener,noreferrer');
    }

    // Show flight booking confirmation
    // TODO: Integrate with Duffel checkout when ready
    alert(`Flight with ${pkg.flight.airline} - ${formatPrice(pkg.flight.price)}\n\nHotel booking opened in new tab.\n\nFlight checkout coming soon...`);
  }

  return (
    <main className="min-h-screen">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 glass">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">☀️</span>
            <span className="text-xl font-bold bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">
              TakeMeTo75
            </span>
          </div>
          {userAirport && (
            <div className="text-sm text-zinc-400">
              Flying from <span className="text-white font-medium">{userAirport.code}</span>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-24 pb-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            Escape to{' '}
            <span className="bg-gradient-to-r from-orange-400 via-red-500 to-pink-500 bg-clip-text text-transparent">
              75°F
            </span>
          </h1>
          <p className="text-xl text-zinc-400 mb-2">
            Leave within 72 hours. Flight + Hotel. One click.
          </p>
          {dates && (
            <p className="text-zinc-500">
              {dates.display.checkIn} → {dates.display.checkOut} • {dates.nights} nights
            </p>
          )}
        </div>
      </section>

      {/* Loading State */}
      {step === 'loading' && (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-orange-500/30 border-t-orange-500 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-zinc-400">Finding perfect weather...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="max-w-md mx-auto px-4 py-8">
          <div className="card p-6 text-center">
            <p className="text-red-400 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="btn-secondary"
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* Destinations Grid */}
      {step === 'destinations' && destinations.length > 0 && (
        <section className="px-4 pb-20">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl font-bold mb-6 text-center">
              Where the weather is perfect
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {destinations.map((dest, i) => (
                <DestinationCard
                  key={dest.city}
                  destination={dest}
                  onClick={() => handleDestinationSelect(dest)}
                  delay={i * 100}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Package Selection */}
      {step === 'packages' && selectedDestination && (
        <section className="px-4 pb-20">
          <div className="max-w-4xl mx-auto">
            {/* Back button */}
            <button
              onClick={() => setStep('destinations')}
              className="flex items-center gap-2 text-zinc-400 hover:text-white mb-6 transition-colors"
            >
              <span>←</span>
              <span>Back to destinations</span>
            </button>

            {/* Destination Header */}
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-2">
                {selectedDestination.city}, {selectedDestination.country}
              </h2>
              <p className="text-zinc-400 max-w-lg mx-auto">
                {selectedDestination.blurb}
              </p>
              <div className="temp-display mt-4 mx-auto w-fit">
                {selectedDestination.weather.avgTemp}°F • {selectedDestination.weather.condition}
              </div>
            </div>

            {/* Tier Selector */}
            <div className="flex justify-center gap-2 mb-8">
              {(['base', 'premium', 'luxe'] as Tier[]).map((tier) => (
                <button
                  key={tier}
                  onClick={() => setSelectedTier(tier)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    selectedTier === tier
                      ? `tier-${tier}`
                      : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                  }`}
                >
                  {TIER_CONFIG[tier].name}
                </button>
              ))}
            </div>

            {/* Loading */}
            {isSearching && (
              <div className="card p-12 text-center">
                <div className="w-10 h-10 border-4 border-orange-500/30 border-t-orange-500 rounded-full animate-spin mx-auto mb-4" />
                <p className="text-zinc-400">Finding best {selectedTier} options...</p>
              </div>
            )}

            {/* Package Card */}
            {!isSearching && packages[selectedTier] && (
              <PackageCard
                pkg={packages[selectedTier]!}
                onBook={() => handleBook(packages[selectedTier]!)}
              />
            )}

            {/* No Results */}
            {!isSearching && !packages[selectedTier] && (
              <div className="card p-8 text-center">
                <p className="text-zinc-400 mb-4">
                  No {selectedTier} packages available for this destination.
                </p>
                <button
                  onClick={() => setStep('destinations')}
                  className="btn-secondary"
                >
                  Try another destination
                </button>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="border-t border-zinc-800 py-8 px-4 mt-auto">
        <div className="max-w-6xl mx-auto text-center text-zinc-500 text-sm">
          <p>Flights via Duffel • Hotels via Booking.com</p>
          <p className="mt-2">1-hour free cancellation on all bookings</p>
        </div>
      </footer>
    </main>
  );
}

// ===========================================
// DESTINATION CARD COMPONENT
// ===========================================

function DestinationCard({
  destination,
  onClick,
  delay = 0,
}: {
  destination: Destination;
  onClick: () => void;
  delay?: number;
}) {
  return (
    <button
      onClick={onClick}
      className="card card-hover p-6 text-left w-full animate-fade-in-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-xl font-semibold">{destination.city}</h3>
          <p className="text-zinc-400 text-sm">{destination.country}</p>
        </div>
        <div className="temp-display">
          {destination.weather.avgTemp}°F
        </div>
      </div>
      <p className="text-zinc-500 text-sm line-clamp-2 mb-4">
        {destination.blurb}
      </p>
      <div className="flex items-center justify-between text-sm">
        <span className="text-zinc-500">
          {Math.round(destination.distance).toLocaleString()} mi
        </span>
        <span className="text-orange-400">
          View packages →
        </span>
      </div>
    </button>
  );
}

// ===========================================
// PACKAGE CARD COMPONENT
// ===========================================

function PackageCard({
  pkg,
  onBook,
}: {
  pkg: TripPackage;
  onBook: () => void;
}) {
  const outboundTime = formatDateTime(pkg.flight.outbound.departure.time);
  const inboundTime = formatDateTime(pkg.flight.inbound.departure.time);

  return (
    <div className="card p-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <span className={`tier-${pkg.tier} px-3 py-1 rounded-full text-sm font-medium`}>
            {TIER_CONFIG[pkg.tier].name}
          </span>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold">{formatPrice(pkg.totalPrice)}</div>
          <div className="text-zinc-500 text-sm">total for {pkg.dates.nights} nights</div>
        </div>
      </div>

      {/* Flight */}
      <div className="border-t border-zinc-800 pt-6 mb-6">
        <h4 className="text-sm font-medium text-zinc-400 mb-4">FLIGHT</h4>
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium">{pkg.flight.airline}</div>
            <div className="text-zinc-400 text-sm">{pkg.flight.cabinClass}</div>
          </div>
          <div className="text-right text-sm">
            <div className="text-zinc-400">
              {formatPrice(pkg.flight.price)}
            </div>
          </div>
        </div>
        {/* Outbound */}
        <div className="mt-4 flex items-center gap-4">
          <div className="text-center">
            <div className="font-semibold">{pkg.flight.outbound.departure.airport}</div>
            <div className="text-sm text-zinc-400">{outboundTime.time}</div>
          </div>
          <div className="flex-1 flight-path h-8" />
          <div className="text-center">
            <div className="font-semibold">{pkg.flight.outbound.arrival.airport}</div>
            <div className="text-sm text-zinc-400">
              {pkg.flight.outbound.duration}
              {pkg.flight.outbound.stops > 0 && ` • ${pkg.flight.outbound.stops} stop`}
            </div>
          </div>
        </div>
        {/* Return */}
        <div className="mt-3 flex items-center gap-4 opacity-60">
          <div className="text-center text-sm">
            <div>{pkg.flight.inbound.departure.airport}</div>
            <div className="text-zinc-500">{inboundTime.date}</div>
          </div>
          <div className="flex-1 border-t border-dashed border-zinc-700" />
          <div className="text-center text-sm">
            <div>{pkg.flight.inbound.arrival.airport}</div>
            <div className="text-zinc-500">{pkg.flight.inbound.duration}</div>
          </div>
        </div>
      </div>

      {/* Hotel */}
      <div className="border-t border-zinc-800 pt-6 mb-6">
        <h4 className="text-sm font-medium text-zinc-400 mb-4">HOTEL</h4>
        <div className="flex items-start gap-4">
          {pkg.hotel.photos[0] && (
            <img
              src={pkg.hotel.photos[0]}
              alt={pkg.hotel.name}
              className="w-24 h-24 object-cover rounded-lg"
            />
          )}
          <div className="flex-1">
            <div className="font-medium">{pkg.hotel.name}</div>
            <div className="text-zinc-400 text-sm flex items-center gap-2 mt-1">
              <span>{'★'.repeat(pkg.hotel.starRating)}</span>
              <span>•</span>
              <span>{(pkg.hotel.reviewScore / 10).toFixed(1)} rating</span>
            </div>
            <div className="text-zinc-500 text-sm mt-1">{pkg.hotel.roomType}</div>
            <div className="flex flex-wrap gap-2 mt-2">
              {pkg.hotel.freeCancellation && (
                <span className="text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded">
                  Free cancellation
                </span>
              )}
              {pkg.hotel.breakfastIncluded && (
                <span className="text-xs px-2 py-1 bg-blue-500/20 text-blue-400 rounded">
                  Breakfast included
                </span>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className="text-zinc-400 text-sm">
              {formatPrice(pkg.hotel.price)}
            </div>
          </div>
        </div>
      </div>

      {/* AI Reasoning */}
      {pkg.aiReasoning && (
        <div className="bg-zinc-800/50 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-2">
            <span className="text-orange-400">✨</span>
            <p className="text-sm text-zinc-300">{pkg.aiReasoning}</p>
          </div>
        </div>
      )}

      {/* Book Button */}
      <button onClick={onBook} className="btn-primary w-full text-lg">
        Book for {formatPrice(pkg.totalPrice)}
      </button>

      {/* Refund notice */}
      <p className="text-center text-zinc-500 text-sm mt-4">
        Free cancellation for 1 hour after booking
      </p>
    </div>
  );
}
