import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Redis } from '@upstash/redis';

// Redisインスタンス
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const city = (req.query.city as string)?.toLowerCase();
  if (!city) return res.status(400).json({ error: 'City is required' });
  const latest = await redis.get(`weather:latest:${city}`);
  const history = (await redis.get(`weather:history:${city}`)) || [];
  if (latest) {
    res.status(200).json({ latest, history });
  } else {
    res.status(404).json({ error: `No data for ${city}` });
  }
}