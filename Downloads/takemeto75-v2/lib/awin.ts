// AWIN Affiliate Link Generator for Booking.com

const AWIN_PUBLISHER_ID = '2705974';
const BOOKING_ADVERTISER_ID = '6776';

/**
 * Generate AWIN-tracked Booking.com search URL
 */
export function generateBookingSearchLink(
  city: string,
  checkIn: string,
  checkOut: string,
  guests: number = 2,
  rooms: number = 1
): string {
  const bookingParams = new URLSearchParams({
    ss: city,
    checkin: checkIn,
    checkout: checkOut,
    group_adults: guests.toString(),
    no_rooms: rooms.toString(),
    selected_currency: 'USD',
  });

  const bookingUrl = `https://www.booking.com/searchresults.html?${bookingParams.toString()}`;

  return wrapWithAwin(bookingUrl);
}

/**
 * Generate AWIN-tracked Booking.com hotel page URL
 */
export function generateBookingHotelLink(
  hotelName: string,
  city: string,
  checkIn: string,
  checkOut: string,
  guests: number = 2,
  rooms: number = 1
): string {
  // Search for specific hotel
  const bookingParams = new URLSearchParams({
    ss: `${hotelName}, ${city}`,
    checkin: checkIn,
    checkout: checkOut,
    group_adults: guests.toString(),
    no_rooms: rooms.toString(),
    selected_currency: 'USD',
  });

  const bookingUrl = `https://www.booking.com/searchresults.html?${bookingParams.toString()}`;

  return wrapWithAwin(bookingUrl);
}

/**
 * Wrap any Booking.com URL with AWIN tracking
 */
export function wrapWithAwin(destinationUrl: string): string {
  const encodedUrl = encodeURIComponent(destinationUrl);
  return `https://www.awin1.com/cread.php?awinmid=${BOOKING_ADVERTISER_ID}&awinaffid=${AWIN_PUBLISHER_ID}&ued=${encodedUrl}`;
}
