import Anthropic from '@anthropic-ai/sdk';
import { FlightOffer, HotelOffer, Tier, ClaudeSelection, Destination } from './types';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Fetch Booking.com review data via web search
async function fetchBookingReviews(
  hotelName: string,
  city: string
): Promise<{ rating?: number; highlights?: string } | null> {
  try {
    // Use DuckDuckGo HTML search (no API key needed)
    const query = encodeURIComponent(`${hotelName} ${city} booking.com rating reviews`);
    const response = await fetch(`https://html.duckduckgo.com/html/?q=${query}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; TakeMeTo75/1.0)',
      },
    });

    if (!response.ok) return null;

    const html = await response.text();

    // Try to extract Booking.com rating from search snippets
    // Pattern: "9.2" or "8.5/10" or "Rated 9.0"
    const ratingMatch = html.match(/(?:rated?\s*)?(\d\.\d)(?:\s*\/\s*10)?/i);
    const rating = ratingMatch ? parseFloat(ratingMatch[1]) : undefined;

    // Extract review snippets mentioning the hotel
    const snippetMatch = html.match(/<a class="result__snippet"[^>]*>([^<]+)<\/a>/);
    const highlights = snippetMatch ? snippetMatch[1].slice(0, 100) : undefined;

    if (rating || highlights) {
      return { rating, highlights };
    }
    return null;
  } catch (error) {
    console.log(`Could not fetch reviews for ${hotelName}:`, error);
    return null;
  }
}

// Enrich hotels with Booking.com data (top 5 only to limit requests)
async function enrichHotelsWithReviews(
  hotels: HotelOffer[],
  city: string
): Promise<HotelOffer[]> {
  const enrichedHotels = [...hotels];
  const topHotels = enrichedHotels.slice(0, 5);

  const enrichmentPromises = topHotels.map(async (hotel, index) => {
    const reviewData = await fetchBookingReviews(hotel.name, city);
    if (reviewData) {
      enrichedHotels[index] = {
        ...hotel,
        bookingRating: reviewData.rating,
        reviewHighlights: reviewData.highlights,
        // Update reviewScore if we got a Booking.com rating
        reviewScore: reviewData.rating ? Math.round(reviewData.rating * 10) : hotel.reviewScore,
      };
    }
  });

  await Promise.all(enrichmentPromises);
  return enrichedHotels;
}

export async function selectBestPackage(
  flights: FlightOffer[],
  hotels: HotelOffer[],
  tier: Tier,
  destination: Destination
): Promise<ClaudeSelection> {
  // Enrich top hotels with Booking.com reviews
  const enrichedHotels = await enrichHotelsWithReviews(hotels, destination.city);

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
${enrichedHotels.map((h, i) => `
[${i}] ${h.name} - ${h.starRating}★
    Total Price: $${h.totalPrice} ($${h.pricePerNight}/night)
    Room: ${h.roomType}${h.boardType ? ` (${h.boardType})` : ''}
    Free Cancellation: ${h.freeCancellation ? 'Yes' : 'No'}
    Breakfast Included: ${h.breakfastIncluded ? 'Yes' : 'No'}
    Luxury Brand: ${h.isLuxuryBrand ? 'Yes' : 'No'}${h.bookingRating ? `
    Booking.com Rating: ${h.bookingRating}/10` : ''}${h.reviewHighlights ? `
    Guest Reviews: "${h.reviewHighlights}"` : ''}
`).join('\n')}

Select the best flight and hotel combination for this ${tier} tier customer.
${tier === 'luxe' ? 'For Luxe tier, prioritize hotels with Booking.com ratings >= 9.0 and luxury brands.' : ''}
${tier === 'premium' ? 'For Premium tier, look for hotels with good reviews (8.5+) that balance quality and value.' : ''}
${tier === 'base' ? 'For Base tier, prioritize value but ensure decent reviews (7.5+).' : ''}

Respond with ONLY valid JSON in this exact format:
{
  "flightIndex": <number>,
  "hotelIndex": <number>,
  "reasoning": "<2-3 sentence explanation mentioning the hotel's rating/reviews if available>"
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
      hotelId: enrichedHotels[selection.hotelIndex]?.id || enrichedHotels[0].id,
      reasoning: selection.reasoning || 'Selected best value combination.',
    };
  } catch (error) {
    console.error('Claude selection error:', error);
    // Fallback to simple selection if Claude fails
    return fallbackSelection(flights, enrichedHotels, tier);
  }
}

function getTierInstructions(tier: Tier, destination: Destination): string {
  switch (tier) {
    case 'base':
      return `BASE TIER - BUDGET GETAWAY:
- Primary goal: Best VALUE (not just cheapest price)
- SCORING: Consider price + duration + stops together
- A $100 cheaper flight with 2 extra hours travel time is NOT better
- Prefer: 0-1 stops, reasonable duration
- Acceptable: 2 stops only if SIGNIFICANTLY cheaper (>$300 savings)
- Airlines: Any carrier is fine
- Hotels: Prefer Booking.com rating >= 7.5 if available
- Pick the flight that gets them there comfortably at the best price`;

    case 'premium':
      return `PREMIUM TIER - COMFORTABLE GETAWAY:
- Primary goal: CONVENIENCE + COMFORT at reasonable price
- STRONGLY prefer NONSTOP flights - worth paying 30-40% more
- If no nonstop: prefer 1 stop with short layover
- Airlines: Prefer major carriers (Delta, United, American, British Airways, Lufthansa, Emirates, etc.)
- AVOID: Budget carriers (Spirit, Frontier, Ryanair, EasyJet, etc.)
- Hotels: Look for Booking.com rating >= 8.5, good guest reviews
- Duration matters: shorter is better
- Pick the most convenient flight even if not the absolute cheapest`;

    case 'luxe':
      return `LUXE TIER - PREMIUM EXPERIENCE:
- Primary goal: BEST POSSIBLE TRAVEL EXPERIENCE
- MUST be Business class if available - this is non-negotiable
- If no Business class: Premium Economy from a premium airline
- If neither: Best Economy from top-tier airline (no budget carriers)
- NONSTOP flights strongly preferred
- Airlines: ONLY premium carriers (Emirates, Singapore, Qatar, British Airways, Lufthansa, Delta One, United Polaris, American Flagship, etc.)
- Hotels: MUST have Booking.com rating >= 9.0 OR be a luxury brand (Four Seasons, Ritz-Carlton, Park Hyatt, etc.)
- Price is secondary - pick the best experience`;

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

  // Budget airlines to avoid for premium/luxe
  const budgetAirlines = ['spirit', 'frontier', 'ryanair', 'easyjet', 'wizz', 'allegiant', 'play', 'norse'];
  const isBudgetAirline = (airline: string) => budgetAirlines.some(b => airline.toLowerCase().includes(b));

  switch (tier) {
    case 'base':
      // Best value: score by price + stops + duration
      flight = [...flights].sort((a, b) => {
        const getDurationMins = (d: string) => {
          const match = d.match(/(\d+)h\s*(\d+)?m?/);
          return match ? parseInt(match[1]) * 60 + (parseInt(match[2]) || 0) : 999;
        };
        const aScore = a.price + (a.stops * 100) + (getDurationMins(a.duration) * 0.5);
        const bScore = b.price + (b.stops * 100) + (getDurationMins(b.duration) * 0.5);
        return aScore - bScore;
      })[0];
      // Prefer hotels with decent reviews
      hotel = [...hotels].sort((a, b) => {
        const aScore = a.totalPrice - (a.bookingRating || a.reviewScore / 10) * 50;
        const bScore = b.totalPrice - (b.bookingRating || b.reviewScore / 10) * 50;
        return aScore - bScore;
      })[0];
      reasoning = `Best value combo: ${flight.airline} ${flight.stops === 0 ? 'nonstop' : `(${flight.stops} stop)`} paired with ${hotel.name}${hotel.bookingRating ? ` (${hotel.bookingRating}/10 on Booking.com)` : ''}.`;
      break;

    case 'premium':
      // Convenience first: nonstop > 1 stop, avoid budget airlines
      const premiumFlights = flights.filter(f => !isBudgetAirline(f.airline));
      const nonstopPremium = premiumFlights.filter(f => f.stops === 0);
      const oneStopPremium = premiumFlights.filter(f => f.stops === 1);

      if (nonstopPremium.length > 0) {
        flight = nonstopPremium.sort((a, b) => a.price - b.price)[0];
      } else if (oneStopPremium.length > 0) {
        flight = oneStopPremium.sort((a, b) => a.price - b.price)[0];
      } else {
        flight = (premiumFlights.length > 0 ? premiumFlights : flights)
          .sort((a, b) => a.stops - b.stops)[0];
      }

      // Prefer 4+ star with good reviews
      hotel = [...hotels]
        .filter(h => h.starRating >= 4)
        .sort((a, b) => (b.bookingRating || b.reviewScore / 10) - (a.bookingRating || a.reviewScore / 10))[0] || hotels[0];
      reasoning = `Convenient getaway: ${flight.airline} ${flight.stops === 0 ? 'flies direct' : `with ${flight.stops}-stop`}. ${hotel.name} (${hotel.starRating}★${hotel.bookingRating ? `, ${hotel.bookingRating}/10` : ''}) offers great comfort.`;
      break;

    case 'luxe':
      // Best experience: business class if available, premium airline, nonstop
      const businessFlights = flights.filter(f =>
        f.cabin.toLowerCase().includes('business') || f.cabin.toLowerCase().includes('first')
      );
      const luxeFlights = flights.filter(f => !isBudgetAirline(f.airline));

      if (businessFlights.length > 0) {
        const nonstopBiz = businessFlights.filter(f => f.stops === 0);
        flight = nonstopBiz.length > 0
          ? nonstopBiz.sort((a, b) => a.price - b.price)[0]
          : businessFlights.sort((a, b) => a.stops - b.stops)[0];
      } else {
        const nonstopLuxe = luxeFlights.filter(f => f.stops === 0);
        flight = nonstopLuxe.length > 0
          ? nonstopLuxe.sort((a, b) => a.price - b.price)[0]
          : luxeFlights.sort((a, b) => a.stops - b.stops)[0] || flights[0];
      }

      // Prefer luxury brands or highest rated
      hotel = [...hotels]
        .filter(h => h.isLuxuryBrand || (h.bookingRating && h.bookingRating >= 9))
        .sort((a, b) => (b.bookingRating || b.reviewScore / 10) - (a.bookingRating || a.reviewScore / 10))[0] ||
        [...hotels].filter(h => h.starRating >= 5).sort((a, b) => (b.bookingRating || 0) - (a.bookingRating || 0))[0] ||
        [...hotels].sort((a, b) => b.reviewScore - a.reviewScore)[0];
      reasoning = `Luxury experience: ${flight.airline} ${flight.cabin}${flight.stops === 0 ? ' nonstop' : ''}. ${hotel.name} (${hotel.starRating}★${hotel.bookingRating ? `, ${hotel.bookingRating}/10 on Booking.com` : ''}) delivers world-class hospitality.`;
      break;

    default:
      flight = flights[0];
      hotel = hotels[0];
      reasoning = 'Selected the best available combination.';
  }

  return {
    flightId: flight.id,
    hotelId: hotel.id,
    reasoning,
  };
}
