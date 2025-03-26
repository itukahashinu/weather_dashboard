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

  useEffect(() => {
    const fetchAllWeather = async () => {
      try {
        console.log('Starting to fetch weather data for all cities');
        const promises = cities.map(city => {
          const url = `/api/weather?city=${encodeURIComponent(city)}`;
          console.log(`Fetching weather for ${city} from: ${url}`);
          return axios.get(url);
        });
        
        console.log('Waiting for all requests to complete...');
        const responses = await Promise.all(promises);
        console.log(`Received responses for ${responses.length} cities`);
        
        setWeatherData(responses.map(response => response.data));
      } catch (error) {
        console.error('Error fetching weather data:', error);
        if (axios.isAxiosError(error)) {
          console.error('Response details:', error.response?.data);
        }
        setWeatherData([]);
      }
    };

    fetchAllWeather();
  }, []);

  return (
    <div style={{ padding: '20px' }}>
      <h1>World Weather</h1>
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
    </div>
  );
};

export default App;
