import { NextResponse } from 'next/server';
import { destinations } from '@/lib/destinations';
import { getWeatherForecast } from '@/lib/weather';
import { DestinationWithWeather } from '@/lib/types';

export async function GET() {
  try {
    // Fetch weather for all destinations
    const destinationsWithWeather: DestinationWithWeather[] = await Promise.all(
      destinations.map(async (dest) => {
        const weather = await getWeatherForecast(dest.lat, dest.lon, 5);
        const avgTemp = Math.round(
          weather.reduce((sum, day) => sum + day.temp, 0) / weather.length
        );
        return { ...dest, weather, avgTemp };
      })
    );

    // Filter destinations close to 75°F and sort by proximity to 75
    const perfectWeather = destinationsWithWeather
      .filter(d => d.avgTemp >= 68 && d.avgTemp <= 82)
      .sort((a, b) => Math.abs(75 - a.avgTemp) - Math.abs(75 - b.avgTemp))
      .slice(0, 3);

    // If we don't have 3 destinations in range, add closest ones
    if (perfectWeather.length < 3) {
      const remaining = destinationsWithWeather
        .filter(d => !perfectWeather.find(p => p.id === d.id))
        .sort((a, b) => Math.abs(75 - a.avgTemp) - Math.abs(75 - b.avgTemp));
      
      perfectWeather.push(...remaining.slice(0, 3 - perfectWeather.length));
    }

    return NextResponse.json({
      destinations: perfectWeather,
    });
  } catch (error) {
    console.error('Error fetching destinations:', error);
    
    // Return mock data on error
    const mockDestinations = destinations.slice(0, 3).map(dest => ({
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
