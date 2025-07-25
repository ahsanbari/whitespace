import { useState, useCallback } from 'react';
import { fetchAirportWeather, WeatherData } from '../../services/weatherService';

export const useAirportWeather = () => {
  const [weatherData, setWeatherData] = useState<{
    [airportCode: string]: WeatherData;
  }>({});
  const [loadingWeather, setLoadingWeather] = useState<string | null>(null);

  // Memoized airport click handler  
  const handleAirportClick = useCallback(async (airportCode: string, airport: { coords: [number, number] }) => {
    // Check if we already have weather data for this airport
    if (weatherData[airportCode]) {
      return; // Weather popup will show automatically
    }

    try {
      setLoadingWeather(airportCode);
      
      // Fetch weather data
      const response = await fetchAirportWeather(airportCode, airport.coords);
      
      if (response.success && response.data) {
        setWeatherData(prev => ({
          ...prev,
          [airportCode]: response.data!
        }));
      }
      // Silently handle error - weather is optional feature
    } finally {
      setLoadingWeather(null);
    }
  }, [weatherData]);

  return {
    weatherData,
    loadingWeather,
    handleAirportClick
  };
}; 