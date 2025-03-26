import React, { useState, useEffect } from 'react';
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
    [key: string]: any;
  };
  history: WeatherEntry[];
}

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

const App: React.FC = () => {
  const [weatherData, setWeatherData] = useState<WeatherData[]>([]);
  const [cacheData, setCacheData] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 通常の天気データを取得
        const promises = cities.map(city => {
          const url = `/api/weather?city=${encodeURIComponent(city)}`;
          return axios.get(url);
        });
        
        const responses = await Promise.all(promises);
        setWeatherData(responses.map(response => response.data));

        // キャッシュデータを取得
        const cacheResponse = await axios.get('/api/updateWeather');
        setCacheData(cacheResponse.data.data);
      } catch (error) {
        console.error('Error fetching data:', error);
        if (axios.isAxiosError(error)) {
          console.error('Response details:', error.response?.data);
        }
      }
    };

    fetchData();
  }, []);

  return (
    <div style={{ padding: '20px' }}>
      <h1>World Weather</h1>
      
      {/* 通常の天気データ表示 */}
      <h2>Current Weather Data</h2>
      {weatherData.length > 0 ? (
        weatherData.map((data, index) => (
          <div key={index}>
            <h2>{data.latest.name}</h2>
            <pre>{JSON.stringify(data.latest, null, 2)}</pre>
            <h3>History (Last 7 Days)</h3>
            {data.history.length > 0 ? (
              <ul>
                {data.history.map((entry, idx) => (
                  <li key={idx}>
                    <strong>{new Date(entry.timestamp * 1000).toLocaleString()}</strong>
                    <pre>{JSON.stringify(entry, null, 2)}</pre>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No history data available</p>
            )}
            <hr />
          </div>
        ))
      ) : (
        <p>Loading weather data...</p>
      )}

      {/* キャッシュデータ表示 */}
      <h2>Cache Data</h2>
      {cacheData ? (
        <div>
          {Object.entries(cacheData).map(([key, value]) => (
            <div key={key} style={{ marginBottom: '20px' }}>
              <h3>{key}</h3>
              <pre style={{ 
                background: '#f5f5f5',
                padding: '10px',
                borderRadius: '5px',
                overflowX: 'auto'
              }}>
                {JSON.stringify(value, null, 2)}
              </pre>
            </div>
          ))}
        </div>
      ) : (
        <p>Loading cache data...</p>
      )}
    </div>
  );
};

export default App;
