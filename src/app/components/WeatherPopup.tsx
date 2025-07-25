import React from 'react';
import { WeatherData, getWindDirection, getWindDirectionShort } from '../services/weatherService';

interface WeatherPopupProps {
  airportCode: string;
  airportName: string;
  weather: WeatherData;
  type: 'origin' | 'destination';
}

const WeatherPopup: React.FC<WeatherPopupProps> = ({ 
  airportCode, 
  airportName, 
  weather, 
  type 
}) => {
  const typeColor = type === 'origin' ? '#10b981' : '#ef4444';
  const typeLabel = type === 'origin' ? 'DEPARTURE' : 'ARRIVAL';
  
  const getWeatherEmoji = (condition: string) => {
    switch (condition.toLowerCase()) {
      case 'clear': return '☀️';
      case 'partly-cloudy': return '⛅';
      case 'cloudy': return '☁️';
      case 'overcast': return '☁️';
      case 'rain': return '🌧️';
      case 'thunderstorm': return '⛈️';
      case 'snow': return '❄️';
      case 'mist': return '🌫️';
      default: return '🌤️';
    }
  };

  const getVisibilityCondition = (visibility: number) => {
    if (visibility >= 10) return { 
      text: 'Excellent', 
      color: '#10b981', 
      description: 'Unlimited visibility - perfect flying conditions' 
    };
    if (visibility >= 6) return { 
      text: 'Good', 
      color: '#059669', 
      description: 'Clear views - VFR conditions' 
    };
    if (visibility >= 3) return { 
      text: 'Fair', 
      color: '#f59e0b', 
      description: 'Reduced visibility - marginal VFR' 
    };
    return { 
      text: 'Poor', 
      color: '#ef4444', 
      description: 'Low visibility - IFR conditions likely' 
    };
  };

  const getWindCondition = (windSpeed: number) => {
    if (windSpeed >= 25) return { text: 'Strong Winds', color: '#ef4444', description: 'May affect takeoff/landing' };
    if (windSpeed >= 15) return { text: 'Moderate Winds', color: '#f59e0b', description: 'Crosswind considerations' };
    if (windSpeed >= 5) return { text: 'Light Winds', color: '#10b981', description: 'Favorable conditions' };
    return { text: 'Calm', color: '#10b981', description: 'Ideal for operations' };
  };

  const getPressureCondition = (pressure: number) => {
    if (pressure >= 30.20) return { text: 'High Pressure', color: '#10b981', description: 'Stable weather system' };
    if (pressure >= 29.80) return { text: 'Normal Pressure', color: '#059669', description: 'Standard conditions' };
    if (pressure >= 29.50) return { text: 'Low Pressure', color: '#f59e0b', description: 'Weather changes possible' };
    return { text: 'Very Low', color: '#ef4444', description: 'Storm system nearby' };
  };

  const getHumidityCondition = (humidity: number) => {
    if (humidity >= 80) return { text: 'Very Humid', color: '#06b6d4', description: 'High moisture content' };
    if (humidity >= 60) return { text: 'Humid', color: '#0891b2', description: 'Moderate moisture' };
    if (humidity >= 40) return { text: 'Comfortable', color: '#10b981', description: 'Ideal moisture levels' };
    return { text: 'Dry', color: '#f59e0b', description: 'Low moisture content' };
  };

  const visCondition = getVisibilityCondition(weather.visibility);
  const windCondition = getWindCondition(weather.windSpeed);
  const pressureCondition = getPressureCondition(weather.pressure);
  const humidityCondition = getHumidityCondition(weather.humidity);

  return (
    <div style={{ 
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      minWidth: '301px',
      maxWidth: '360px',
      padding: '12px'
    }}>
      {/* Header */}
      <div style={{
        background: `linear-gradient(135deg, ${typeColor}, ${typeColor}dd)`,
        color: 'white',
        padding: '14px 16px',
        marginBottom: '14px',
        borderRadius: '8px',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '11px', fontWeight: '600', opacity: 0.9, marginBottom: '2px' }}>
          ✈️ {typeLabel} AIRPORT WEATHER
        </div>
        <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '2px' }}>
          {airportCode}
        </div>
        <div style={{ fontSize: '12px', opacity: 0.85, lineHeight: '1.2' }}>
          {airportName}
        </div>
      </div>

      {/* Current Weather */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        marginBottom: '16px',
        padding: '14px',
        background: '#f8fafc',
        borderRadius: '8px',
        border: '1px solid #e2e8f0'
      }}>
        <div style={{ fontSize: '36px', marginRight: '12px' }}>
          {getWeatherEmoji(weather.condition)}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937', marginBottom: '2px' }}>
            {weather.temperature}°F
          </div>
          <div style={{ fontSize: '14px', color: '#6b7280', textTransform: 'capitalize', marginBottom: '4px' }}>
            {weather.description}
          </div>
          <div style={{ fontSize: '11px', color: '#9ca3af', fontStyle: 'italic' }}>
            Current field conditions
          </div>
        </div>
      </div>

      {/* Weather Details Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '12px',
        marginBottom: '12px'
      }}>
        {/* Wind */}
        <div style={{
          padding: '12px',
          background: '#f1f5f9',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '20px', marginBottom: '6px' }}>💨</div>
          <div style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937', marginBottom: '2px' }}>
            {weather.windSpeed} mph
          </div>
          <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>
            from {getWindDirection(weather.windDirection)}
          </div>
          <div style={{ fontSize: '10px', color: '#9ca3af', marginBottom: '4px' }}>
            ({getWindDirectionShort(weather.windDirection)} {weather.windDirection}°)
          </div>
          <div style={{ 
            fontSize: '10px', 
            color: windCondition.color,
            fontWeight: '500',
            background: 'rgba(255,255,255,0.7)',
            padding: '2px 4px',
            borderRadius: '4px'
          }}>
            {windCondition.text}
          </div>
        </div>

        {/* Humidity */}
        <div style={{
          padding: '12px',
          background: '#f1f5f9',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '20px', marginBottom: '6px' }}>💧</div>
          <div style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937', marginBottom: '2px' }}>
            {weather.humidity}%
          </div>
          <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>
            Relative Humidity
          </div>
          <div style={{ 
            fontSize: '10px', 
            color: humidityCondition.color,
            fontWeight: '500',
            background: 'rgba(255,255,255,0.7)',
            padding: '2px 4px',
            borderRadius: '4px'
          }}>
            {humidityCondition.text}
          </div>
        </div>

        {/* Visibility */}
        <div style={{
          padding: '12px',
          background: '#f1f5f9',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '20px', marginBottom: '6px' }}>👁️</div>
          <div style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937', marginBottom: '2px' }}>
            {weather.visibility} mi
          </div>
          <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>
            Flight Visibility
          </div>
          <div style={{ 
            fontSize: '10px', 
            color: visCondition.color,
            fontWeight: '500',
            background: 'rgba(255,255,255,0.7)',
            padding: '2px 4px',
            borderRadius: '4px'
          }}>
            {visCondition.text}
          </div>
        </div>

        {/* Pressure */}
        <div style={{
          padding: '12px',
          background: '#f1f5f9',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '20px', marginBottom: '6px' }}>🌡️</div>
          <div style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937', marginBottom: '2px' }}>
            {weather.pressure}"
          </div>
          <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>
            Barometric Pressure (inHg)
          </div>
          <div style={{ 
            fontSize: '10px', 
            color: pressureCondition.color,
            fontWeight: '500',
            background: 'rgba(255,255,255,0.7)',
            padding: '2px 4px',
            borderRadius: '4px'
          }}>
            {pressureCondition.text}
          </div>
        </div>
      </div>

      {/* Operational Impact Summary */}
      <div style={{
        padding: '12px',
        background: '#f8fafc',
        borderRadius: '8px',
        border: '1px solid #e2e8f0',
        marginBottom: '8px'
      }}>
        <div style={{ fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
          ✈️ Flight Operations Impact
        </div>
        <div style={{ fontSize: '11px', color: '#6b7280', lineHeight: '1.4' }}>
          <div style={{ marginBottom: '2px' }}>
            <strong>Visibility:</strong> {visCondition.description}
          </div>
          <div style={{ marginBottom: '2px' }}>
            <strong>Wind:</strong> {windCondition.description}
          </div>
          <div>
            <strong>Pressure:</strong> {pressureCondition.description}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{
        fontSize: '10px',
        color: '#9ca3af',
        textAlign: 'center',
        marginTop: '8px',
        fontStyle: 'italic'
      }}>
        🌦️ Real-time METAR conditions • Updated continuously
      </div>
    </div>
  );
};

export default WeatherPopup; 