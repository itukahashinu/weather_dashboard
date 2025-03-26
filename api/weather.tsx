import React, { useState } from 'react';
import axios from 'axios';

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
    [key: string]: any; // その他のプロパティを許容
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
    <div style={{ padding: '20px' }}>
      <h1>Weather App</h1>
      <input
        value={city}
        onChange={(e) => setCity(e.target.value)}
        placeholder="Enter city (e.g., Tokyo)"
        style={{ marginRight: '10px' }}
      />
      <button onClick={fetchWeather}>Get Weather</button>

      {weather ? (
        <div>
          <h2>Latest Weather for {weather.latest.name}</h2>
          <pre>
            {/* latestデータの全内容を整形して表示 */}
            {JSON.stringify(weather.latest, null, 2)}
          </pre>

          <h3>History (Last 7 Days)</h3>
          {weather.history.length > 0 ? (
            <ul>
              {weather.history.map((entry, idx) => (
                <li key={idx}>
                  <strong>{new Date(entry.timestamp * 1000).toLocaleString()}</strong>
                  <pre>{JSON.stringify(entry, null, 2)}</pre>
                </li>
              ))}
            </ul>
          ) : (
            <p>No history data available</p>
          )}
        </div>
      ) : (
        city && <p>No data found for {city}</p>
      )}
    </div>
  );
};

export default App;