import { HotelOffer, Tier } from './types';
import { getHotelsByGeocode, getHotelOffers, transformAmadeusData } from './amadeus';

// Luxury hotel brands for tier detection
const LUXURY_BRANDS = [
  'four seasons', 'ritz-carlton', 'ritz carlton', 'park hyatt', 'rosewood',
  'st. regis', 'st regis', 'mandarin oriental', 'peninsula', 'aman',
  'bulgari', 'edition', 'waldorf astoria', 'conrad', 'w hotel',
  'jw marriott', 'fairmont', 'langham', 'sofitel'
];

function isLuxuryBrand(hotelName: string): boolean {
  const nameLower = hotelName.toLowerCase();
  return LUXURY_BRANDS.some(brand => nameLower.includes(brand));
}

export async function searchHotels(
  lat: number,
  lon: number,
  checkIn: string,
  checkOut: string,
  tier: Tier = 'base'
): Promise<HotelOffer[]> {
  // Check if Amadeus is configured
  if (!process.env.AMADEUS_API_KEY || !process.env.AMADEUS_API_SECRET) {
    console.log('Amadeus not configured, using mock hotels');
    return getMockHotels(checkIn, checkOut);
  }

  try {
    // Step 1: Get hotel IDs from Amadeus (filtered by tier ratings)
    console.log(`Searching Amadeus hotels at ${lat}, ${lon} for tier: ${tier}`);
    const hotelList = await getHotelsByGeocode(lat, lon, tier);

    if (hotelList.length === 0) {
      console.log('No hotels found in Amadeus, using mock');
      return getMockHotels(checkIn, checkOut);
    }

    console.log(`Found ${hotelList.length} hotels in Amadeus`);

    // Step 2: Get pricing for top 20 hotels (to control API costs)
    const hotelIds = hotelList.slice(0, 20).map(h => h.hotelId);
    const offers = await getHotelOffers(hotelIds, checkIn, checkOut);

    if (offers.length === 0) {
      console.log('No hotel offers available, using mock');
      return getMockHotels(checkIn, checkOut);
    }

    console.log(`Got ${offers.length} hotel offers with pricing`);

    // Step 3: Transform to HotelOffer format
    const amadeusResults = transformAmadeusData(hotelList, offers, checkIn, checkOut);

    const nights = Math.ceil(
      (new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24)
    );

    const hotels: HotelOffer[] = amadeusResults.map((h, index) => ({
      id: `amadeus_${h.hotelId}_${Date.now()}`,
      name: h.name,
      starRating: h.starRating,
      reviewScore: h.starRating * 18 + Math.floor(Math.random() * 10), // Estimate until Booking.com enrichment
      pricePerNight: Math.round(h.priceTotal / nights),
      totalPrice: Math.round(h.priceTotal),
      currency: h.currency,
      roomType: h.roomType,
      freeCancellation: h.starRating >= 4, // Estimate
      breakfastIncluded: h.boardType.includes('BREAKFAST'),
      photo: `https://picsum.photos/seed/hotel${index + 200}/400/300`,
      isLuxuryBrand: isLuxuryBrand(h.name),
      // Amadeus-specific
      amadeusHotelId: h.hotelId,
      amadeusOfferId: h.offerId,
      boardType: h.boardType,
    }));

    return hotels;
  } catch (error) {
    console.error('Amadeus hotel search failed:', error);
    return getMockHotels(checkIn, checkOut);
  }
}

// Fallback mock hotels (existing implementation)
function getMockHotels(checkIn: string, checkOut: string): HotelOffer[] {
  const nights = Math.ceil(
    (new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24)
  );

  const hotels = [
    // Luxury brands for Luxe tier
    { name: 'Four Seasons Resort', stars: 5, basePrice: 650, score: 96, luxury: true },
    { name: 'Ritz-Carlton', stars: 5, basePrice: 580, score: 95, luxury: true },
    { name: 'Park Hyatt', stars: 5, basePrice: 520, score: 94, luxury: true },
    { name: 'Rosewood Hotel', stars: 5, basePrice: 600, score: 95, luxury: true },

    // Premium 4-5 star hotels
    { name: 'Grand Hyatt', stars: 5, basePrice: 320, score: 91, luxury: false },
    { name: 'Marriott Resort & Spa', stars: 4, basePrice: 240, score: 88, luxury: false },
    { name: 'Hilton Oceanfront', stars: 4, basePrice: 210, score: 87, luxury: false },
    { name: 'InterContinental', stars: 5, basePrice: 280, score: 89, luxury: false },
    { name: 'Kimpton Hotel', stars: 4, basePrice: 195, score: 89, luxury: false },

    // Budget-friendly for Base tier
    { name: 'Holiday Inn Express', stars: 3, basePrice: 95, score: 84, luxury: false },
    { name: 'Hampton Inn', stars: 3, basePrice: 85, score: 83, luxury: false },
    { name: 'Courtyard by Marriott', stars: 3, basePrice: 110, score: 85, luxury: false },
    { name: 'Hyatt Place', stars: 3, basePrice: 105, score: 84, luxury: false },
    { name: 'Best Western Plus', stars: 3, basePrice: 75, score: 81, luxury: false },
  ];

  return hotels.map((h, i) => {
    const priceVariance = Math.random() * 50 - 25;
    const pricePerNight = Math.round(h.basePrice + priceVariance);

    return {
      id: `mock_${i}_${Date.now()}`,
      name: h.name,
      starRating: h.stars,
      reviewScore: h.score,
      pricePerNight,
      totalPrice: pricePerNight * nights,
      currency: 'USD',
      roomType: h.stars >= 5 ? 'Deluxe Suite' : h.stars >= 4 ? 'Premium Room' : 'Standard Room',
      freeCancellation: h.stars >= 4,
      breakfastIncluded: h.stars >= 5,
      photo: `https://picsum.photos/seed/hotel${i + 100}/400/300`,
      isLuxuryBrand: h.luxury,
    };
  });
}
