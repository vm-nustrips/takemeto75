import Anthropic from '@anthropic-ai/sdk';
import { FlightOffer, HotelOffer, Tier, ClaudeSelection, Destination } from './types';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function selectBestPackage(
  flights: FlightOffer[],
  hotels: HotelOffer[],
  tier: Tier,
  destination: Destination
): Promise<ClaudeSelection> {
  
  const tierInstructions = getTierInstructions(tier, destination);
  
  const prompt = `You are a travel concierge AI selecting the best flight + hotel combination for a customer.

TIER: ${tier.toUpperCase()}
DESTINATION: ${destination.city}, ${destination.country}
COST OF LIVING AT DESTINATION: ${destination.costOfLiving}

${tierInstructions}

AVAILABLE FLIGHTS:
${flights.map((f, i) => `
[${i}] ${f.airline} - ${f.cabin}
    Price: $${f.price}
    Stops: ${f.stops === 0 ? 'Nonstop' : f.stops + ' stop(s)'}
    Duration: ${f.duration}
    Departs: ${f.departureTime}
`).join('\n')}

AVAILABLE HOTELS:
${hotels.map((h, i) => `
[${i}] ${h.name} - ${h.starRating}★
    Review Score: ${h.reviewScore}/100
    Total Price: $${h.totalPrice} ($${h.pricePerNight}/night)
    Room: ${h.roomType}
    Free Cancellation: ${h.freeCancellation ? 'Yes' : 'No'}
    Breakfast Included: ${h.breakfastIncluded ? 'Yes' : 'No'}
    Luxury Brand: ${h.isLuxuryBrand ? 'Yes' : 'No'}
`).join('\n')}

Select the best flight and hotel combination for this ${tier} tier customer.
Respond with ONLY valid JSON in this exact format:
{
  "flightIndex": <number>,
  "hotelIndex": <number>,
  "reasoning": "<2-3 sentence explanation of why this combo is best for this tier>"
}`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type');
    }

    // Parse Claude's JSON response
    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const selection = JSON.parse(jsonMatch[0]);
    
    return {
      flightId: flights[selection.flightIndex]?.id || flights[0].id,
      hotelId: hotels[selection.hotelIndex]?.id || hotels[0].id,
      reasoning: selection.reasoning || 'Selected best value combination.',
    };
  } catch (error) {
    console.error('Claude selection error:', error);
    // Fallback to simple selection if Claude fails
    return fallbackSelection(flights, hotels, tier);
  }
}

function getTierInstructions(tier: Tier, destination: Destination): string {
  switch (tier) {
    case 'base':
      return `BASE TIER OPTIMIZATION:
- Primary goal: MINIMIZE TOTAL COST
- Consider destination cost of living (${destination.costOfLiving}) - lower is better for base tier
- Acceptable: 1-2 stops, economy class, 3-star hotels
- Prioritize: Cheapest flights, budget-friendly hotels with good reviews (80+)
- Target total: Under $800 if possible`;

    case 'premium':
      return `PREMIUM TIER OPTIMIZATION:
- Primary goal: BEST VALUE (comfort vs cost balance)
- Look for: Good deals on premium economy or business class
- Prefer: Nonstop or 1-stop flights, 4-star hotels
- Sweet spot: Quality airlines, hotels with 85+ reviews
- A slight premium for significantly better comfort is worth it
- Target total: $800-1,500`;

    case 'luxe':
      return `LUXE TIER OPTIMIZATION:
- Primary goal: MAXIMIZE COMFORT AND EXPERIENCE
- Strongly prefer: Business class, nonstop flights
- Hotels: MUST be 5-star, prefer luxury brands (Four Seasons, Ritz-Carlton, Park Hyatt, etc.)
- isLuxuryBrand: true hotels should be heavily weighted
- Price is secondary to experience quality
- Target: The best possible trip, typically $1,500+`;

    default:
      return '';
  }
}

function fallbackSelection(
  flights: FlightOffer[],
  hotels: HotelOffer[],
  tier: Tier
): ClaudeSelection {
  let flight: FlightOffer;
  let hotel: HotelOffer;
  let reasoning: string;

  switch (tier) {
    case 'base':
      flight = [...flights].sort((a, b) => a.price - b.price)[0];
      hotel = [...hotels].sort((a, b) => a.totalPrice - b.totalPrice)[0];
      reasoning = 'Selected the most affordable flight and hotel combination to maximize savings.';
      break;

    case 'premium':
      // Best value: prefer nonstop, 4-star
      flight = [...flights]
        .sort((a, b) => (a.stops - b.stops) * 100 + a.price - b.price)[0];
      hotel = [...hotels]
        .filter(h => h.starRating >= 4)
        .sort((a, b) => b.reviewScore - a.reviewScore)[0] || hotels[0];
      reasoning = 'Selected a comfortable flight with minimal stops and a highly-rated 4-star hotel.';
      break;

    case 'luxe':
      // Best experience: nonstop + luxury brand
      flight = [...flights]
        .filter(f => f.cabin.includes('Business') || f.stops === 0)
        .sort((a, b) => a.stops - b.stops)[0] || flights[0];
      hotel = [...hotels]
        .filter(h => h.isLuxuryBrand)
        .sort((a, b) => b.reviewScore - a.reviewScore)[0] || 
        [...hotels].sort((a, b) => b.reviewScore - a.reviewScore)[0];
      reasoning = 'Selected premium flight and luxury hotel for the ultimate travel experience.';
      break;

    default:
      flight = flights[0];
      hotel = hotels[0];
      reasoning = 'Default selection.';
  }

  return {
    flightId: flight.id,
    hotelId: hotel.id,
    reasoning,
  };
}
