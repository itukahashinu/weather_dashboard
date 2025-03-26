import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';
import { Redis } from '@upstash/redis';

// Redisインスタンス
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

// OpenWeatherAPIのレスポンス型
interface WeatherData {
  dt: number;
  main: {
    temp: number;
    humidity: number;
    pressure?: number;
  };
  weather: Array<{ description: string; icon: string }>;
  wind: { speed: number; deg: number };
  [key: string]: any; // その他のプロパティを許容
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
    return res.status(500).json({ error: 'API key is not configured' });
  }

  try {
    for (const city of cities) {
      const cachedLatest = await redis.get<WeatherData | null>(`weather:latest:${city}`);
      const now = Math.floor(Date.now() / 1000);

      if (!cachedLatest || (cachedLatest.dt + 600 < now)) {
        const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;
        const response = await axios.get(url);
        const newData: WeatherData = response.data;

        // 最新データ保存（TTL: 10分）
        await redis.set(`weather:latest:${city}`, newData, { ex: 600 });

        // 履歴更新
        const historyKey = `weather:history:${city}`;
        let history: WeatherEntry[] = (await redis.get(historyKey)) || [];
        history.unshift({
          timestamp: now,
          temp: newData.main.temp,
          humidity: newData.main.humidity,
          wind_speed: newData.wind.speed,
          weather: newData.weather[0].description,
        });

        // 1週間より古いデータを削除
        const oneWeekAgo = now - 604800;
        history = history.filter((entry) => entry.timestamp > oneWeekAgo);

        // 履歴保存（TTL: 1週間）
        await redis.set(historyKey, history, { ex: 604800 });
      }
    }
    res.status(200).json({ message: 'Weather data updated' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update weather data' });
  }
}