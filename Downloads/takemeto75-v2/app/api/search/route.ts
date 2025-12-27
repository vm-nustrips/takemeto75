import { NextRequest, NextResponse } from 'next/server';
import { DESTINATIONS, US_AIRPORTS } from '@/lib/destinations';
import { getWeatherForecast } from '@/lib/weather';
import { searchFlights, transformDuffelOffer } from '@/lib/duffel';
import { searchHotels, transformBookingHotel } from '@/lib/booking';
import { selectBestCombination, buildTripPackage } from '@/lib/ai-selector';
import { getTravelDates } from '@/lib/utils';
import { Tier, TIER_CONFIG, SearchResponse, Destination } from '@/lib/types';

export const runtime = 'edge';
export const maxDuration = 60; // Allow up to 60s for API calls

interface SearchRequestBody {
  originAirport: string;
  destinationCity: string;
  tiers?: Tier[];
}

/**
 * POST /api/search
 * 
 * Search for flights and hotels for a destination
 * Returns best options for each requested tier
 */
export async function POST(request: NextRequest) {
  try {
    const body: SearchRequestBody = await request.json();
    const { originAirport, destinationCity, tiers = ['base', 'premium', 'luxe'] } = body;

    // Validate origin airport
    const origin = US_AIRPORTS.find(a => a.code === originAirport);
    if (!origin) {
      return NextResponse.json(
        { error: 'Invalid origin airport' },
        { status: 400 }
      );
    }

    // Find destination
    const destData = DESTINATIONS.find(
      d => d.city.toLowerCase() === destinationCity.toLowerCase()
    );
    if (!destData) {
      return NextResponse.json(
        { error: 'Destination not found' },
        { status: 404 }
      );
    }

    // Get travel dates and weather
    const dates = getTravelDates();
    const weather = await getWeatherForecast(destData.lat, destData.lon);

    // Build destination object
    const destination: Destination = {
      city: destData.city,
      country: destData.country,
      airport: destData.airport,
      lat: destData.lat,
      lon: destData.lon,
      region: destData.region,
      weather,
      distance: 0, // Not needed here
      blurb: destData.blurb,
    };

    // Search flights and hotels for each tier in parallel
    const packages: SearchResponse['packages'] = {};

    await Promise.all(
      tiers.map(async (tier) => {
        const config = TIER_CONFIG[tier];

        // Search flights
        const flightOffers = await searchFlights({
          origin: originAirport,
          destination: destData.airport,
          departureDate: dates.checkIn,
          returnDate: dates.checkOut,
          passengers: 1,
          cabinClass: config.cabinClass,
        });

        // Transform flight offers
        const flights = flightOffers.map(offer => 
          transformDuffelOffer(offer, tier)
        );

        // Search hotels
        const hotelResults = await searchHotels(
          {
            city: destData.city,
            checkIn: dates.checkIn,
            checkOut: dates.checkOut,
            guests: 2,
            rooms: 1,
            starRating: config.hotelStars,
            minReviewScore: 80,
          },
          destData.lat,
          destData.lon
        );

        // Transform hotel offers
        const hotels = hotelResults
          .map(transformBookingHotel)
          .filter((h): h is NonNullable<typeof h> => h !== null);

        if (flights.length === 0 || hotels.length === 0) {
          console.log(`No ${tier} options found for ${destData.city}`);
          return;
        }

        // Use AI to select best combination
        const selection = await selectBestCombination({
          destination,
          dates,
          tier,
          flights,
          hotels,
        });

        if (selection) {
          packages[tier] = buildTripPackage(
            destination,
            dates,
            tier,
            selection.flight,
            selection.hotel,
            selection.reasoning
          );
        }
      })
    );

    const response: SearchResponse = {
      packages,
      destination,
      dates,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json(
      { error: 'Search failed', details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * GET /api/search
 * 
 * Quick search with query params
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const origin = searchParams.get('origin');
  const destination = searchParams.get('destination');
  const tier = searchParams.get('tier') as Tier | null;

  if (!origin || !destination) {
    return NextResponse.json(
      { error: 'origin and destination required' },
      { status: 400 }
    );
  }

  // Delegate to POST handler
  const body: SearchRequestBody = {
    originAirport: origin,
    destinationCity: destination,
    tiers: tier ? [tier] : undefined,
  };

  // Create a fake request with body
  const fakeRequest = new Request(request.url, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });

  return POST(fakeRequest as NextRequest);
}
