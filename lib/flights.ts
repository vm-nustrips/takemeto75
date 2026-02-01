import Anthropic from '@anthropic-ai/sdk';
import { Duffel } from '@duffel/api';
import { FlightOffer, Tier } from './types';
import { webSearch } from './web-search';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const duffel = new Duffel({
  token: (process.env.DUFFEL_API_TOKEN || '').replace(/\\n/g, '').replace(/\n/g, '').trim(),
});

// Parse ISO 8601 duration (PT3H53M) to readable format
function parseDuration(isoDuration: string): string {
  const match = isoDuration.match(/P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?/);
  if (!match) return isoDuration;

  const days = parseInt(match[1] || '0');
  const hours = parseInt(match[2] || '0');
  const minutes = parseInt(match[3] || '0');

  const totalHours = days * 24 + hours;
  return `${totalHours}h ${minutes}m`;
}

async function searchDuffel(
  origin: string,
  destination: string,
  departureDate: string,
  returnDate: string,
  cabinClass: 'first' | 'business' | 'premium_economy' | 'economy'
) {
  const response = await duffel.offerRequests.create({
    slices: [
      { origin, destination, departure_date: departureDate, arrival_time: null, departure_time: null },
      { origin: destination, destination: origin, departure_date: returnDate, arrival_time: null, departure_time: null },
    ],
    passengers: [{ type: 'adult' }],
    cabin_class: cabinClass,
  });
  return response.data.offers || [];
}

export async function searchFlights(
  origin: string,
  destination: string,
  departureDate: string,
  returnDate: string,
  passengers: number = 1,
  tier: Tier = 'base'
): Promise<FlightOffer[]> {
  const cabinLabel = tier === 'luxe' ? 'business/first class' :
                     tier === 'premium' ? 'premium economy' : 'economy';

  console.log(`[Flights] Duffel search: ${origin} → ${destination} ${cabinLabel}`);

  try {
    let offers: Awaited<ReturnType<typeof searchDuffel>> = [];
    let actualCabin = 'business';

    // Filter out fake/test airlines from Duffel
    const filterFakeAirlines = (offerList: typeof offers) =>
      offerList.filter(o => {
        const airline = o.slices[0]?.segments[0]?.marketing_carrier?.name || '';
        return !airline.toLowerCase().includes('duffel');
      });

    if (tier === 'luxe') {
      // Search BOTH business and first, merge results
      console.log('[Flights] Searching business + first class...');
      const [businessOffers, firstOffers] = await Promise.all([
        searchDuffel(origin, destination, departureDate, returnDate, 'business'),
        searchDuffel(origin, destination, departureDate, returnDate, 'first'),
      ]);

      // Filter out fake airlines and combine
      const realBusiness = filterFakeAirlines(businessOffers);
      const realFirst = filterFakeAirlines(firstOffers);

      console.log(`[Flights] Found ${realBusiness.length} business, ${realFirst.length} first class`);

      // Prefer first class direct flights (like Alaska), then business
      offers = [...realFirst, ...realBusiness];
      actualCabin = realFirst.length > 0 ? 'first' : 'business';
    } else if (tier === 'premium') {
      offers = filterFakeAirlines(await searchDuffel(origin, destination, departureDate, returnDate, 'premium_economy'));
      actualCabin = 'premium_economy';
    } else {
      offers = filterFakeAirlines(await searchDuffel(origin, destination, departureDate, returnDate, 'economy'));
      actualCabin = 'economy';
    }

    if (offers.length === 0) {
      console.log('[Flights] No Duffel offers found');
      throw new Error('No flights found');
    }

    // 2. Extract unique flight options (dedupe by airline + stops)
    const seen = new Set<string>();
    const uniqueFlights = offers.filter(offer => {
      const outbound = offer.slices[0];
      const airline = outbound.segments[0].marketing_carrier.name;
      const stops = outbound.segments.length - 1;
      const key = `${airline}-${stops}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).slice(0, 6);

    // 3. Web search for realistic pricing
    const query = `${origin} to ${destination} ${cabinLabel} flights price`;
    console.log(`[Flights] Price search: ${query}`);
    const priceContext = await webSearch(query);

    // 4. Format Duffel data for Claude
    const flightData = uniqueFlights.map((offer, i) => {
      const outbound = offer.slices[0];
      const airline = outbound.segments[0].marketing_carrier.name;
      const stops = outbound.segments.length - 1;
      const duration = outbound.duration ? parseDuration(outbound.duration) : 'N/A';
      const depTime = outbound.segments[0].departing_at.split('T')[1].slice(0, 5);
      return `[${i}] ${airline} | ${stops} stop(s) | ${duration} | departs ${depTime}`;
    }).join('\n');

    // 5. Claude estimates realistic price
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      messages: [{
        role: 'user',
        content: `Estimate realistic round-trip prices for these flights.

ROUTE: ${origin} → ${destination} (round trip)
CABIN: ${cabinLabel}
TIER: ${tier}

AVAILABLE FLIGHTS FROM DUFFEL:
${flightData}

${priceContext ? `PRICE CONTEXT FROM WEB:\n"""\n${priceContext.slice(0, 3000)}\n"""` : ''}

For each flight, estimate a realistic current market price based on:
- Route distance and demand
- Cabin class (${cabinLabel})
- Typical pricing for this airline
- Web search context if available

Return ONLY a JSON array with price estimates:
[{"index": 0, "price": 850}, {"index": 1, "price": 1200}]

Be realistic - don't inflate prices. Use web search data if available.`
      }],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type');
    }

    const jsonMatch = content.text.match(/\[[\s\S]*\]/);
    const priceEstimates: { index: number; price: number }[] = jsonMatch
      ? JSON.parse(jsonMatch[0])
      : uniqueFlights.map((_, i) => ({ index: i, price: 500 }));

    // 6. Combine Duffel route data with Claude price estimates
    return uniqueFlights.map((offer, i) => {
      const outbound = offer.slices[0];
      const airline = outbound.segments[0].marketing_carrier.name;
      const stops = outbound.segments.length - 1;
      const duration = outbound.duration ? parseDuration(outbound.duration) : 'N/A';
      const depTime = outbound.segments[0].departing_at.split('T')[1].slice(0, 5);
      const estimate = priceEstimates.find(p => p.index === i);
      const price = estimate?.price || 500;

      return {
        id: `flight_${i}_${Date.now()}`,
        airline,
        departureTime: `${departureDate}T${depTime}:00`,
        arrivalTime: outbound.segments[outbound.segments.length - 1].arriving_at,
        duration,
        stops,
        price,
        currency: 'USD',
        cabin: actualCabin === 'first' ? 'first class' : actualCabin === 'business' ? 'business class' : actualCabin === 'premium_economy' ? 'premium economy' : 'economy',
      };
    });

  } catch (error) {
    console.error('[Flights] Duffel error:', error);

    // Fallback to pure Claude if Duffel fails
    console.log('[Flights] Falling back to Claude-only search');
    return searchFlightsWithClaude(origin, destination, departureDate, returnDate, tier);
  }
}

// Fallback function using only Claude
async function searchFlightsWithClaude(
  origin: string,
  destination: string,
  departureDate: string,
  returnDate: string,
  tier: Tier
): Promise<FlightOffer[]> {
  const cabinLabel = tier === 'luxe' ? 'business class' :
                     tier === 'premium' ? 'premium economy' : 'economy';

  const query = `${origin} to ${destination} ${cabinLabel} flights price`;
  const searchResults = await webSearch(query);

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1500,
    messages: [{
      role: 'user',
      content: `Find realistic flight options for ${origin} → ${destination} ${cabinLabel}.

${searchResults ? `WEB SEARCH:\n"""\n${searchResults.slice(0, 4000)}\n"""` : ''}

Return ONLY JSON array with 2-3 options:
[{"airline": "United", "cabin": "${cabinLabel}", "price": 650, "duration": "6h 30m", "stops": 1, "departureTime": "09:00"}]

Be conservative and realistic.`
    }],
  });

  const content = response.content[0];
  if (content.type !== 'text') throw new Error('Unexpected response type');

  const jsonMatch = content.text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error('No flight data found');

  const extracted = JSON.parse(jsonMatch[0]);

  return extracted.map((f: {
    airline: string;
    cabin: string;
    price: number;
    duration: string;
    stops: number;
    departureTime: string;
  }, i: number) => ({
    id: `flight_${i}_${Date.now()}`,
    airline: f.airline,
    departureTime: `${departureDate}T${f.departureTime || '08:00'}:00`,
    arrivalTime: `${departureDate}T12:00:00`,
    duration: f.duration,
    stops: f.stops,
    price: f.price,
    currency: 'USD',
    cabin: f.cabin,
  }));
}
