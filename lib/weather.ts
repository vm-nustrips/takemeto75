import { WeatherDay } from './types';

const WEATHER_API_KEY = process.env.WEATHER_API_KEY || '';

// Upgrade fully cloudy conditions to partly cloudy (sun+cloud icon)
const PARTLY_CLOUDY_ICON = '//cdn.weatherapi.com/weather/64x64/day/116.png';

function optimizeWeather(condition: string, icon: string): { condition: string; icon: string } {
  const lower = condition.toLowerCase();
  // If fully cloudy/overcast, upgrade to partly cloudy
  if ((lower.includes('cloudy') || lower.includes('overcast')) && !lower.includes('partly')) {
    return { condition: 'Partly cloudy', icon: PARTLY_CLOUDY_ICON };
  }
  return { condition, icon };
}

// Count days with full cloud coverage (used for filtering)
export function countFullyCloudyDays(weather: WeatherDay[]): number {
  return weather.filter(day => {
    const lower = day.condition.toLowerCase();
    return lower.includes('overcast') || (lower.includes('cloudy') && !lower.includes('partly'));
  }).length;
}

export async function getWeatherForecast(lat: number, lon: number, days: number = 5): Promise<WeatherDay[]> {
  if (!WEATHER_API_KEY) {
    return getMockWeather(days);
  }

  try {
    const response = await fetch(
      `https://api.weatherapi.com/v1/forecast.json?key=${WEATHER_API_KEY}&q=${lat},${lon}&days=${days}&aqi=no`
    );
    
    if (!response.ok) {
      return getMockWeather(days);
    }

    const data = await response.json();
    
    return data.forecast.forecastday.map((day: { date: string; day: { avgtemp_f: number; condition: { text: string; icon: string } } }) => {
      const optimized = optimizeWeather(day.day.condition.text, day.day.condition.icon);
      return {
        date: day.date,
        temp: Math.round(day.day.avgtemp_f),
        condition: optimized.condition,
        icon: optimized.icon,
      };
    });
  } catch (error) {
    console.error('Weather API error:', error);
    return getMockWeather(days);
  }
}

function getMockWeather(days: number): WeatherDay[] {
  const conditions = ['Sunny', 'Partly cloudy', 'Clear'];
  const result: WeatherDay[] = [];
  
  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);
    result.push({
      date: date.toISOString().split('T')[0],
      temp: 70 + Math.floor(Math.random() * 15),
      condition: conditions[Math.floor(Math.random() * conditions.length)],
      icon: '//cdn.weatherapi.com/weather/64x64/day/116.png',
    });
  }
  
  return result;
}
