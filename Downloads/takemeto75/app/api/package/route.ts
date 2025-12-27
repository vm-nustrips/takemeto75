import { NextResponse } from 'next/server';
import { destinations } from '@/lib/destinations';
import { searchFlights } from '@/lib/duffel';
import { searchHotels } from '@/lib/hotels';
import { selectBestPackage } from '@/lib/claude-selector';
import { Tier } from '@/lib/types';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { destinationId, tier, nights = 3 } = body as { destinationId: string; tier: Tier; nights?: number };

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

    // Default origin - would be detected from user location
    const origin = 'SFO';

    // Search flights and hotels in parallel
    const [flights, hotels] = await Promise.all([
      searchFlights(origin, destination.airportCode, departureDate, returnDate),
      searchHotels(destination.lat, destination.lon, departureDate, returnDate),
    ]);

    if (flights.length === 0 || hotels.length === 0) {
      return NextResponse.json({ error: 'No availability found' }, { status: 404 });
    }

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
      claudeReasoning: claudeSelection.reasoning,
      departureDate,
      returnDate,
    });
  } catch (error) {
    console.error('Package search error:', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
