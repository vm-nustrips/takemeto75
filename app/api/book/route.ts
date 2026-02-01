import { NextResponse } from 'next/server';

const DUFFEL_API_TOKEN = process.env.DUFFEL_API_TOKEN || '';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { flightId, isRoundTrip } = body;

    // Check if this is mock data
    if (flightId.startsWith('mock_')) {
      return NextResponse.json({
        success: false,
        error: 'Demo mode - real booking requires live flight data',
      });
    }

    if (!DUFFEL_API_TOKEN) {
      return NextResponse.json({
        success: false,
        error: 'Booking not configured',
      });
    }

    // Create Duffel Links checkout session
    const response = await fetch('https://api.duffel.com/links/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DUFFEL_API_TOKEN}`,
        'Duffel-Version': 'v2',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: {
          offer_id: flightId,
          success_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://takemeto75.vercel.app'}?booking=success`,
          failure_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://takemeto75.vercel.app'}?booking=failed`,
          abandonment_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://takemeto75.vercel.app'}?booking=cancelled`,
        },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Duffel Links error:', data);
      return NextResponse.json({
        success: false,
        error: data.errors?.[0]?.message || 'Could not create checkout',
      });
    }

    return NextResponse.json({
      success: true,
      checkoutUrl: data.data?.url,
    });
  } catch (error) {
    console.error('Book API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Booking failed',
    }, { status: 500 });
  }
}
