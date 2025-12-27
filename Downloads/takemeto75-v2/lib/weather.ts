import { WeatherData, DayForecast } from './types';

const WEATHER_API_KEY = process.env.WEATHER_API_KEY || '';
const BASE_URL = 'https://api.weatherapi.com/v1';

interface WeatherAPIResponse {
  location: {
    name: string;
    country: string;
  };
  current: {
    temp_f: number;
    condition: {
      text: string;
      code: number;
    };
    humidity: number;
  };
  forecast: {
    forecastday: Array<{
      date: string;
      day: {
        maxtemp_f: number;
        mintemp_f: number;
        avgtemp_f: number;
        condition: {
          text: string;
          code: number;
        };
      };
    }>;
  };
}

// Weather codes that are considered "sunny" or nice
const SUNNY_CODES = [
  1000, // Sunny / Clear
  1003, // Partly cloudy
  1006, // Cloudy (acceptable)
];

/**
 * Check if weather code indicates sunny/nice weather
 */
function isSunnyWeather(code: number): boolean {
  return SUNNY_CODES.includes(code);
}

/**
 * Fetch weather forecast for a location
 * Returns 7-day forecast with averaged data
 */
export async function getWeatherForecast(
  lat: number,
  lon: number,
  days: number = 7
): Promise<WeatherData> {
  if (!WEATHER_API_KEY) {
    // Return mock data if no API key (for development)
    return getMockWeather(lat, lon);
  }

  try {
    const response = await fetch(
      `${BASE_URL}/forecast.json?key=${WEATHER_API_KEY}&q=${lat},${lon}&days=${days}&aqi=no`
    );

    if (!response.ok) {
      console.error('WeatherAPI error:', response.status);
      return getMockWeather(lat, lon);
    }

    const data: WeatherAPIResponse = await response.json();
    
    // Calculate average temperature across forecast days
    const avgTemp = Math.round(
      data.forecast.forecastday.reduce(
        (sum, day) => sum + day.day.avgtemp_f,
        0
      ) / data.forecast.forecastday.length
    );

    // Check if most days are sunny
    const sunnyDays = data.forecast.forecastday.filter((day) =>
      isSunnyWeather(day.day.condition.code)
    ).length;
    const isSunny = sunnyDays >= Math.ceil(data.forecast.forecastday.length / 2);

    // Map forecast days
    const forecast: DayForecast[] = data.forecast.forecastday.map((day) => ({
      date: day.date,
      high: Math.round(day.day.maxtemp_f),
      low: Math.round(day.day.mintemp_f),
      condition: day.day.condition.text,
      isSunny: isSunnyWeather(day.day.condition.code),
    }));

    return {
      avgTemp,
      condition: data.current.condition.text,
      isSunny,
      isInRange: avgTemp >= 69 && avgTemp <= 78,
      humidity: data.current.humidity,
      forecast,
    };
  } catch (error) {
    console.error('Weather fetch error:', error);
    return getMockWeather(lat, lon);
  }
}

/**
 * Generate mock weather data for development/testing
 * Uses location latitude to simulate realistic temperatures
 */
function getMockWeather(lat: number, lon: number): WeatherData {
  // Simulate temperature based on latitude and time of year
  // Closer to equator = warmer, higher latitude = colder
  const latFactor = Math.abs(lat);
  const baseTemp = 85 - latFactor * 0.8;
  
  // Add some randomness
  const variance = (Math.random() - 0.5) * 10;
  const avgTemp = Math.round(baseTemp + variance);
  
  // Southern hemisphere is opposite season
  const isSouthern = lat < 0;
  const currentMonth = new Date().getMonth();
  const isSummer = isSouthern 
    ? (currentMonth >= 10 || currentMonth <= 2) 
    : (currentMonth >= 4 && currentMonth <= 8);
  
  const seasonAdjust = isSummer ? 5 : -5;
  const finalTemp = Math.round(avgTemp + seasonAdjust);
  
  const isSunny = Math.random() > 0.3;
  
  // Generate 7-day forecast
  const forecast: DayForecast[] = [];
  const today = new Date();
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    
    const dayVariance = (Math.random() - 0.5) * 6;
    const high = Math.round(finalTemp + 5 + dayVariance);
    const low = Math.round(finalTemp - 8 + dayVariance);
    
    forecast.push({
      date: date.toISOString().split('T')[0],
      high,
      low,
      condition: isSunny ? 'Sunny' : 'Partly Cloudy',
      isSunny: Math.random() > 0.25,
    });
  }

  return {
    avgTemp: finalTemp,
    condition: isSunny ? 'Sunny' : 'Partly Cloudy',
    isSunny,
    isInRange: finalTemp >= 69 && finalTemp <= 78,
    humidity: Math.round(50 + Math.random() * 30),
    forecast,
  };
}

/**
 * Get weather for multiple destinations in parallel
 */
export async function getWeatherForDestinations(
  destinations: Array<{ lat: number; lon: number; city: string }>
): Promise<Map<string, WeatherData>> {
  const results = new Map<string, WeatherData>();
  
  // Fetch weather in parallel, but limit concurrency
  const batchSize = 10;
  for (let i = 0; i < destinations.length; i += batchSize) {
    const batch = destinations.slice(i, i + batchSize);
    const weatherPromises = batch.map(async (dest) => {
      const weather = await getWeatherForecast(dest.lat, dest.lon);
      return { city: dest.city, weather };
    });
    
    const batchResults = await Promise.all(weatherPromises);
    batchResults.forEach(({ city, weather }) => {
      results.set(city, weather);
    });
  }
  
  return results;
}
