import { NextResponse } from 'next/server';
import { destinations } from '@/lib/destination-catalog';
import { searchFlights } from '@/lib/duffel';
import { searchHotels } from '@/lib/hotels';
import { selectBestPackage } from '@/lib/claude-selector';
import { Tier, FlightOffer, HotelOffer } from '@/lib/types';

// Filter flights based on tier requirements (mostly sorting now since search returns correct cabin)
function filterFlightsByTier(flights: FlightOffer[], tier: Tier): FlightOffer[] {
  switch (tier) {
    case 'luxe':
      // Luxe: Prefer nonstop
      return [...flights].sort((a, b) => a.stops - b.stops);
    
    case 'premium':
      // Premium: Prefer nonstop, then by price
      return [...flights].sort((a, b) => (a.stops - b.stops) * 1000 + a.price - b.price);
    
    case 'base':
    default:
      // Base: Sort by price
      return [...flights].sort((a, b) => a.price - b.price);
  }
}

// Filter hotels based on tier requirements
function filterHotelsByTier(hotels: HotelOffer[], tier: Tier): HotelOffer[] {
  switch (tier) {
    case 'luxe':
      // Luxe: Only 5-star, prefer luxury brands
      const luxuryHotels = hotels.filter(h => h.starRating >= 5 || h.isLuxuryBrand);
      return luxuryHotels.length > 0 ? luxuryHotels : hotels.filter(h => h.starRating >= 4);
    
    case 'premium':
      // Premium: 4-star and above
      return hotels.filter(h => h.starRating >= 4);
    
    case 'base':
    default:
      // Base: All hotels, sorted by price
      return hotels.sort((a, b) => a.totalPrice - b.totalPrice);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { destinationId, tier, nights = 3, origin = 'SFO' } = body as { destinationId: string; tier: Tier; nights?: number; origin?: string };

    // Find destination
    const destination = destinations.find(d => d.id === destinationId);
    if (!destination) {
      return NextResponse.json({ error: 'Destination not found' }, { status: 400 });
    }

    // Calculate dates: leaving within 72hrs, variable nights
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const departureDate = tomorrow.toISOString().split('T')[0];
    
    const returnDay = new Date(tomorrow);
    returnDay.setDate(returnDay.getDate() + nights);
    const returnDate = returnDay.toISOString().split('T')[0];

    // Search flights and hotels in parallel
    const [allFlights, allHotels] = await Promise.all([
      searchFlights(origin, destination.airportCode, departureDate, returnDate, 1, tier),
      searchHotels(destination.lat, destination.lon, departureDate, returnDate, tier),
    ]);

    if (allFlights.length === 0 || allHotels.length === 0) {
      return NextResponse.json({ error: 'No availability found' }, { status: 404 });
    }

    // Filter flights and hotels by tier
    const flights = filterFlightsByTier(allFlights, tier);
    const hotels = filterHotelsByTier(allHotels, tier);

    // Use Claude AI to select the best combination for this tier
    const claudeSelection = await selectBestPackage(flights, hotels, tier, destination);

    // Find the selected flight and hotel
    const selectedFlight = flights.find(f => f.id === claudeSelection.flightId) || flights[0];
    const selectedHotel = hotels.find(h => h.id === claudeSelection.hotelId) || hotels[0];

    const totalPrice = Math.round(selectedFlight.price + selectedHotel.totalPrice);

    return NextResponse.json({
      flight: selectedFlight,
      hotel: selectedHotel,
      totalPrice,
      aiReasoning: claudeSelection.reasoning,
      departureDate,
      returnDate,
    });
  } catch (error) {
    console.error('Package search error:', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
