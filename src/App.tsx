import React, { useState } from 'react';
import axios from 'axios';
import { SpeedInsights } from "@vercel/speed-insights/next";

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
    main: { temp: number; humidity: number; pressure: number; temp_min: number; temp_max: number };
    weather: Array<{ description: string; icon: string }>;
    wind: { speed: number; deg: number };
    dt: number;
  };
  history: WeatherEntry[];
}

const App: React.FC = () => {
  const [city, setCity] = useState('');
  const [weather, setWeather] = useState<WeatherData | null>(null);

  const fetchWeather = async () => {
    try {
      const response = await axios.get(`/api/weather?city=${city}`);
      setWeather(response.data);
    } catch (error) {
      setWeather(null);
    }
  };

  return (
    <div>
      <h1>Weather App</h1>
      <input
        value={city}
        onChange={(e) => setCity(e.target.value)}
        placeholder="Enter city (e.g., Tokyo)"
      />
      <button onClick={fetchWeather}>Get Weather</button>
      {weather ? (
        <div>
          <h2>{weather.latest.name}</h2>
          <p>Temp: {weather.latest.main.temp}°C (Min: {weather.latest.main.temp_min}, Max: {weather.latest.main.temp_max})</p>
          <p>Humidity: {weather.latest.main.humidity}%</p>
          <p>Pressure: {weather.latest.main.pressure} hPa</p>
          <p>Weather: {weather.latest.weather[0].description}</p>
          <p>Wind: {weather.latest.wind.speed} m/s, {weather.latest.wind.deg}°</p>
          <p>Coordinates: Lat {weather.latest.coord.lat}, Lon {weather.latest.coord.lon}</p>
          <h3>History (Last 7 Days)</h3>
          <ul>
            {weather.history.map((entry, idx) => (
              <li key={idx}>
                {new Date(entry.timestamp * 1000).toLocaleString()}: {entry.temp}°C, {entry.humidity}%, {entry.weather}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        city && <p>No data found for {city}</p>
      )}
    </div>
  );
};

export default App;