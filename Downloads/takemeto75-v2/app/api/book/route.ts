import { NextRequest, NextResponse } from 'next/server';
import { createFlightOrder, cancelFlightOrder } from '@/lib/duffel';
import { createHotelOrder, generateBookingDeepLink } from '@/lib/booking';
import { getRefundDeadline, isRefundExpired } from '@/lib/utils';
import { BookingRequest, BookingResult, TripPackage } from '@/lib/types';

export const runtime = 'edge';

// In-memory store for bookings (use Redis/DB in production)
const bookings = new Map<string, {
  tripPackage: TripPackage;
  flightOrderId?: string;
  hotelOrderId?: string;
  refundDeadline: string;
  status: 'pending' | 'confirmed' | 'cancelled';
}>();

/**
 * POST /api/book
 * 
 * Create a booking for a trip package
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tripPackage, passenger } = body as {
      tripPackage: TripPackage;
      passenger: BookingRequest['passenger'];
    };

    if (!tripPackage || !passenger) {
      return NextResponse.json(
        { error: 'tripPackage and passenger required' },
        { status: 400 }
      );
    }

    // Create flight booking
    const flightResult = await createFlightOrder(
      tripPackage.flight.id,
      passenger,
      tripPackage.flight.price.toFixed(2),
      tripPackage.flight.currency
    );

    if (!flightResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: flightResult.error || 'Flight booking failed' 
        },
        { status: 500 }
      );
    }

    // Create hotel booking (or get deep link)
    const hotelResult = await createHotelOrder(
      tripPackage.hotel.id,
      `prod_${tripPackage.hotel.id}`, // Product ID
      tripPackage.dates.checkIn,
      tripPackage.dates.checkOut,
      {
        firstName: passenger.firstName,
        lastName: passenger.lastName,
        email: passenger.email,
        phone: passenger.phone,
      }
    );

    // Generate booking ID
    const bookingId = `bkg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const refundDeadline = getRefundDeadline();

    // Store booking
    bookings.set(bookingId, {
      tripPackage,
      flightOrderId: flightResult.bookingRef,
      hotelOrderId: hotelResult.bookingRef,
      refundDeadline,
      status: 'confirmed',
    });

    const result: BookingResult = {
      success: true,
      flightBookingRef: flightResult.bookingRef,
      hotelBookingRef: hotelResult.bookingRef,
      hotelConfirmationUrl: hotelResult.checkoutUrl,
      refundDeadline,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Booking API error:', error);
    return NextResponse.json(
      { success: false, error: 'Booking failed' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/book
 * 
 * Cancel a booking (within 1-hour window)
 */
export async function DELETE(request: NextRequest) {
  try {
    const { bookingId } = await request.json();

    if (!bookingId) {
      return NextResponse.json(
        { error: 'bookingId required' },
        { status: 400 }
      );
    }

    const booking = bookings.get(bookingId);
    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Check refund window
    if (isRefundExpired(booking.refundDeadline)) {
      return NextResponse.json(
        { 
          error: 'Refund window expired', 
          refundDeadline: booking.refundDeadline 
        },
        { status: 400 }
      );
    }

    // Cancel flight
    if (booking.flightOrderId) {
      const cancelResult = await cancelFlightOrder(booking.flightOrderId);
      if (!cancelResult.success) {
        return NextResponse.json(
          { error: 'Failed to cancel flight' },
          { status: 500 }
        );
      }
    }

    // Update booking status
    booking.status = 'cancelled';
    bookings.set(bookingId, booking);

    return NextResponse.json({ 
      success: true, 
      message: 'Booking cancelled and refund initiated' 
    });
  } catch (error) {
    console.error('Cancel booking error:', error);
    return NextResponse.json(
      { error: 'Cancellation failed' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/book
 * 
 * Get booking status
 */
export async function GET(request: NextRequest) {
  const bookingId = request.nextUrl.searchParams.get('id');

  if (!bookingId) {
    return NextResponse.json(
      { error: 'Booking ID required' },
      { status: 400 }
    );
  }

  const booking = bookings.get(bookingId);
  if (!booking) {
    return NextResponse.json(
      { error: 'Booking not found' },
      { status: 404 }
    );
  }

  const refundExpired = isRefundExpired(booking.refundDeadline);

  return NextResponse.json({
    bookingId,
    status: booking.status,
    tripPackage: booking.tripPackage,
    flightOrderId: booking.flightOrderId,
    hotelOrderId: booking.hotelOrderId,
    refundDeadline: booking.refundDeadline,
    refundAvailable: !refundExpired && booking.status === 'confirmed',
  });
}
