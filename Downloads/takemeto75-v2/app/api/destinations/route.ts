import { NextRequest, NextResponse } from 'next/server';
import { DESTINATIONS, US_AIRPORTS, findNearestAirport, calculateDistance } from '@/lib/destinations';
import { getWeatherForecast } from '@/lib/weather';
import { getTravelDates } from '@/lib/utils';
import { Destination, DestinationsResponse } from '@/lib/types';

export const runtime = 'edge';

/**
 * GET /api/destinations
 * 
 * Query params:
 * - lat: User latitude
 * - lon: User longitude
 * - airport: Airport code (optional, overrides lat/lon)
 * 
 * Returns destinations with 75°F weather, sorted by distance
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  
  // Get user location
  const lat = parseFloat(searchParams.get('lat') || '40.7128');
  const lon = parseFloat(searchParams.get('lon') || '-74.0060');
  const airportCode = searchParams.get('airport');

  // Find nearest airport
  let userAirport;
  if (airportCode) {
    userAirport = US_AIRPORTS.find(a => a.code === airportCode) || findNearestAirport(lat, lon);
  } else {
    userAirport = findNearestAirport(lat, lon);
  }

  // Get travel dates
  const dates = getTravelDates();

  // Get weather for all destinations and filter
  const destinationsWithWeather: Destination[] = [];

  // Process destinations in parallel
  const weatherPromises = DESTINATIONS.map(async (dest) => {
    const weather = await getWeatherForecast(dest.lat, dest.lon);
    const distance = calculateDistance(
      userAirport.lat,
      userAirport.lon,
      dest.lat,
      dest.lon
    );

    return {
      ...dest,
      weather,
      distance,
    };
  });

  const results = await Promise.all(weatherPromises);

  // Filter for 75° destinations (69-78°F range, sunny)
  const filtered = results.filter(
    (dest) => dest.weather.isInRange && dest.weather.isSunny
  );

  // Sort by distance
  const sorted = filtered.sort((a, b) => a.distance - b.distance);

  // Take top 10 closest
  const topDestinations = sorted.slice(0, 10);

  const response: DestinationsResponse = {
    destinations: topDestinations,
    userAirport,
    dates,
  };

  return NextResponse.json(response);
}

/**
 * POST /api/destinations
 * 
 * Same as GET but accepts body for more options
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { lat, lon, airport, maxDistance, limit = 10 } = body;

    // Find user airport
    let userAirport;
    if (airport) {
      userAirport = US_AIRPORTS.find(a => a.code === airport) || findNearestAirport(lat, lon);
    } else {
      userAirport = findNearestAirport(lat || 40.7128, lon || -74.0060);
    }

    const dates = getTravelDates();

    // Get weather for all destinations
    const weatherPromises = DESTINATIONS.map(async (dest) => {
      const weather = await getWeatherForecast(dest.lat, dest.lon);
      const distance = calculateDistance(
        userAirport.lat,
        userAirport.lon,
        dest.lat,
        dest.lon
      );

      return {
        ...dest,
        weather,
        distance,
      };
    });

    const results = await Promise.all(weatherPromises);

    // Filter by weather and optional max distance
    let filtered = results.filter(
      (dest) => dest.weather.isInRange && dest.weather.isSunny
    );

    if (maxDistance) {
      filtered = filtered.filter((dest) => dest.distance <= maxDistance);
    }

    // Sort by distance and limit
    const sorted = filtered.sort((a, b) => a.distance - b.distance);
    const topDestinations = sorted.slice(0, limit);

    const response: DestinationsResponse = {
      destinations: topDestinations,
      userAirport,
      dates,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Destinations API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch destinations' },
      { status: 500 }
    );
  }
}
