import { HotelOffer } from './types';

export async function searchHotels(
  lat: number,
  lon: number,
  checkIn: string,
  checkOut: string
): Promise<HotelOffer[]> {
  // Using mock data - Duffel Stays or Booking.com integration later
  return getMockHotels(checkIn, checkOut);
}

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
      id: `hotel_${i}_${Date.now()}`,
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
