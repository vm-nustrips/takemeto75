import { FlightOffer } from './types';

const DUFFEL_API_TOKEN = process.env.DUFFEL_API_TOKEN || '';

export async function searchFlights(
  origin: string,
  destination: string,
  departureDate: string,
  returnDate: string,
  passengers: number = 1
): Promise<FlightOffer[]> {
  if (!DUFFEL_API_TOKEN) {
    return getMockFlights(departureDate);
  }

  try {
    const response = await fetch('https://api.duffel.com/air/offer_requests', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DUFFEL_API_TOKEN}`,
        'Duffel-Version': '2024-02-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: {
          slices: [
            { origin, destination, departure_date: departureDate },
            { origin: destination, destination: origin, departure_date: returnDate },
          ],
          passengers: Array(passengers).fill({ type: 'adult' }),
          cabin_class: 'economy',
        },
      }),
    });

    if (!response.ok) {
      console.log('Duffel API error, using mock data');
      return getMockFlights(departureDate);
    }

    const data = await response.json();
    const offers = data.data?.offers || [];

    return offers.slice(0, 15).map((offer: {
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

      return {
        id: offer.id,
        airline: offer.owner.name,
        departureTime: firstSeg.departing_at,
        arrivalTime: lastSeg.arriving_at,
        duration: calculateDuration(firstSeg.departing_at, lastSeg.arriving_at),
        stops: outbound.segments.length - 1,
        price: parseFloat(offer.total_amount),
        currency: offer.total_currency,
        cabin,
      };
    });
  } catch (error) {
    console.error('Duffel error:', error);
    return getMockFlights(departureDate);
  }
}

function calculateDuration(dep: string, arr: string): string {
  const diff = new Date(arr).getTime() - new Date(dep).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${minutes}m`;
}

function getMockFlights(departureDate: string): FlightOffer[] {
  const airlines = ['United', 'Delta', 'American', 'JetBlue', 'Southwest', 'Alaska'];
  const cabins = ['Economy', 'Economy', 'Economy', 'Premium Economy', 'Business'];
  const flights: FlightOffer[] = [];
  
  for (let i = 0; i < 12; i++) {
    const cabin = cabins[Math.floor(Math.random() * cabins.length)];
    const basePrice = cabin === 'Business' ? 800 : cabin === 'Premium Economy' ? 450 : 250;
    const stops = Math.random() > 0.6 ? 0 : Math.random() > 0.5 ? 1 : 2;
    const hour = 6 + Math.floor(Math.random() * 14);
    
    flights.push({
      id: `mock_flight_${i}_${Date.now()}`,
      airline: airlines[Math.floor(Math.random() * airlines.length)],
      departureTime: `${departureDate}T${hour.toString().padStart(2, '0')}:00:00`,
      arrivalTime: `${departureDate}T${(hour + 4 + stops * 2).toString().padStart(2, '0')}:30:00`,
      duration: `${4 + stops * 2}h ${Math.floor(Math.random() * 60)}m`,
      stops,
      price: Math.round(basePrice + Math.random() * 300 - stops * 30),
      currency: 'USD',
      cabin,
    });
  }
  
  return flights.sort((a, b) => a.price - b.price);
}
