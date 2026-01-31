import { HotelOffer, Tier } from './types';

const DUFFEL_API_TOKEN = process.env.DUFFEL_API_TOKEN || '';

export async function searchHotels(
  lat: number,
  lon: number,
  checkIn: string,
  checkOut: string,
  guests: number = 2
): Promise<HotelOffer[]> {
  if (!DUFFEL_API_TOKEN) {
    return getMockHotels(checkIn, checkOut);
  }

  try {
    // Search for stays near the destination
    const searchResponse = await fetch('https://api.duffel.com/stays/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DUFFEL_API_TOKEN}`,
        'Duffel-Version': '2024-02-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        rooms: 1,
        location: {
          radius: 10,
          geographic_coordinates: {
            longitude: lon,
            latitude: lat,
          },
        },
        check_out_date: checkOut,
        check_in_date: checkIn,
        guests: Array(guests).fill({ type: 'adult' }),
      }),
    });

    if (!searchResponse.ok) {
      console.log('Duffel Stays not available, using mock data');
      return getMockHotels(checkIn, checkOut);
    }

    const searchData = await searchResponse.json();
    const results = searchData.data || [];

    return results.slice(0, 10).map((result: {
      id: string;
      accommodation: {
        id: string;
        name: string;
        rating: { value: number };
        review_score: number;
        photos: Array<{ url: string }>;
        amenities: Array<{ description: string }>;
        location: { address: { line_one: string } };
      };
      cheapest_rate_total_amount: string;
      cheapest_rate_currency: string;
    }) => ({
      id: result.id,
      name: result.accommodation.name,
      starRating: result.accommodation.rating?.value || 4,
      reviewScore: result.accommodation.review_score || 85,
      reviewCount: 0,
      price: parseFloat(result.cheapest_rate_total_amount),
      currency: result.cheapest_rate_currency,
      address: result.accommodation.location?.address?.line_one || '',
      distanceFromCenter: '',
      photos: result.accommodation.photos?.map(p => p.url) || [],
      amenities: result.accommodation.amenities?.map(a => a.description) || [],
      roomType: 'Standard Room',
      freeCancellation: true,
      breakfastIncluded: false,
      url: '',
    }));
  } catch (error) {
    console.error('Duffel Stays error:', error);
    return getMockHotels(checkIn, checkOut);
  }
}

export function selectBestHotel(hotels: HotelOffer[], tier: Tier): HotelOffer {
  const sorted = [...hotels];
  
  switch (tier) {
    case 'base':
      // Cheapest option
      return sorted.sort((a, b) => a.price - b.price)[0];
    case 'premium':
      // Best value (score/price ratio)
      return sorted.sort((a, b) => (b.reviewScore / b.price) - (a.reviewScore / a.price))[0];
    case 'luxe':
      // Highest rated
      return sorted.sort((a, b) => b.reviewScore - a.reviewScore)[0];
    default:
      return sorted[0];
  }
}

function getMockHotels(checkIn: string, checkOut: string): HotelOffer[] {
  const nights = Math.ceil(
    (new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24)
  );

  const hotels = [
    { name: 'The Grand Resort & Spa', stars: 5, basePrice: 280, score: 92 },
    { name: 'Oceanview Boutique Hotel', stars: 5, basePrice: 320, score: 94 },
    { name: 'City Center Suites', stars: 4, basePrice: 180, score: 88 },
    { name: 'Harbor View Inn', stars: 4, basePrice: 165, score: 86 },
    { name: 'Palm Garden Hotel', stars: 4, basePrice: 195, score: 89 },
    { name: 'Comfort Stay Express', stars: 3, basePrice: 95, score: 82 },
    { name: 'Budget Inn & Suites', stars: 3, basePrice: 75, score: 79 },
    { name: 'Downtown Lodge', stars: 3, basePrice: 85, score: 81 },
  ];

  return hotels.map((h, i) => ({
    id: `hotel_${i}_${Date.now()}`,
    name: h.name,
    starRating: h.stars,
    reviewScore: h.score,
    reviewCount: 100,
    price: h.basePrice * nights + Math.random() * 50,
    currency: 'USD',
    address: '',
    distanceFromCenter: '',
    photos: [`https://picsum.photos/seed/${i + 100}/400/300`],
    amenities: ['Free WiFi'],
    roomType: h.stars >= 4 ? 'Deluxe King Room' : 'Standard Room',
    freeCancellation: h.stars >= 4,
    breakfastIncluded: h.stars >= 5,
    url: '',
  }));
}
