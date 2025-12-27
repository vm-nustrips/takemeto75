import { TravelDates } from './types';

/**
 * Get travel dates for next 72 hours
 * Departure: Tomorrow
 * Return: 3 nights later
 */
export function getTravelDates(): TravelDates {
  const now = new Date();
  
  // Check-in tomorrow
  const checkIn = new Date(now);
  checkIn.setDate(checkIn.getDate() + 1);
  checkIn.setHours(0, 0, 0, 0);
  
  // Check-out 3 nights later
  const checkOut = new Date(checkIn);
  checkOut.setDate(checkOut.getDate() + 3);
  
  const formatDisplay = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };
  
  const formatISO = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  return {
    checkIn: formatISO(checkIn),
    checkOut: formatISO(checkOut),
    display: {
      checkIn: formatDisplay(checkIn),
      checkOut: formatDisplay(checkOut),
    },
    nights: 3,
  };
}

/**
 * Format price with currency symbol
 */
export function formatPrice(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format datetime for display
 */
export function formatDateTime(isoString: string): {
  date: string;
  time: string;
  full: string;
} {
  const date = new Date(isoString);
  
  return {
    date: date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    }),
    time: date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }),
    full: date.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }),
  };
}

/**
 * Format duration string
 */
export function formatDuration(duration: string): string {
  // Handle ISO 8601 duration (PT4H30M) or already formatted (4h 30m)
  if (duration.includes('h') && duration.includes('m')) {
    return duration;
  }
  
  const match = duration.match(/PT(\d+)H(\d+)?M?/);
  if (match) {
    const hours = match[1];
    const minutes = match[2] || '0';
    return `${hours}h ${minutes}m`;
  }
  
  return duration;
}

/**
 * Format distance in miles
 */
export function formatDistance(miles: number): string {
  if (miles < 100) {
    return `${Math.round(miles)} mi`;
  }
  return `${Math.round(miles).toLocaleString()} mi`;
}

/**
 * Calculate nights between two dates
 */
export function calculateNights(checkIn: string, checkOut: string): number {
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const diff = end.getTime() - start.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

/**
 * Generate a unique ID
 */
export function generateId(prefix: string = 'id'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Get refund deadline (1 hour from now)
 */
export function getRefundDeadline(): string {
  const deadline = new Date();
  deadline.setHours(deadline.getHours() + 1);
  return deadline.toISOString();
}

/**
 * Check if refund deadline has passed
 */
export function isRefundExpired(deadline: string): boolean {
  return new Date() > new Date(deadline);
}

/**
 * Format time remaining until deadline
 */
export function formatTimeRemaining(deadline: string): string {
  const now = new Date();
  const end = new Date(deadline);
  const diff = end.getTime() - now.getTime();
  
  if (diff <= 0) return 'Expired';
  
  const minutes = Math.floor(diff / (1000 * 60));
  if (minutes < 60) {
    return `${minutes} min remaining`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m remaining`;
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

/**
 * Capitalize first letter
 */
export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * Convert temperature between F and C
 */
export function fahrenheitToCelsius(f: number): number {
  return Math.round((f - 32) * (5 / 9));
}

export function celsiusToFahrenheit(c: number): number {
  return Math.round(c * (9 / 5) + 32);
}
