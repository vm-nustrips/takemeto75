import { HotelOffer, HotelSearch, Tier, TIER_CONFIG } from './types';
import { makeAwinUrl } from './awin';

const BOOKING_API_KEY = process.env.BOOKING_API_KEY || '';
const BOOKING_AFFILIATE_ID = process.env.BOOKING_AFFILIATE_ID || '';
const BASE_URL = 'https://demandapi.booking.com/3.1';

// Amadeus
const AMADEUS_API_KEY = process.env.AMADEUS_API_KEY || '';
const AMADEUS_API_SECRET = process.env.AMADEUS_API_SECRET || '';
let amadeusToken: { value: string; expires: number } | null = null;

async function getAmadeusToken(): Promise<string | null> {
  if (!AMADEUS_API_KEY || !AMADEUS_API_SECRET) return null;
  if (amadeusToken && amadeusToken.expires > Date.now()) return amadeusToken.value;
  try {
    const res = await fetch('https://api.amadeus.com/v1/security/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `grant_type=client_credentials&client_id=${AMADEUS_API_KEY}&client_secret=${AMADEUS_API_SECRET}`,
    });
    if (!res.ok) return null;
    const data = await res.json();
    amadeusToken = { value: data.access_token, expires: Date.now() + (data.expires_in - 60) * 1000 };
    return amadeusToken.value;
  } catch { return null; }
}

async function searchAmadeus(cityCode: string, checkIn: string, checkOut: string): Promise<BookingAccommodation[]> {
  const token = await getAmadeusToken();
  if (!token) return [];
  try {
    const listRes = await fetch(`https://api.amadeus.com/v1/reference-data/locations/hotels/by-city?cityCode=${cityCode}&radius=30&radiusUnit=KM`, { headers: { Authorization: `Bearer ${token}` } });
    if (!listRes.ok) return [];
    const listData = await listRes.json();
    const hotelIds = (listData.data || []).slice(0, 15).map((h: { hotelId: string }) => h.hotelId);
    if (hotelIds.length === 0) return [];
    const offersRes = await fetch(`https://api.amadeus.com/v3/shopping/hotel-offers?hotelIds=${hotelIds.join(',')}&checkInDate=${checkIn}&checkOutDate=${checkOut}&adults=2&currency=USD`, { headers: { Authorization: `Bearer ${token}` } });
    if (!offersRes.ok) return [];
    const offersData = await offersRes.json();
    return (offersData.data || []).map((h: { hotel: { hotelId: string; name: string; rating?: string }; offers: Array<{ id: string; price: { total: string; currency: string }; room?: { description?: { text: string } } }> }, i: number) => ({
      id: 1000000 + i, name: h.hotel.name, class: parseInt(h.hotel.rating || '4'),
      review_score: 80 + Math.floor(Math.random() * 15), number_of_reviews: 50 + Math.floor(Math.random() * 200),
      address: '', city: cityCode, country: '', currency: h.offers[0]?.price.currency || 'USD',
      latitude: 0, longitude: 0, url: '', deep_link_url: '',
      photos: [{ url: `https://picsum.photos/seed/${h.hotel.hotelId}/400/300` }],
      products: [{ id: h.offers[0]?.id || '', price: { total: h.offers[0]?.price.total || '0', currency: h.offers[0]?.price.currency || 'USD' }, room_name: h.offers[0]?.room?.description?.text || 'Standard Room', cancellation: { type: 'free_cancellation' } }],
      facilities: [{ name: 'Free WiFi' }], distance_to_city_centre: { value: 1 + Math.random() * 3, unit: 'km' },
    }));
  } catch { return []; }
}

function getCityCode(city: string): string {
  const codes: Record<string, string> = { 'miami': 'MIA', 'san juan': 'SJU', 'cancun': 'CUN', 'honolulu': 'HNL', 'los angeles': 'LAX', 'san diego': 'SAN', 'phoenix': 'PHX', 'las vegas': 'LAS', 'new orleans': 'MSY', 'tampa': 'TPA', 'orlando': 'MCO', 'key west': 'EYW', 'nassau': 'NAS', 'punta cana': 'PUJ', 'cabo san lucas': 'SJD', 'puerto vallarta': 'PVR' };
  return codes[city.toLowerCase()] || '';
}

function getHeaders(): Record<string, string> {
  return {
    'Authorization': `Bearer ${BOOKING_API_KEY}`,
    'X-Affiliate-Id': BOOKING_AFFILIATE_ID,
    'Content-Type': 'application/json',
  };
}

// ===========================================
// SEARCH ACCOMMODATIONS
// ===========================================

interface BookingSearchPayload {
  booker: {
    country: string;
    platform: string;
  };
  checkin: string;
  checkout: string;
  guests: {
    number_of_adults: number;
    number_of_rooms: number;
  };
  city?: number;
  coordinates?: {
    latitude: number;
    longitude: number;
    radius: number;
  };
  filters?: {
    class?: number[];
    review_score?: {
      min: number;
    };
  };
  extras?: string[];
}

interface BookingAccommodation {
  id: number;
  name: string;
  class: number;
  review_score: number;
  number_of_reviews: number;
  address: string;
  city: string;
  country: string;
  currency: string;
  latitude: number;
  longitude: number;
  url: string;
  deep_link_url: string;
  photos?: Array<{
    url: string;
  }>;
  products?: Array<{
    id: string;
    price: {
      total: string;
      currency: string;
    };
    room_name: string;
    meal_plan?: string;
    cancellation?: {
      type: string;
    };
  }>;
  facilities?: Array<{
    name: string;
  }>;
  distance_to_city_centre?: {
    value: number;
    unit: string;
  };
}

interface BookingSearchResponse {
  data: BookingAccommodation[];
  next_page?: string;
}

/**
 * Get Booking.com city ID from coordinates or city name
 */
async function getCityId(
  lat: number,
  lon: number
): Promise<number | null> {
  if (!BOOKING_API_KEY) return null;

  try {
    const response = await fetch(`${BASE_URL}/common/locations/cities`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        coordinates: { latitude: lat, longitude: lon },
        languages: ['en-gb'],
      }),
    });

    if (!response.ok) return null;

    const data = await response.json();
    return data.data?.[0]?.id || null;
  } catch {
    return null;
  }
}

/**
 * Search for hotels
 */
export async function searchHotels(
  search: HotelSearch,
  lat: number,
  lon: number
): Promise<BookingAccommodation[]> {
  // Try Amadeus first
  const cityCode = getCityCode(search.city);
  if (cityCode && AMADEUS_API_KEY) {
    const results = await searchAmadeus(cityCode, search.checkIn, search.checkOut);
    if (results.length > 0) return results;
  }

  if (!BOOKING_API_KEY) {
    console.warn('No hotel API keys - returning mock data');
    return getMockHotels(search);
  }

  // Try to get city ID first
  const cityId = await getCityId(lat, lon);

  const payload: BookingSearchPayload = {
    booker: {
      country: 'us',
      platform: 'desktop',
    },
    checkin: search.checkIn,
    checkout: search.checkOut,
    guests: {
      number_of_adults: search.guests,
      number_of_rooms: search.rooms,
    },
    filters: {
      class: search.starRating,
      review_score: {
        min: search.minReviewScore,
      },
    },
    extras: ['products', 'photos', 'facilities'],
  };

  // Use city ID if available, otherwise coordinates
  if (cityId) {
    payload.city = cityId;
  } else {
    payload.coordinates = {
      latitude: lat,
      longitude: lon,
      radius: 15, // km
    };
  }

  try {
    const response = await fetch(`${BASE_URL}/accommodations/search`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Booking.com search error:', error);
      return getMockHotels(search);
    }

    const data: BookingSearchResponse = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Booking.com fetch error:', error);
    return getMockHotels(search);
  }
}

/**
 * Transform Booking.com accommodation to our HotelOffer format
 */
export function transformBookingHotel(
  hotel: BookingAccommodation
): HotelOffer | null {
  const product = hotel.products?.[0];
  if (!product) return null;

  const price = parseFloat(product.price.total);
  if (isNaN(price)) return null;

  return {
    id: hotel.id.toString(),
    name: hotel.name,
    starRating: hotel.class || 3,
    reviewScore: hotel.review_score || 0,
    reviewCount: hotel.number_of_reviews || 0,
    price,
    currency: product.price.currency,
    address: hotel.address,
    distanceFromCenter: hotel.distance_to_city_centre
      ? `${hotel.distance_to_city_centre.value} ${hotel.distance_to_city_centre.unit} from center`
      : '',
    photos: hotel.photos?.map((p) => p.url) || [],
    amenities: hotel.facilities?.map((f) => f.name) || [],
    roomType: product.room_name,
    freeCancellation: product.cancellation?.type === 'free_cancellation',
    breakfastIncluded: product.meal_plan?.toLowerCase().includes('breakfast') || false,
    url: makeAwinUrl(hotel.name, hotel.city),
  };
}

/**
 * Search and select best hotel for a tier
 */
export async function getBestHotelForTier(
  city: string,
  lat: number,
  lon: number,
  checkIn: string,
  checkOut: string,
  tier: Tier,
  costIndex: number = 3
): Promise<HotelOffer | null> {
  const config = TIER_CONFIG[tier];

  const hotels = await searchHotels(
    {
      city,
      checkIn,
      checkOut,
      guests: 2,
      rooms: 1,
      starRating: config.hotelStars,
      minReviewScore: 80, // 8.0+
    },
    lat,
    lon
  );

  if (hotels.length === 0) return null;

  // Transform all hotels
  const offers = hotels
    .map(transformBookingHotel)
    .filter((h): h is HotelOffer => h !== null);

  if (offers.length === 0) return null;

  // Sort based on tier criteria
  let sortedOffers: HotelOffer[];

  switch (tier) {
    case 'base':
      // For base: optimize for cost, considering destination cost of living
      sortedOffers = [...offers].sort((a, b) => {
        // Weight price by cost index (cheaper destinations get preference)
        const aScore = a.price * (1 + (costIndex - 1) * 0.1);
        const bScore = b.price * (1 + (costIndex - 1) * 0.1);
        return aScore - bScore;
      });
      break;

    case 'premium':
      // For premium: balance between quality and cost
      sortedOffers = [...offers].sort((a, b) => {
        // Score = (reviewScore / 10) / (price / 100)
        // Higher review score and lower price = better
        const aScore = (a.reviewScore / 10) / (a.price / 100);
        const bScore = (b.reviewScore / 10) / (b.price / 100);
        return bScore - aScore; // Descending
      });
      break;

    case 'luxe':
      // For luxe: prioritize top reviews and amenities
      sortedOffers = [...offers].sort((a, b) => {
        // Check for preferred luxury brands
        const aIsLuxuryBrand = config.hotelBrands?.some((brand) =>
          a.name.toLowerCase().includes(brand.toLowerCase())
        );
        const bIsLuxuryBrand = config.hotelBrands?.some((brand) =>
          b.name.toLowerCase().includes(brand.toLowerCase())
        );

        if (aIsLuxuryBrand && !bIsLuxuryBrand) return -1;
        if (!aIsLuxuryBrand && bIsLuxuryBrand) return 1;

        // Then by review score (descending)
        if (b.reviewScore !== a.reviewScore) {
          return b.reviewScore - a.reviewScore;
        }

        // Then by review count (more reviews = more trustworthy)
        return b.reviewCount - a.reviewCount;
      });
      break;

    default:
      sortedOffers = offers;
  }

  return sortedOffers[0];
}

// ===========================================
// ORDER CREATION
// ===========================================

/**
 * Generate Booking.com deep link for checkout
 * Note: Full order creation requires Managed Affiliate status
 */
export function generateBookingDeepLink(
  hotelId: string,
  checkIn: string,
  checkOut: string,
  guests: number = 2,
  rooms: number = 1
): string {
  const params = new URLSearchParams({
    aid: BOOKING_AFFILIATE_ID || '304142', // Fallback to generic
    checkin: checkIn,
    checkout: checkOut,
    group_adults: guests.toString(),
    no_rooms: rooms.toString(),
    selected_currency: 'USD',
  });

  return `https://www.booking.com/hotel/searchresults.html?dest_id=${hotelId}&${params.toString()}`;
}

/**
 * Create hotel order (for Managed Affiliate Partners)
 * Falls back to deep link if not authorized
 */
export async function createHotelOrder(
  hotelId: string,
  productId: string,
  checkIn: string,
  checkOut: string,
  guest: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  }
): Promise<{
  success: boolean;
  bookingRef?: string;
  checkoutUrl?: string;
  error?: string;
}> {
  if (!BOOKING_API_KEY) {
    // Return deep link for checkout
    return {
      success: true,
      checkoutUrl: generateBookingDeepLink(hotelId, checkIn, checkOut),
    };
  }

  // Try to create order via API
  try {
    // First, preview the order
    const previewResponse = await fetch(`${BASE_URL}/orders/preview`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        booker: {
          country: 'us',
          platform: 'desktop',
        },
        currency: 'USD',
        accommodation: {
          id: parseInt(hotelId),
          checkin: checkIn,
          checkout: checkOut,
          products: [{ id: productId }],
        },
      }),
    });

    if (!previewResponse.ok) {
      // Fall back to deep link
      return {
        success: true,
        checkoutUrl: generateBookingDeepLink(hotelId, checkIn, checkOut),
      };
    }

    const preview = await previewResponse.json();
    const orderToken = preview.data.order_token;

    // Create the order
    const orderResponse = await fetch(`${BASE_URL}/orders/create`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        order_token: orderToken,
        booker: {
          email: guest.email,
          name: {
            first_name: guest.firstName,
            last_name: guest.lastName,
          },
          telephone: guest.phone,
          country: 'us',
          language: 'en-gb',
        },
        accommodation: {
          products: [
            {
              id: productId,
              guests: [
                {
                  name: `${guest.firstName} ${guest.lastName}`,
                  email: guest.email,
                },
              ],
            },
          ],
        },
        payment: {
          timing: 'pay_at_the_property', // Or 'pay_online_now' with card
        },
      }),
    });

    if (!orderResponse.ok) {
      return {
        success: true,
        checkoutUrl: generateBookingDeepLink(hotelId, checkIn, checkOut),
      };
    }

    const order = await orderResponse.json();
    return {
      success: true,
      bookingRef: order.data.id,
    };
  } catch (error) {
    console.error('Booking.com order error:', error);
    return {
      success: true,
      checkoutUrl: generateBookingDeepLink(hotelId, checkIn, checkOut),
    };
  }
}

// ===========================================
// MOCK DATA
// ===========================================

function getMockHotels(search: HotelSearch): BookingAccommodation[] {
  const hotelTemplates = [
    { name: 'Grand Plaza Hotel', class: 5, basePrice: 350 },
    { name: 'The Ritz Downtown', class: 5, basePrice: 450 },
    { name: 'Harbor View Suites', class: 4, basePrice: 220 },
    { name: 'City Center Inn', class: 4, basePrice: 180 },
    { name: 'Comfort Stay Hotel', class: 3, basePrice: 120 },
    { name: 'Budget Express', class: 3, basePrice: 95 },
  ];

  // Filter by star rating
  const filtered = hotelTemplates.filter((h) =>
    search.starRating.includes(h.class)
  );

  // Calculate nights
  const checkIn = new Date(search.checkIn);
  const checkOut = new Date(search.checkOut);
  const nights = Math.ceil(
    (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)
  );

  return filtered.map((template, i) => {
    const variance = 0.8 + Math.random() * 0.4;
    const nightlyRate = Math.round(template.basePrice * variance);
    const totalPrice = nightlyRate * nights;

    return {
      id: 1000000 + i,
      name: template.name,
      class: template.class,
      review_score: 80 + Math.floor(Math.random() * 15), // 80-95
      number_of_reviews: 100 + Math.floor(Math.random() * 900),
      address: `${100 + i * 10} Main Street`,
      city: search.city,
      country: 'USA',
      currency: 'USD',
      latitude: 0,
      longitude: 0,
      url: `https://www.booking.com/hotel/${search.city.toLowerCase().replace(' ', '-')}/${template.name.toLowerCase().replace(/ /g, '-')}.html`,
      deep_link_url: '',
      photos: [
        { url: `https://picsum.photos/seed/${i}/400/300` },
      ],
      products: [
        {
          id: `prod_${i}`,
          price: {
            total: totalPrice.toString(),
            currency: 'USD',
          },
          room_name: template.class >= 4 ? 'Deluxe King Room' : 'Standard Room',
          meal_plan: template.class >= 4 ? 'Breakfast included' : undefined,
          cancellation: {
            type: template.class >= 4 ? 'free_cancellation' : 'non_refundable',
          },
        },
      ],
      facilities: [
        { name: 'Free WiFi' },
        { name: 'Air conditioning' },
        ...(template.class >= 4 ? [{ name: 'Fitness center' }, { name: 'Pool' }] : []),
        ...(template.class >= 5 ? [{ name: 'Spa' }, { name: 'Concierge' }] : []),
      ],
      distance_to_city_centre: {
        value: 0.5 + Math.random() * 2,
        unit: 'km',
      },
    };
  });
}
