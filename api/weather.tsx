import { VercelRequest, VercelResponse } from '@vercel/node';
import { Redis } from '@upstash/redis';
import axios from 'axios';

const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

interface WeatherEntry {
  timestamp: number;
  temp: number;
  humidity: number;
  wind_speed: number;
  weather: string;
}

interface WeatherData {
  latest: {
    name: string;
    coord: { lat: number; lon: number };
    main: { temp: number; humidity: number; pressure: number; temp_min: number; temp_max: number; feels_like: number };
    weather: Array<{ description: string; icon: string; id: number; main: string }>;
    wind: { speed: number; deg: number };
    dt: number;
    sys: { country: string; sunrise: number; sunset: number };
    timezone: number;
    visibility: number;
  };
  history: WeatherEntry[];
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const cityParam = req.query.city;
  if (!cityParam || typeof cityParam !== 'string') {
    return res.status(400).json({ error: 'City parameter is required' });
  }
  const city = decodeURIComponent(cityParam);

  if (!OPENWEATHER_API_KEY) {
    return res.status(500).json({ error: 'OpenWeather API key is not configured' });
  }

  try {
    console.log(`Fetching weather data for city: ${city}`);
    console.log(`API Key present: ${!!OPENWEATHER_API_KEY}`);

    // Get current weather
    const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${OPENWEATHER_API_KEY}&units=metric`;
    console.log(`Requesting URL: ${weatherUrl.replace(OPENWEATHER_API_KEY, 'HIDDEN')}`);

    const currentWeatherResponse = await axios.get(weatherUrl);
    console.log('Weather API response received');

    // Get weather history from Redis
    const historyKey = `weather:history:${city}`;
    const history: WeatherEntry[] = await redis.get(historyKey) || [];

    const weatherData: WeatherData = {
      latest: currentWeatherResponse.data,
      history: history
    };

    res.setHeader('Cache-Control', 's-maxage=300');
    return res.status(200).json(weatherData);

  } catch (error) {
    console.error('Error fetching weather data:', error);
    
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return res.status(404).json({ error: 'City not found' });
    }

    return res.status(500).json({ error: 'Failed to fetch weather data' });
  }
}
