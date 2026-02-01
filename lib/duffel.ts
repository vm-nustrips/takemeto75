import { FlightOffer } from './types';

const DUFFEL_API_TOKEN = process.env.DUFFEL_API_TOKEN || '';

type CabinClass = 'economy' | 'premium_economy' | 'business' | 'first';

async function searchFlightsForCabin(
  origin: string,
  destination: string,
  departureDate: string,
  returnDate: string,
  passengers: number,
  cabinClass: CabinClass
): Promise<FlightOffer[]> {
  if (!DUFFEL_API_TOKEN) {
    console.log('[Duffel] No API token - using mock data');
    return [];
  }

  try {
    console.log(`[Duffel] Searching ${origin} -> ${destination}, ${cabinClass} class`);
    
    const response = await fetch('https://api.duffel.com/air/offer_requests', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DUFFEL_API_TOKEN}`,
        'Duffel-Version': 'v2',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: {
          slices: [
            { origin, destination, departure_date: departureDate },
            { origin: destination, destination: origin, departure_date: returnDate },
          ],
          passengers: Array(passengers).fill({ type: 'adult' }),
          cabin_class: cabinClass,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.log(`[Duffel] API error ${response.status}: ${errorText.slice(0, 200)}`);
      return [];
    }

    const data = await response.json();
    const offers = data.data?.offers || [];
    console.log(`[Duffel] Got ${offers.length} offers for ${origin} -> ${destination}`);

    return offers.slice(0, 10).map((offer: {
      id: string;
      owner: { name: string };
      slices: Array<{ 
        segments: Array<{ 
          departing_at: string; 
          arriving_at: string;
          passengers: Array<{ cabin_class_marketing_name: string }>;
        }> 
      }>;
      total_amount: string;
      total_currency: string;
    }) => {
      const outbound = offer.slices[0];
      const firstSeg = outbound.segments[0];
      const lastSeg = outbound.segments[outbound.segments.length - 1];
      const cabin = firstSeg.passengers?.[0]?.cabin_class_marketing_name || 'Economy';
      const price = Math.round(parseFloat(offer.total_amount));
      
      console.log(`[Duffel] ${offer.owner.name} ${cabin} $${price} (${outbound.segments.length - 1} stops)`);

      return {
        id: offer.id,
        airline: offer.owner.name,
        departureTime: firstSeg.departing_at,
        arrivalTime: lastSeg.arriving_at,
        duration: calculateDuration(firstSeg.departing_at, lastSeg.arriving_at),
        stops: outbound.segments.length - 1,
        price,
        currency: offer.total_currency,
        cabin,
      };
    });
  } catch (error) {
    console.error('Duffel error for cabin', cabinClass, error);
    return [];
  }
}

export async function searchFlights(
  origin: string,
  destination: string,
  departureDate: string,
  returnDate: string,
  passengers: number = 1,
  tier: 'base' | 'premium' | 'luxe' = 'base'
): Promise<FlightOffer[]> {
  if (!DUFFEL_API_TOKEN) {
    return getMockFlights(departureDate, tier);
  }

  let flights: FlightOffer[] = [];

  switch (tier) {
    case 'luxe':
      // Search business first, then premium economy, fallback to economy
      const [businessFlights, premiumFlightsLuxe] = await Promise.all([
        searchFlightsForCabin(origin, destination, departureDate, returnDate, passengers, 'business'),
        searchFlightsForCabin(origin, destination, departureDate, returnDate, passengers, 'premium_economy'),
      ]);
      flights = [...businessFlights, ...premiumFlightsLuxe];
      // If no premium options, fall back to economy
      if (flights.length === 0) {
        flights = await searchFlightsForCabin(origin, destination, departureDate, returnDate, passengers, 'economy');
      }
      break;

    case 'premium':
      // Search both economy and premium economy
      const [economyFlightsPrem, premiumFlightsPrem] = await Promise.all([
        searchFlightsForCabin(origin, destination, departureDate, returnDate, passengers, 'economy'),
        searchFlightsForCabin(origin, destination, departureDate, returnDate, passengers, 'premium_economy'),
      ]);
      flights = [...economyFlightsPrem, ...premiumFlightsPrem];
      break;

    case 'base':
    default:
      // Economy only
      flights = await searchFlightsForCabin(origin, destination, departureDate, returnDate, passengers, 'economy');
      break;
  }

  if (flights.length === 0) {
    return getMockFlights(departureDate, tier);
  }

  return flights;
}

function calculateDuration(dep: string, arr: string): string {
  const diff = new Date(arr).getTime() - new Date(dep).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${minutes}m`;
}

function getMockFlights(departureDate: string, tier: 'base' | 'premium' | 'luxe' = 'base'): FlightOffer[] {
  const airlines = ['United', 'Delta', 'American', 'JetBlue', 'Alaska'];
  const flights: FlightOffer[] = [];
  
  // Cabin distribution based on tier
  let cabins: Array<{ name: string; basePrice: number }>;
  
  switch (tier) {
    case 'luxe':
      cabins = [
        { name: 'Business', basePrice: 950 },
        { name: 'Business', basePrice: 1100 },
        { name: 'Business', basePrice: 1050 },
        { name: 'Premium Economy', basePrice: 550 },
        { name: 'Premium Economy', basePrice: 600 },
        { name: 'Premium Economy', basePrice: 520 },
      ];
      break;
    case 'premium':
      cabins = [
        { name: 'Economy', basePrice: 280 },
        { name: 'Economy', basePrice: 320 },
        { name: 'Economy', basePrice: 350 },
        { name: 'Premium Economy', basePrice: 550 },
        { name: 'Premium Economy', basePrice: 600 },
        { name: 'Premium Economy', basePrice: 480 },
      ];
      break;
    case 'base':
    default:
      cabins = [
        { name: 'Economy', basePrice: 280 },
        { name: 'Economy', basePrice: 320 },
        { name: 'Economy', basePrice: 250 },
        { name: 'Economy', basePrice: 380 },
        { name: 'Economy', basePrice: 300 },
        { name: 'Economy', basePrice: 340 },
      ];
      break;
  }
  
  for (let i = 0; i < cabins.length; i++) {
    const cabin = cabins[i];
    const stops = cabin.name === 'Business' ? 0 : (Math.random() > 0.5 ? 0 : Math.random() > 0.5 ? 1 : 2);
    const hour = 6 + Math.floor(Math.random() * 14);
    const priceVariation = Math.random() * 200 - 50;
    
    flights.push({
      id: `mock_flight_${i}_${Date.now()}`,
      airline: airlines[Math.floor(Math.random() * airlines.length)],
      departureTime: `${departureDate}T${hour.toString().padStart(2, '0')}:00:00`,
      arrivalTime: `${departureDate}T${(hour + 4 + stops * 2).toString().padStart(2, '0')}:30:00`,
      duration: `${4 + stops * 2}h ${Math.floor(Math.random() * 60)}m`,
      stops,
      price: Math.round(cabin.basePrice + priceVariation),
      currency: 'USD',
      cabin: cabin.name,
    });
  }
  
  return flights.sort((a, b) => a.price - b.price);
}
