import { NextResponse } from 'next/server';
import { destinations } from '@/lib/destinations';
import { getWeatherForecast, countFullyCloudyDays } from '@/lib/weather';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

const MAX_CLOUDY_DAYS = 2;

// Airport coordinates for distance calculation
const airportCoords: Record<string, {lat: number; lon: number}> = {
  // US Airports
  ATL: { lat: 33.6407, lon: -84.4277 },
  AUS: { lat: 30.1975, lon: -97.6664 },
  BNA: { lat: 36.1263, lon: -86.6774 },
  BOS: { lat: 42.3656, lon: -71.0096 },
  BWI: { lat: 39.1754, lon: -76.6683 },
  CLE: { lat: 41.4117, lon: -81.8498 },
  CLT: { lat: 35.2140, lon: -80.9431 },
  CVG: { lat: 39.0488, lon: -84.6678 },
  DCA: { lat: 38.8512, lon: -77.0402 },
  DEN: { lat: 39.8561, lon: -104.6737 },
  DFW: { lat: 32.8998, lon: -97.0403 },
  DTW: { lat: 42.2124, lon: -83.3534 },
  EWR: { lat: 40.6895, lon: -74.1745 },
  FLL: { lat: 26.0726, lon: -80.1527 },
  HNL: { lat: 21.3187, lon: -157.9225 },
  IAD: { lat: 38.9531, lon: -77.4565 },
  IAH: { lat: 29.9902, lon: -95.3368 },
  IND: { lat: 39.7173, lon: -86.2944 },
  JAX: { lat: 30.4941, lon: -81.6879 },
  JFK: { lat: 40.6413, lon: -73.7781 },
  LAS: { lat: 36.0840, lon: -115.1537 },
  LAX: { lat: 33.9425, lon: -118.4081 },
  LGA: { lat: 40.7769, lon: -73.8740 },
  MCI: { lat: 39.2976, lon: -94.7139 },
  MCO: { lat: 28.4312, lon: -81.3081 },
  MDW: { lat: 41.7868, lon: -87.7522 },
  MIA: { lat: 25.7959, lon: -80.2870 },
  MSP: { lat: 44.8848, lon: -93.2223 },
  MSY: { lat: 29.9934, lon: -90.2580 },
  OAK: { lat: 37.7213, lon: -122.2208 },
  ORD: { lat: 41.9742, lon: -87.9073 },
  PBI: { lat: 26.6832, lon: -80.0956 },
  PDX: { lat: 45.5898, lon: -122.5951 },
  PHL: { lat: 39.8744, lon: -75.2424 },
  PHX: { lat: 33.4373, lon: -112.0078 },
  PIT: { lat: 40.4915, lon: -80.2329 },
  RDU: { lat: 35.8801, lon: -78.7880 },
  RSW: { lat: 26.5362, lon: -81.7552 },
  SAN: { lat: 32.7336, lon: -117.1897 },
  SAT: { lat: 29.5337, lon: -98.4698 },
  SEA: { lat: 47.4502, lon: -122.3088 },
  SFO: { lat: 37.6213, lon: -122.379 },
  SJC: { lat: 37.3639, lon: -121.9289 },
  SLC: { lat: 40.7899, lon: -111.9791 },
  SMF: { lat: 38.6954, lon: -121.5908 },
  SNA: { lat: 33.6757, lon: -117.8678 },
  STL: { lat: 38.7487, lon: -90.3700 },
  TPA: { lat: 27.9755, lon: -82.5332 },
  // International - Europe
  LHR: { lat: 51.4700, lon: -0.4543 },
  LGW: { lat: 51.1537, lon: -0.1821 },
  CDG: { lat: 49.0097, lon: 2.5479 },
  AMS: { lat: 52.3105, lon: 4.7683 },
  FRA: { lat: 50.0379, lon: 8.5622 },
  MUC: { lat: 48.3537, lon: 11.7750 },
  ZRH: { lat: 47.4582, lon: 8.5555 },
  FCO: { lat: 41.8003, lon: 12.2389 },
  MXP: { lat: 45.6306, lon: 8.7281 },
  BCN: { lat: 41.2974, lon: 2.0833 },
  MAD: { lat: 40.4983, lon: -3.5676 },
  LIS: { lat: 38.7756, lon: -9.1354 },
  ATH: { lat: 37.9364, lon: 23.9445 },
  VIE: { lat: 48.1103, lon: 16.5697 },
  CPH: { lat: 55.6180, lon: 12.6508 },
  ARN: { lat: 59.6498, lon: 17.9238 },
  OSL: { lat: 60.1976, lon: 11.1004 },
  HEL: { lat: 60.3172, lon: 24.9633 },
  DUB: { lat: 53.4264, lon: -6.2499 },
  EDI: { lat: 55.9508, lon: -3.3615 },
  BRU: { lat: 50.9014, lon: 4.4844 },
  PRG: { lat: 50.1008, lon: 14.2600 },
  WAW: { lat: 52.1657, lon: 20.9671 },
  IST: { lat: 41.2753, lon: 28.7519 },
  // International - Asia Pacific
  DEL: { lat: 28.5562, lon: 77.1000 },
  BOM: { lat: 19.0896, lon: 72.8656 },
  BLR: { lat: 13.1986, lon: 77.7066 },
  SIN: { lat: 1.3644, lon: 103.9915 },
  HKG: { lat: 22.3080, lon: 113.9185 },
  NRT: { lat: 35.7720, lon: 140.3929 },
  HND: { lat: 35.5494, lon: 139.7798 },
  ICN: { lat: 37.4602, lon: 126.4407 },
  PEK: { lat: 40.0799, lon: 116.6031 },
  PVG: { lat: 31.1443, lon: 121.8083 },
  BKK: { lat: 13.6900, lon: 100.7501 },
  CGK: { lat: -6.1256, lon: 106.6559 },
  KUL: { lat: 2.7456, lon: 101.7099 },
  SYD: { lat: -33.9399, lon: 151.1753 },
  MEL: { lat: -37.6690, lon: 144.8410 },
  AKL: { lat: -37.0082, lon: 174.7850 },
  // International - Americas & Middle East
  YYZ: { lat: 43.6777, lon: -79.6248 },
  YVR: { lat: 49.1947, lon: -123.1792 },
  MEX: { lat: 19.4363, lon: -99.0721 },
  GRU: { lat: -23.4356, lon: -46.4731 },
  EZE: { lat: -34.8222, lon: -58.5358 },
  BOG: { lat: 4.7016, lon: -74.1469 },
  SCL: { lat: -33.3930, lon: -70.7858 },
  DXB: { lat: 25.2532, lon: 55.3657 },
  DOH: { lat: 25.2731, lon: 51.6081 },
  TLV: { lat: 32.0055, lon: 34.8854 },
  JNB: { lat: -26.1367, lon: 28.2411 },
};

function getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  // Haversine formula for distance in km
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const origin = searchParams.get('origin') || 'SFO';
    const originCoords = airportCoords[origin] || airportCoords['SFO'];

    // Fetch weather for all destinations and calculate distance
    const destinationsWithWeather = await Promise.all(
      destinations.map(async (dest) => {
        const weather = await getWeatherForecast(dest.lat, dest.lon, 5);
        const avgTemp = Math.round(
          weather.reduce((sum, day) => sum + day.temp, 0) / weather.length
        );
        const distance = getDistance(originCoords.lat, originCoords.lon, dest.lat, dest.lon);
        return { ...dest, weather, avgTemp, distance };
      })
    );

    // Filter destinations close to 75°F and not too cloudy
    const validDestinations = destinationsWithWeather
      .filter(d => d.avgTemp >= 68 && d.avgTemp <= 82)
      .filter(d => countFullyCloudyDays(d.weather) <= MAX_CLOUDY_DAYS);

    // Score by: weather closeness to 75 (30%) + convenience/distance (70%)
    // Prioritize quick getaways - closer destinations that likely have nonstop flights
    const scored = validDestinations.map(d => {
      const weatherScore = 1 - Math.abs(75 - d.avgTemp) / 15;
      const dist = d.distance;
      // Heavily favor destinations within nonstop range (typically <6000km)
      // Very close (<1500km): 1.0 - quick weekend trips
      // Medium (1500-4000km): 0.9 - easy nonstop range
      // Far (4000-7000km): 0.6 - might still have nonstops
      // Very far (>7000km): 0.3 - likely requires connections
      const distanceScore = dist < 1500 ? 1.0 : dist < 4000 ? 0.9 : dist < 7000 ? 0.6 : 0.3;
      return { ...d, score: weatherScore * 0.3 + distanceScore * 0.7 };
    });

    // Sort by score and take top 6
    const topDestinations = scored
      .sort((a, b) => b.score - a.score)
      .slice(0, 6);

    // If we don't have 6, add more from remaining
    if (topDestinations.length < 6) {
      const remaining = destinationsWithWeather
        .filter(d => !topDestinations.find(p => p.id === d.id))
        .filter(d => countFullyCloudyDays(d.weather) <= MAX_CLOUDY_DAYS)
        .sort((a, b) => Math.abs(75 - a.avgTemp) - Math.abs(75 - b.avgTemp))
        .map(d => ({ ...d, score: 0 }));
      
      topDestinations.push(...remaining.slice(0, 6 - topDestinations.length));
    }

    return NextResponse.json({
      destinations: topDestinations,
    });
  } catch (error) {
    console.error('Error fetching destinations:', error);
    
    // Return mock data on error
    const mockDestinations = destinations.slice(0, 6).map(dest => ({
      ...dest,
      weather: Array(5).fill(null).map((_, i) => ({
        date: new Date(Date.now() + i * 86400000).toISOString().split('T')[0],
        temp: 72 + Math.floor(Math.random() * 8),
        condition: 'Sunny',
        icon: '//cdn.weatherapi.com/weather/64x64/day/113.png',
      })),
      avgTemp: 75,
    }));

    return NextResponse.json({
      destinations: mockDestinations,
    });
  }
}
