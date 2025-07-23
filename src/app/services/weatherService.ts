// Weather service for fetching airport weather data

export interface WeatherData {
  temperature: number;
  description: string;
  humidity: number;
  windSpeed: number;
  windDirection: number;
  visibility: number;
  pressure: number;
  icon: string;
  condition: string;
}

export interface WeatherResponse {
  success: boolean;
  data?: WeatherData;
  error?: string;
}



// Convert wind direction to compass direction
const getWindDirection = (degrees: number): string => {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(degrees / 22.5) % 16;
  return directions[index];
};

export const fetchAirportWeather = async (
  airportCode: string, 
  coords: [number, number]
): Promise<WeatherResponse> => {
  try {
    // Use real OpenWeatherMap API
    const API_KEY = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;
    
    if (!API_KEY) {
      throw new Error('Weather API key not configured. Please set NEXT_PUBLIC_OPENWEATHER_API_KEY in .env.local');
    }
    
    const [lat, lng] = coords;
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${API_KEY}&units=imperial`
    );
    
    if (!response.ok) {
      throw new Error(`Weather API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    return {
      success: true,
      data: {
        temperature: Math.round(data.main.temp),
        description: data.weather[0].description,
        humidity: data.main.humidity,
        windSpeed: Math.round(data.wind.speed),
        windDirection: data.wind.deg || 0,
        visibility: Math.round((data.visibility / 1609) * 10) / 10, // Convert m to miles
        pressure: Math.round((data.main.pressure * 0.02953) * 100) / 100, // Convert hPa to inHg
        icon: data.weather[0].icon,
        condition: data.weather[0].main.toLowerCase()
      }
    };
    
  } catch (error) {
    console.error('Weather fetch error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch weather data'
    };
  }
};

export { getWindDirection }; 