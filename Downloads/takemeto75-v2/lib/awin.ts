// AWIN Affiliate Link Generator
// Publisher: TakeMeTo75 (ID: 2705974)
// Advertiser: Booking.com North America (ID: 6776)

const PUBLISHER_ID = '2705974';
const BOOKING_ADVERTISER_ID = '6776';

/**
 * Generate an AWIN affiliate link to Booking.com for a specific hotel
 */
export function generateBookingLink(
  hotelName: string,
  city: string,
  checkIn: string,
  checkOut: string,
  guests: number = 2
): string {
  const query = `${hotelName}, ${city}`;
  const bookingUrl = `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(query)}&checkin=${checkIn}&checkout=${checkOut}&group_adults=${guests}&no_rooms=1`;
  return `https://www.awin1.com/cread.php?awinmid=${BOOKING_ADVERTISER_ID}&awinaffid=${PUBLISHER_ID}&ued=${encodeURIComponent(bookingUrl)}`;
}

/**
 * Generate a generic Booking.com search link for a city
 */
export function generateCitySearchLink(
  city: string,
  country: string,
  checkIn: string,
  checkOut: string,
  guests: number = 2
): string {
  const query = `${city}, ${country}`;
  const bookingUrl = `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(query)}&checkin=${checkIn}&checkout=${checkOut}&group_adults=${guests}&no_rooms=1`;
  return `https://www.awin1.com/cread.php?awinmid=${BOOKING_ADVERTISER_ID}&awinaffid=${PUBLISHER_ID}&ued=${encodeURIComponent(bookingUrl)}`;
}
