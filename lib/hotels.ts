import Anthropic from '@anthropic-ai/sdk';
import { HotelOffer, Tier } from './types';
import { webSearch } from './web-search';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function searchHotels(
  lat: number,
  lon: number,
  checkIn: string,
  checkOut: string,
  tier: Tier = 'base',
  city?: string,
  country?: string
): Promise<HotelOffer[]> {
  const nights = Math.ceil(
    (new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24)
  );

  const starRating = tier === 'luxe' ? '5 star luxury resort' :
                     tier === 'premium' ? '4 star' : '3 star budget friendly';

  const locationStr = city && country ? `${city} ${country}` : `near ${lat},${lon}`;

  // Search for hotel info via web
  const query = `best ${starRating} hotels ${locationStr} 2024 2025`;
  console.log(`[Hotels] Searching: ${query}`);
  const searchResults = await webSearch(query);

  // Use Claude to find real hotels for this destination
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1500,
    messages: [{
      role: 'user',
      content: `You are the travel editor at a magazine like Condé Nast Traveler, helping someone book a spontaneous ${nights}-night escape to perfect weather. They value their time, have taste, and want a hotel that feels like part of the trip - not just a place to sleep.

DESTINATION: ${city}, ${country}
TIER: ${tier.toUpperCase()}
NIGHTS: ${nights}

TIER PHILOSOPHY:

BASE ($80-250/night):
Hotels that punch above their weight. The kind of place a well-traveled friend would say "trust me, book this one."
- Boutique hotels with 8.2+ ratings and actual personality
- Design-forward budget brands: Hoxton, Generator, Mama Shelter, CitizenM, 25hours, Moxy (the cool Marriott)
- Stylish hostels with private rooms (Selina, Freehand)
- That one local boutique everyone on Reddit recommends
- Historic buildings with character: converted monasteries, art deco gems, etc.
AVOID: Chains that could be anywhere, corporate lobbies, highway locations

PREMIUM ($180-450/night):
Hotels you'd actually remember and recommend. Instagram-worthy without trying.
- Mr & Mrs Smith collection properties (prioritize these - their curation is impeccable)
- Design Hotels members
- Tablet Hotels picks
- Urban cool: Ace Hotel, The Standard, Proper, Line Hotels, Shinola, Palisociety
- Boutique resorts with a specific point of view
- The "it" hotel that travel editors stay at
- Places where the bar/restaurant is a destination itself
AVOID: Business hotels, conference properties, anything beige

LUXE ($400-2000/night):
The dream. Hotels that are destinations themselves.
PRIORITIZE IN ORDER:
1. Mr & Mrs Smith "boutique luxury" or "extraordinary" tier (their taste is unmatched)
2. Small Luxury Hotels of the World (SLH) - independent luxury done right
3. Relais & Châteaux (especially for Europe, countryside, culinary destinations)
4. Leading Hotels of the World members
5. The big names done right: Four Seasons, Aman, Rosewood, Park Hyatt, Mandarin Oriental, Edition, St. Regis
6. Legendary independents: Chateau Marmont, Chiltern Firehouse, The Ned, etc.
For beach/resort destinations: Prioritize places with their own beach/water access
AVOID: Vegas-style mega hotels, cruise-ship vibes, stuffy old-money places with dated decor

${searchResults ? `DESTINATION CONTEXT:\n"""\n${searchResults}\n"""` : ''}

CRITICAL RULES:
1. ONLY suggest hotels that are CURRENTLY OPERATING and bookable
2. Use EXACT current hotel names (verify against search results)
3. Prices should reflect the destination's actual market (a boutique in Lisbon ≠ Manhattan)
4. Location matters: walkable to the good stuff, in a neighborhood they'd want to explore
5. Every pick should pass the "would I text this to a friend?" test
6. If Mr & Mrs Smith or Design Hotels has a property at this destination in the right tier, it should probably be your first pick

Return exactly 3 hotels as JSON array. Mix it up: don't suggest 3 of the same type.

[
  {
    "name": "Exact Hotel Name",
    "neighborhood": "Specific area - e.g. 'Gothic Quarter' not just 'Barcelona'",
    "pricePerNight": 220,
    "reviewScore": 91,
    "vibe": "3-4 words max: rooftop pool, design-forward, beachfront boutique, historic palazzo",
    "whyBook": "One compelling sentence - what makes this place special for THIS destination",
    "curatedBy": "Mr & Mrs Smith / Design Hotels / SLH / Tablet / Independent",
    "isLuxuryBrand": false
  }
]

Remember: This person is escaping to sunshine. The hotel should feel like part of that escape, not an afterthought.`
    }],
  });

  const content = response.content[0];
  if (content.type !== 'text') {
    throw new Error('Unexpected response type from Claude');
  }

  const jsonMatch = content.text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error('No hotel data found');
  }

  const extracted = JSON.parse(jsonMatch[0]);

  return extracted.map((h: {
    name: string;
    neighborhood?: string;
    pricePerNight: number;
    reviewScore?: number;
    vibe?: string;
    whyBook?: string;
    curatedBy?: string;
    isLuxuryBrand?: boolean;
  }, i: number) => {
    // Infer star rating from tier
    const starRating = tier === 'luxe' ? 5 : tier === 'premium' ? 4 : 3;
    return {
      id: `hotel_${i}_${Date.now()}`,
      name: h.name,
      neighborhood: h.neighborhood,
      starRating,
      reviewScore: h.reviewScore || 85,
      pricePerNight: h.pricePerNight,
      totalPrice: h.pricePerNight * nights,
      currency: 'USD',
      roomType: h.vibe || (starRating >= 5 ? 'Luxury Suite' : starRating >= 4 ? 'Design Room' : 'Boutique Room'),
      freeCancellation: true,
      breakfastIncluded: starRating >= 5,
      photo: `https://picsum.photos/seed/hotel${i + 300}/400/300`,
      isLuxuryBrand: h.isLuxuryBrand || false,
      reviewHighlights: h.whyBook,
      curatedBy: h.curatedBy,
    };
  });
}
