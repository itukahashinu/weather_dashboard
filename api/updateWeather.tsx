import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const cities = [
  "Tokyo", "New York", "London", "Paris", "Sydney",
  "Beijing", "Moscow", "Dubai", "Mumbai", "São Paulo",
  "Los Angeles", "Berlin", "Rome", "Toronto", "Seoul",
  "Shanghai", "Bangkok", "Mexico City", "Cairo", "Jakarta",
  "Singapore", "Hong Kong", "Istanbul", "Buenos Aires", "Madrid",
  "Delhi", "Lagos", "Johannesburg", "Chicago", "Amsterdam",
  "Stockholm", "Vienna", "Athens", "Osaka", "Melbourne",
  "Vancouver", "Miami", "Barcelona", "Kuala Lumpur", "Riyadh",
  "Santiago", "Cape Town", "Nairobi", "Lisbon", "Dublin",
  "Zurich", "Helsinki", "Oslo", "Copenhagen", "Warsaw",
  "Prague", "Budapest", "Manila", "Hanoi", "Lima",
  "Bogotá", "Caracas", "Kyiv", "Algiers", "Dhaka"
];

interface WeatherData {
  dt: number;
  main: { temp: number; humidity: number; pressure?: number };
  weather: Array<{ description: string; icon: string }>;
  wind: { speed: number; deg: number };
  [key: string]: any;
}

interface WeatherEntry {
  timestamp: number;
  temp: number;
  humidity: number;
  wind_speed: number;
  weather: string;
}

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  const apiKey = process.env.OPENWEATHER_API_KEY;

  if (!apiKey) {
    console.error('API key is missing');
    return res.status(500).json({ error: 'API key is not configured' });
  }

  try {
    console.log('Starting weather update process...');
    const baseUrl = "https://api.openweathermap.org/data/2.5/weather?q={city_name}&units=metric&appid={API_key}";

    for (const city of cities) {
      console.log(`Processing ${city}...`);

      // 強制的にリクエストを送信（キャッシュチェックを一旦無視）
      const url = baseUrl.replace("{city_name}", city).replace("{API_key}", apiKey);
      console.log(`Requesting data for ${city} from: ${url}`);

      try {
        const response = await axios.get(url);
        const newData: WeatherData = response.data;
        console.log(`Received data for ${city}:`, newData);

        // Redisに保存
        await redis.set(`weather:latest:${city}`, newData, { ex: 600 });

        const historyKey = `weather:history:${city}`;
        let history: WeatherEntry[] = (await redis.get(historyKey)) || [];
        const now = Math.floor(Date.now() / 1000);
        history.unshift({
          timestamp: now,
          temp: newData.main.temp,
          humidity: newData.main.humidity,
          wind_speed: newData.wind.speed,
          weather: newData.weather[0].description,
        });

        const oneWeekAgo = now - 604800;
        history = history.filter((entry) => entry.timestamp > oneWeekAgo);
        await redis.set(historyKey, history, { ex: 604800 });
      } catch (cityError) {
        console.error(`Error fetching data for ${city}:`, cityError.response?.data || cityError.message);
      }
    }
    res.status(200).json({ message: 'Weather data updated' });
  } catch (error) {
    console.error('Global error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to update weather data' });
  }
}