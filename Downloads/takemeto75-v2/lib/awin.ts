// AWIN Affiliate Links for Booking.com
const AWIN_PUBLISHER_ID = '2705974';
const BOOKING_ADVERTISER_ID = '6776';

export function makeAwinUrl(hotelName: string, city: string): string {
  const searchQuery = encodeURIComponent(`${hotelName}, ${city}`);
  const bookingUrl = `https://www.booking.com/searchresults.html?ss=${searchQuery}&selected_currency=USD`;
  return `https://www.awin1.com/cread.php?awinmid=${BOOKING_ADVERTISER_ID}&awinaffid=${AWIN_PUBLISHER_ID}&ued=${encodeURIComponent(bookingUrl)}`;
}
