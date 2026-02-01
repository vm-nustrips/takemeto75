import { Tier } from './types';

// Amadeus API Client
// Uses sandbox API by default (test.api.amadeus.com)

interface AmadeusToken {
  access_token: string;
  expires_at: number;
}

interface AmadeusHotelListItem {
  hotelId: string;
  name: string;
  geoCode: { latitude: number; longitude: number };
  address?: { cityName?: string; countryCode?: string };
  rating?: number; // 1-5 star rating
}

interface AmadeusHotelOffer {
  hotel: {
    hotelId: string;
    name: string;
    rating?: string;
  };
  offers: Array<{
    id: string;
    checkInDate: string;
    checkOutDate: string;
    room: {
      typeEstimated?: {
        category?: string;
        beds?: number;
        bedType?: string;
      };
      description?: { text?: string };
    };
    price: {
      currency: string;
      total: string;
    };
    policies?: {
      cancellation?: { description?: { text?: string } };
    };
    boardType?: string; // ROOM_ONLY, BREAKFAST, etc.
  }>;
}

// Token cache
let cachedToken: AmadeusToken | null = null;

async function getAmadeusToken(): Promise<string> {
  // Return cached token if still valid (with 5 min buffer)
  if (cachedToken && Date.now() < cachedToken.expires_at - 300000) {
    return cachedToken.access_token;
  }

  const apiKey = process.env.AMADEUS_API_KEY;
  const apiSecret = process.env.AMADEUS_API_SECRET;
  const baseUrl = process.env.AMADEUS_BASE_URL || 'https://test.api.amadeus.com';

  if (!apiKey || !apiSecret) {
    throw new Error('Amadeus API credentials not configured');
  }

  const response = await fetch(`${baseUrl}/v1/security/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: `grant_type=client_credentials&client_id=${apiKey}&client_secret=${apiSecret}`,
  });

  if (!response.ok) {
    throw new Error(`Amadeus auth failed: ${response.status}`);
  }

  const data = await response.json();

  cachedToken = {
    access_token: data.access_token,
    expires_at: Date.now() + (data.expires_in * 1000), // typically 1799 seconds
  };

  return cachedToken.access_token;
}

// Get tier-appropriate star ratings
export function getTierRatings(tier: Tier): string[] {
  switch (tier) {
    case 'luxe':
      return ['5']; // 5-star only
    case 'premium':
      return ['4', '5']; // 4-5 star
    case 'base':
    default:
      return ['3', '4', '5']; // 3-5 star
  }
}

// Get hotels by geocode with tier-based rating filter
export async function getHotelsByGeocode(
  lat: number,
  lon: number,
  tier: Tier
): Promise<AmadeusHotelListItem[]> {
  const token = await getAmadeusToken();
  const baseUrl = process.env.AMADEUS_BASE_URL || 'https://test.api.amadeus.com';
  const ratings = getTierRatings(tier);

  const params = new URLSearchParams({
    latitude: lat.toString(),
    longitude: lon.toString(),
    radius: '10', // 10km radius
    radiusUnit: 'KM',
    ratings: ratings.join(','),
    hotelSource: 'ALL',
  });

  const response = await fetch(
    `${baseUrl}/v1/reference-data/locations/hotels/by-geocode?${params}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Amadeus hotel list error:', response.status, errorText);
    throw new Error(`Amadeus hotel list failed: ${response.status}`);
  }

  const data = await response.json();
  return data.data || [];
}

// Get hotel offers (pricing) for specific hotel IDs
export async function getHotelOffers(
  hotelIds: string[],
  checkIn: string,
  checkOut: string,
  adults: number = 1
): Promise<AmadeusHotelOffer[]> {
  if (hotelIds.length === 0) return [];

  const token = await getAmadeusToken();
  const baseUrl = process.env.AMADEUS_BASE_URL || 'https://test.api.amadeus.com';

  // Batch max 50 hotels per request
  const batchSize = 50;
  const batches = [];
  for (let i = 0; i < hotelIds.length; i += batchSize) {
    batches.push(hotelIds.slice(i, i + batchSize));
  }

  const allOffers: AmadeusHotelOffer[] = [];

  for (const batch of batches) {
    const params = new URLSearchParams({
      hotelIds: batch.join(','),
      adults: adults.toString(),
      checkInDate: checkIn,
      checkOutDate: checkOut,
      currency: 'USD',
      roomQuantity: '1',
    });

    try {
      const response = await fetch(
        `${baseUrl}/v3/shopping/hotel-offers?${params}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        console.error('Amadeus offers error:', response.status);
        continue; // Skip this batch, try others
      }

      const data = await response.json();
      if (data.data) {
        allOffers.push(...data.data);
      }
    } catch (err) {
      console.error('Amadeus offers fetch error:', err);
    }
  }

  return allOffers;
}

// Combine hotel list + offers into a unified format
export interface AmadeusHotelResult {
  hotelId: string;
  name: string;
  starRating: number;
  offerId: string;
  checkIn: string;
  checkOut: string;
  priceTotal: number;
  currency: string;
  roomType: string;
  boardType: string;
  nights: number;
}

export function transformAmadeusData(
  hotelList: AmadeusHotelListItem[],
  offers: AmadeusHotelOffer[],
  checkIn: string,
  checkOut: string
): AmadeusHotelResult[] {
  const nights = Math.ceil(
    (new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24)
  );

  const results: AmadeusHotelResult[] = [];

  // Create a map of hotelId -> hotel info from the list
  const hotelMap = new Map(hotelList.map(h => [h.hotelId, h]));

  for (const offer of offers) {
    const hotelInfo = hotelMap.get(offer.hotel.hotelId);
    if (!offer.offers || offer.offers.length === 0) continue;

    const bestOffer = offer.offers[0]; // Take first offer (usually cheapest)
    const rating = hotelInfo?.rating || parseInt(offer.hotel.rating || '3') || 3;

    results.push({
      hotelId: offer.hotel.hotelId,
      name: offer.hotel.name || hotelInfo?.name || 'Hotel',
      starRating: rating,
      offerId: bestOffer.id,
      checkIn: bestOffer.checkInDate,
      checkOut: bestOffer.checkOutDate,
      priceTotal: parseFloat(bestOffer.price.total),
      currency: bestOffer.price.currency,
      roomType: bestOffer.room?.typeEstimated?.category ||
                bestOffer.room?.description?.text?.slice(0, 30) ||
                'Standard Room',
      boardType: bestOffer.boardType || 'ROOM_ONLY',
      nights,
    });
  }

  // Sort by price
  return results.sort((a, b) => a.priceTotal - b.priceTotal);
}
