# TakeMeTo75

> One-click booking for spontaneous trips to 75°F weather. Flight + Hotel packages leaving within 72 hours.

## Overview

TakeMeTo75 auto-detects your nearest airport and shows destinations with perfect weather (69-78°F). Pick a tier (Base/Premium/Luxe), and Claude AI selects the optimal flight + hotel combination. Book with one click.

## Tech Stack

- **Frontend:** Next.js 14 (App Router), React 18, Tailwind CSS
- **APIs:**
  - **Flights:** [Duffel](https://duffel.com) - 300+ airlines, direct booking
  - **Hotels:** [Booking.com Demand API](https://developers.booking.com/demand) - 28M+ properties
  - **Weather:** [WeatherAPI.com](https://weatherapi.com) - 7-day forecasts
  - **AI Selection:** [Claude](https://anthropic.com) - Tier-based optimization

## Architecture

```
User lands → Geolocation detects airport (JFK)
    ↓
/api/destinations
    - WeatherAPI: Find 75° destinations
    - Return top 10 by distance
    ↓
User selects destination + tier
    ↓
/api/search
    - Duffel: Search flights (cabin class by tier)
    - Booking.com: Search hotels (stars by tier, 8.0+ reviews)
    - Claude AI: Select best combination for tier
    ↓
User clicks "Book"
    ↓
/api/book
    - Duffel: Create flight order
    - Booking.com: Create hotel order (or deep link)
    - Return confirmation + 1-hour refund window
```

## Tier Logic

| Tier | Flight | Hotel | Optimization |
|------|--------|-------|--------------|
| **Base** | Economy | 3-star, 8.0+ | Minimize total cost |
| **Premium** | Premium Economy | 4-star, 8.5+ | Balance comfort/cost |
| **Luxe** | Business | 5-star, 9.0+ | Best experience |

## Setup

### 1. Clone and Install

```bash
git clone <repo>
cd takemeto75
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
# Weather (free tier: 1M calls/month)
# https://www.weatherapi.com/
WEATHER_API_KEY=your_key

# Duffel (flights)
# https://app.duffel.com/join
DUFFEL_API_TOKEN=duffel_test_xxx

# Booking.com (requires Managed Affiliate Partner status)
# https://partnerships.booking.com/
BOOKING_API_KEY=your_key
BOOKING_AFFILIATE_ID=your_id

# Claude AI
# https://console.anthropic.com/
ANTHROPIC_API_KEY=sk-ant-xxx
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## API Reference

### GET /api/destinations

Returns destinations with 75°F weather sorted by distance.

**Query Params:**
- `lat` - User latitude (default: 40.7128)
- `lon` - User longitude (default: -74.0060)
- `airport` - Override with specific airport code

**Response:**
```json
{
  "destinations": [...],
  "userAirport": { "code": "JFK", ... },
  "dates": { "checkIn": "2024-01-15", ... }
}
```

### POST /api/search

Search flights + hotels for a destination.

**Body:**
```json
{
  "originAirport": "JFK",
  "destinationCity": "San Diego",
  "tiers": ["base", "premium", "luxe"]
}
```

**Response:**
```json
{
  "packages": {
    "base": { "flight": {...}, "hotel": {...}, "totalPrice": 847 },
    "premium": {...},
    "luxe": {...}
  },
  "destination": {...},
  "dates": {...}
}
```

### POST /api/book

Create a booking.

**Body:**
```json
{
  "tripPackage": {...},
  "passenger": {
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "dateOfBirth": "1990-01-15",
    "gender": "male"
  }
}
```

### DELETE /api/book

Cancel within 1-hour window.

**Body:**
```json
{
  "bookingId": "bkg_xxx"
}
```

## Revenue Model

| Source | Rate | Per $1,500 Booking |
|--------|------|-------------------|
| Flight markup | $25-75 | $50 |
| Hotel commission | 15-25% | $75 |
| **Total** | | **~$125** |

## Development Notes

### Mock Data

Without API keys, the app uses mock data for:
- Weather (based on latitude)
- Flights (3 airlines per search)
- Hotels (3-6 properties per search)

### Booking.com Access

Full order creation requires "Managed Affiliate Partner" status. Without it:
- Search works via public API
- Booking falls back to deep links

Apply at: https://partnerships.booking.com/

### Duffel Sandbox

Test bookings use Duffel's sandbox:
- Unlimited test balance
- Mock airline: "Duffel Airways" (LHR ↔ JFK)
- Real airlines available in sandbox

## Production Checklist

- [ ] Duffel: Complete KYC, connect Stripe for payments
- [ ] Booking.com: Get Managed Affiliate approval
- [ ] Add Redis/DB for booking storage (currently in-memory)
- [ ] Implement Duffel Links for hosted checkout
- [ ] Add webhook handlers for order confirmations
- [ ] Set up error monitoring (Sentry)
- [ ] Add analytics (Mixpanel/Amplitude)

## File Structure

```
takemeto75/
├── app/
│   ├── api/
│   │   ├── destinations/route.ts  # Weather + destination matching
│   │   ├── search/route.ts        # Flight + hotel search
│   │   └── book/route.ts          # Booking creation/cancellation
│   ├── globals.css                # Tailwind + custom styles
│   ├── layout.tsx                 # Root layout
│   └── page.tsx                   # Main UI
├── lib/
│   ├── types.ts                   # TypeScript types
│   ├── destinations.ts            # Destination database
│   ├── weather.ts                 # WeatherAPI client
│   ├── duffel.ts                  # Duffel flights client
│   ├── booking.ts                 # Booking.com client
│   ├── ai-selector.ts             # Claude tier selection
│   └── utils.ts                   # Utility functions
├── .env.example                   # Environment template
├── package.json
├── tailwind.config.js
└── tsconfig.json
```

## License

MIT
