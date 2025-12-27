import Anthropic from '@anthropic-ai/sdk';
import { FlightOffer, HotelOffer, Tier, TripPackage, Destination, TravelDates } from './types';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

interface SelectionInput {
  destination: Destination;
  dates: TravelDates;
  tier: Tier;
  flights: FlightOffer[];
  hotels: HotelOffer[];
}

interface SelectionResult {
  flight: FlightOffer;
  hotel: HotelOffer;
  reasoning: string;
}

/**
 * Use Claude to select the best flight + hotel combination for a tier
 */
export async function selectBestCombination(
  input: SelectionInput
): Promise<SelectionResult | null> {
  if (!process.env.ANTHROPIC_API_KEY || input.flights.length === 0 || input.hotels.length === 0) {
    // Fallback to simple selection without AI
    return fallbackSelection(input);
  }

  const tierCriteria = getTierCriteria(input.tier);

  const prompt = `You are a travel advisor AI helping select the best flight and hotel combination for a ${input.tier.toUpperCase()} tier trip.

DESTINATION: ${input.destination.city}, ${input.destination.country}
DATES: ${input.dates.display.checkIn} to ${input.dates.display.checkOut} (${input.dates.nights} nights)
WEATHER: ${input.destination.weather.avgTemp}°F, ${input.destination.weather.condition}

TIER CRITERIA FOR ${input.tier.toUpperCase()}:
${tierCriteria}

AVAILABLE FLIGHTS:
${input.flights.map((f, i) => `
[Flight ${i + 1}] ID: ${f.id}
- Airline: ${f.airline}
- Price: $${f.price} ${f.currency}
- Outbound: ${f.outbound.departure.airport} → ${f.outbound.arrival.airport}, ${f.outbound.duration}, ${f.outbound.stops} stops
- Return: ${f.inbound.departure.airport} → ${f.inbound.arrival.airport}, ${f.inbound.duration}, ${f.inbound.stops} stops
- Class: ${f.cabinClass}
- Baggage: ${f.baggageIncluded ? 'Included' : 'Not included'}
- Refundable: ${f.refundable ? 'Yes' : 'No'}
`).join('\n')}

AVAILABLE HOTELS:
${input.hotels.map((h, i) => `
[Hotel ${i + 1}] ID: ${h.id}
- Name: ${h.name}
- Stars: ${h.starRating}
- Review Score: ${h.reviewScore}/100 (${h.reviewCount} reviews)
- Price: $${h.price} ${h.currency} total
- Room: ${h.roomType}
- Location: ${h.distanceFromCenter}
- Free Cancellation: ${h.freeCancellation ? 'Yes' : 'No'}
- Breakfast: ${h.breakfastIncluded ? 'Included' : 'Not included'}
- Amenities: ${h.amenities.slice(0, 5).join(', ')}
`).join('\n')}

Based on the ${input.tier.toUpperCase()} tier criteria, select the BEST flight and hotel combination.

Respond in this exact JSON format:
{
  "selected_flight_id": "<flight id>",
  "selected_hotel_id": "<hotel id>",
  "reasoning": "<2-3 sentences explaining why this is the best combination for this tier>"
}`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      return fallbackSelection(input);
    }

    // Parse JSON from response
    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return fallbackSelection(input);
    }

    const selection = JSON.parse(jsonMatch[0]);

    const selectedFlight = input.flights.find(
      (f) => f.id === selection.selected_flight_id
    );
    const selectedHotel = input.hotels.find(
      (h) => h.id === selection.selected_hotel_id
    );

    if (!selectedFlight || !selectedHotel) {
      return fallbackSelection(input);
    }

    return {
      flight: selectedFlight,
      hotel: selectedHotel,
      reasoning: selection.reasoning,
    };
  } catch (error) {
    console.error('Claude selection error:', error);
    return fallbackSelection(input);
  }
}

/**
 * Get tier-specific selection criteria
 */
function getTierCriteria(tier: Tier): string {
  switch (tier) {
    case 'base':
      return `- PRIMARY: Minimize total cost
- Consider destination cost of living (cheaper destinations = better value)
- Economy flights are fine, prefer direct when price is similar
- 3-star hotels with 8.0+ reviews
- Value-focused: best bang for buck`;

    case 'premium':
      return `- PRIMARY: Balance comfort and cost
- Premium economy flights if reasonably priced, otherwise best economy
- Prefer direct flights or single stop
- 4-star hotels with excellent reviews (8.5+)
- Good amenities matter (free cancellation, breakfast, good location)
- Look for "sweet spot" - great quality without luxury pricing`;

    case 'luxe':
      return `- PRIMARY: Best possible experience
- Business class flights strongly preferred
- Direct flights, convenient departure times
- 5-star hotels, prioritize top review scores (9.0+)
- Prefer recognized luxury brands (Four Seasons, Ritz-Carlton, etc.)
- Location and amenities are critical
- Price is secondary to quality`;

    default:
      return '';
  }
}

/**
 * Fallback selection when Claude API is unavailable
 */
function fallbackSelection(input: SelectionInput): SelectionResult | null {
  if (input.flights.length === 0 || input.hotels.length === 0) {
    return null;
  }

  let selectedFlight: FlightOffer;
  let selectedHotel: HotelOffer;
  let reasoning: string;

  switch (input.tier) {
    case 'base':
      // Cheapest flight
      selectedFlight = [...input.flights].sort((a, b) => a.price - b.price)[0];
      // Cheapest hotel with good reviews
      selectedHotel = [...input.hotels]
        .filter((h) => h.reviewScore >= 80)
        .sort((a, b) => a.price - b.price)[0] || input.hotels[0];
      reasoning = `Selected the most affordable options while maintaining quality (8.0+ hotel reviews). Great value for ${input.destination.city}.`;
      break;

    case 'premium':
      // Best value flight (considering stops)
      selectedFlight = [...input.flights].sort((a, b) => {
        const aScore = a.price * (1 + a.outbound.stops * 0.1);
        const bScore = b.price * (1 + b.outbound.stops * 0.1);
        return aScore - bScore;
      })[0];
      // Best value hotel (review/price ratio)
      selectedHotel = [...input.hotels].sort((a, b) => {
        const aScore = a.reviewScore / (a.price / 100);
        const bScore = b.reviewScore / (b.price / 100);
        return bScore - aScore;
      })[0];
      reasoning = `Balanced quality and cost for premium experience. ${selectedHotel.name} offers excellent reviews at a fair price.`;
      break;

    case 'luxe':
      // Best flight (fewest stops, then price)
      selectedFlight = [...input.flights].sort((a, b) => {
        if (a.outbound.stops !== b.outbound.stops) {
          return a.outbound.stops - b.outbound.stops;
        }
        return a.price - b.price;
      })[0];
      // Highest rated hotel
      selectedHotel = [...input.hotels].sort(
        (a, b) => b.reviewScore - a.reviewScore
      )[0];
      reasoning = `Selected top-tier options for a luxurious experience. ${selectedHotel.name} is the highest-rated property available.`;
      break;

    default:
      selectedFlight = input.flights[0];
      selectedHotel = input.hotels[0];
      reasoning = 'Selected available options.';
  }

  return {
    flight: selectedFlight,
    hotel: selectedHotel,
    reasoning,
  };
}

/**
 * Build a complete trip package
 */
export function buildTripPackage(
  destination: Destination,
  dates: TravelDates,
  tier: Tier,
  flight: FlightOffer,
  hotel: HotelOffer,
  reasoning: string
): TripPackage {
  const markup = tier === 'base' ? 25 : tier === 'premium' ? 40 : 75;
  
  return {
    id: `pkg_${Date.now()}_${tier}`,
    tier,
    destination,
    dates,
    flight,
    hotel,
    totalPrice: Math.round((flight.price + hotel.price + markup) * 100) / 100,
    currency: 'USD',
    breakdown: {
      flight: flight.price,
      hotel: hotel.price,
      markup,
    },
    aiReasoning: reasoning,
  };
}
