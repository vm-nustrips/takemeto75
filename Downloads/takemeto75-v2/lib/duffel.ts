import { FlightOffer, FlightSearch, FlightSegment, Tier, TIER_CONFIG } from './types';

const DUFFEL_API_TOKEN = process.env.DUFFEL_API_TOKEN || '';
const BASE_URL = 'https://api.duffel.com';

// Markup amounts in cents per tier
const MARKUPS = {
  base: parseInt(process.env.FLIGHT_MARKUP_BASE || '2500'),
  premium: parseInt(process.env.FLIGHT_MARKUP_PREMIUM || '4000'),
  luxe: parseInt(process.env.FLIGHT_MARKUP_LUXE || '7500'),
};

interface DuffelHeaders {
  'Authorization': string;
  'Duffel-Version': string;
  'Content-Type': string;
  'Accept-Encoding': string;
}

function getHeaders(): DuffelHeaders {
  return {
    'Authorization': `Bearer ${DUFFEL_API_TOKEN}`,
    'Duffel-Version': '2024-02-28',
    'Content-Type': 'application/json',
    'Accept-Encoding': 'gzip',
  };
}

// ===========================================
// OFFER REQUEST (Search)
// ===========================================

interface CreateOfferRequestPayload {
  data: {
    slices: Array<{
      origin: string;
      destination: string;
      departure_date: string;
    }>;
    passengers: Array<{
      type: 'adult' | 'child' | 'infant_without_seat';
      age?: number;
    }>;
    cabin_class?: 'economy' | 'premium_economy' | 'business' | 'first';
    return_offers?: boolean;
  };
}

interface DuffelOffer {
  id: string;
  total_amount: string;
  total_currency: string;
  owner: {
    name: string;
    logo_symbol_url?: string;
  };
  slices: Array<{
    segments: Array<{
      origin: {
        iata_code: string;
      };
      destination: {
        iata_code: string;
      };
      departing_at: string;
      arriving_at: string;
      duration: string;
      operating_carrier: {
        name: string;
        iata_code: string;
      };
      operating_carrier_flight_number: string;
    }>;
  }>;
  passengers: Array<{
    cabin_class: string;
    baggages: Array<{
      type: string;
      quantity: number;
    }>;
  }>;
  conditions: {
    refund_before_departure?: {
      allowed: boolean;
    };
  };
}

/**
 * Search for flight offers
 */
export async function searchFlights(
  search: FlightSearch
): Promise<DuffelOffer[]> {
  if (!DUFFEL_API_TOKEN) {
    console.warn('No Duffel API token - returning mock data');
    return getMockFlightOffers(search);
  }

  const payload: CreateOfferRequestPayload = {
    data: {
      slices: [
        {
          origin: search.origin,
          destination: search.destination,
          departure_date: search.departureDate,
        },
        {
          origin: search.destination,
          destination: search.origin,
          departure_date: search.returnDate,
        },
      ],
      passengers: Array(search.passengers).fill({ type: 'adult' as const }),
      cabin_class: search.cabinClass,
      return_offers: true,
    },
  };

  try {
    const response = await fetch(`${BASE_URL}/air/offer_requests`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Duffel search error:', error);
      return getMockFlightOffers(search);
    }

    const data = await response.json();
    return data.data.offers || [];
  } catch (error) {
    console.error('Duffel fetch error:', error);
    return getMockFlightOffers(search);
  }
}

/**
 * Transform Duffel offer to our FlightOffer format
 */
export function transformDuffelOffer(
  offer: DuffelOffer,
  tier: Tier
): FlightOffer {
  const markup = MARKUPS[tier] / 100; // Convert cents to dollars
  const basePrice = parseFloat(offer.total_amount);
  
  const outboundSlice = offer.slices[0];
  const inboundSlice = offer.slices[1];
  
  const transformSegment = (slice: typeof outboundSlice): FlightSegment => {
    const firstSeg = slice.segments[0];
    const lastSeg = slice.segments[slice.segments.length - 1];
    
    // Calculate total duration
    const departTime = new Date(firstSeg.departing_at);
    const arriveTime = new Date(lastSeg.arriving_at);
    const durationMs = arriveTime.getTime() - departTime.getTime();
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return {
      departure: {
        airport: firstSeg.origin.iata_code,
        time: firstSeg.departing_at,
      },
      arrival: {
        airport: lastSeg.destination.iata_code,
        time: lastSeg.arriving_at,
      },
      duration: `${hours}h ${minutes}m`,
      stops: slice.segments.length - 1,
      carrier: firstSeg.operating_carrier.name,
      flightNumber: `${firstSeg.operating_carrier.iata_code}${firstSeg.operating_carrier_flight_number}`,
    };
  };

  const hasBaggage = offer.passengers.some((p) =>
    p.baggages?.some((b) => b.type === 'checked' && b.quantity > 0)
  );

  return {
    id: offer.id,
    price: basePrice + markup,
    currency: offer.total_currency,
    airline: offer.owner.name,
    airlineLogo: offer.owner.logo_symbol_url,
    outbound: transformSegment(outboundSlice),
    inbound: transformSegment(inboundSlice),
    cabinClass: offer.passengers[0]?.cabin_class || 'economy',
    baggageIncluded: hasBaggage,
    refundable: offer.conditions.refund_before_departure?.allowed || false,
  };
}

/**
 * Search and select best flight for a tier
 */
export async function getBestFlightForTier(
  origin: string,
  destination: string,
  departureDate: string,
  returnDate: string,
  tier: Tier
): Promise<FlightOffer | null> {
  const config = TIER_CONFIG[tier];
  
  const offers = await searchFlights({
    origin,
    destination,
    departureDate,
    returnDate,
    passengers: 1,
    cabinClass: config.cabinClass,
  });

  if (offers.length === 0) return null;

  // Sort by price for base/premium, by convenience for luxe
  let sortedOffers: DuffelOffer[];
  
  if (tier === 'luxe') {
    // For luxe, prefer direct flights and reasonable departure times
    sortedOffers = [...offers].sort((a, b) => {
      const aStops = a.slices.reduce((sum, s) => sum + s.segments.length - 1, 0);
      const bStops = b.slices.reduce((sum, s) => sum + s.segments.length - 1, 0);
      
      // Direct flights first
      if (aStops !== bStops) return aStops - bStops;
      
      // Then by price
      return parseFloat(a.total_amount) - parseFloat(b.total_amount);
    });
  } else {
    // For base/premium, sort by price
    sortedOffers = [...offers].sort(
      (a, b) => parseFloat(a.total_amount) - parseFloat(b.total_amount)
    );
  }

  const bestOffer = sortedOffers[0];
  return transformDuffelOffer(bestOffer, tier);
}

// ===========================================
// ORDER CREATION
// ===========================================

interface CreateOrderPayload {
  data: {
    type: 'instant' | 'hold';
    selected_offers: string[];
    passengers: Array<{
      id: string;
      born_on: string;
      email: string;
      family_name: string;
      given_name: string;
      gender: 'male' | 'female' | 'other';
      phone_number: string;
      title: string;
    }>;
    payments?: Array<{
      type: 'balance';
      amount: string;
      currency: string;
    }>;
  };
}

/**
 * Create a flight order (booking)
 */
export async function createFlightOrder(
  offerId: string,
  passenger: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    dateOfBirth: string;
    gender: 'male' | 'female' | 'other';
  },
  totalAmount: string,
  currency: string
): Promise<{ success: boolean; bookingRef?: string; error?: string }> {
  if (!DUFFEL_API_TOKEN) {
    return {
      success: true,
      bookingRef: 'MOCK-' + Math.random().toString(36).substring(7).toUpperCase(),
    };
  }

  const payload: CreateOrderPayload = {
    data: {
      type: 'instant',
      selected_offers: [offerId],
      passengers: [
        {
          id: 'pas_0', // Will be replaced with actual passenger ID from offer
          born_on: passenger.dateOfBirth,
          email: passenger.email,
          family_name: passenger.lastName,
          given_name: passenger.firstName,
          gender: passenger.gender,
          phone_number: passenger.phone,
          title: passenger.gender === 'male' ? 'mr' : 'ms',
        },
      ],
      payments: [
        {
          type: 'balance',
          amount: totalAmount,
          currency: currency,
        },
      ],
    },
  };

  try {
    const response = await fetch(`${BASE_URL}/air/orders`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Duffel order error:', error);
      return { success: false, error: 'Failed to create flight booking' };
    }

    const data = await response.json();
    return {
      success: true,
      bookingRef: data.data.booking_reference,
    };
  } catch (error) {
    console.error('Duffel order fetch error:', error);
    return { success: false, error: 'Network error creating flight booking' };
  }
}

/**
 * Cancel a flight order
 */
export async function cancelFlightOrder(
  orderId: string
): Promise<{ success: boolean; error?: string }> {
  if (!DUFFEL_API_TOKEN) {
    return { success: true };
  }

  try {
    // First, get cancellation quote
    const quoteResponse = await fetch(
      `${BASE_URL}/air/order_cancellations`,
      {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          data: { order_id: orderId },
        }),
      }
    );

    if (!quoteResponse.ok) {
      return { success: false, error: 'Unable to cancel order' };
    }

    const quote = await quoteResponse.json();
    
    // Confirm cancellation
    const confirmResponse = await fetch(
      `${BASE_URL}/air/order_cancellations/${quote.data.id}/actions/confirm`,
      {
        method: 'POST',
        headers: getHeaders(),
      }
    );

    return { success: confirmResponse.ok };
  } catch (error) {
    console.error('Cancel order error:', error);
    return { success: false, error: 'Network error cancelling order' };
  }
}

// ===========================================
// MOCK DATA
// ===========================================

function getMockFlightOffers(search: FlightSearch): DuffelOffer[] {
  const airlines = [
    { name: 'United Airlines', code: 'UA' },
    { name: 'American Airlines', code: 'AA' },
    { name: 'Delta Air Lines', code: 'DL' },
    { name: 'JetBlue Airways', code: 'B6' },
  ];

  const basePrices: Record<string, number> = {
    economy: 250,
    premium_economy: 450,
    business: 1200,
    first: 2500,
  };

  return airlines.slice(0, 3).map((airline, i) => {
    const basePrice = basePrices[search.cabinClass] + Math.random() * 200;
    const departureHour = 6 + Math.floor(Math.random() * 12);
    
    return {
      id: `off_mock_${i}_${Date.now()}`,
      total_amount: basePrice.toFixed(2),
      total_currency: 'USD',
      owner: {
        name: airline.name,
        logo_symbol_url: undefined,
      },
      slices: [
        {
          segments: [
            {
              origin: { iata_code: search.origin },
              destination: { iata_code: search.destination },
              departing_at: `${search.departureDate}T${departureHour.toString().padStart(2, '0')}:00:00`,
              arriving_at: `${search.departureDate}T${(departureHour + 4).toString().padStart(2, '0')}:30:00`,
              duration: 'PT4H30M',
              operating_carrier: { name: airline.name, iata_code: airline.code },
              operating_carrier_flight_number: (100 + i * 50).toString(),
            },
          ],
        },
        {
          segments: [
            {
              origin: { iata_code: search.destination },
              destination: { iata_code: search.origin },
              departing_at: `${search.returnDate}T${(departureHour + 2).toString().padStart(2, '0')}:00:00`,
              arriving_at: `${search.returnDate}T${(departureHour + 6).toString().padStart(2, '0')}:30:00`,
              duration: 'PT4H30M',
              operating_carrier: { name: airline.name, iata_code: airline.code },
              operating_carrier_flight_number: (101 + i * 50).toString(),
            },
          ],
        },
      ],
      passengers: [
        {
          cabin_class: search.cabinClass,
          baggages: search.cabinClass !== 'economy' 
            ? [{ type: 'checked', quantity: 1 }]
            : [],
        },
      ],
      conditions: {
        refund_before_departure: {
          allowed: search.cabinClass !== 'economy',
        },
      },
    };
  });
}
