import React from 'react';
import { WeatherData, getWindDirection } from '../services/weatherService';

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
    if (visibility >= 10) return { text: 'Excellent', color: '#10b981' };
    if (visibility >= 6) return { text: 'Good', color: '#059669' };
    if (visibility >= 3) return { text: 'Fair', color: '#f59e0b' };
    return { text: 'Poor', color: '#ef4444' };
  };

  const visCondition = getVisibilityCondition(weather.visibility);

  return (
    <div style={{ 
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      minWidth: '280px',
      maxWidth: '320px'
    }}>
      {/* Header */}
      <div style={{
        background: `linear-gradient(135deg, ${typeColor}, ${typeColor}dd)`,
        color: 'white',
        padding: '12px 16px',
        marginBottom: '12px',
        borderRadius: '8px',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '11px', fontWeight: '600', opacity: 0.9, marginBottom: '2px' }}>
          {typeLabel} AIRPORT
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
        padding: '12px',
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
          <div style={{ fontSize: '14px', color: '#6b7280', textTransform: 'capitalize' }}>
            {weather.description}
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
          padding: '10px',
          background: '#f1f5f9',
          borderRadius: '6px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '20px', marginBottom: '4px' }}>💨</div>
          <div style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937' }}>
            {weather.windSpeed} mph
          </div>
          <div style={{ fontSize: '11px', color: '#6b7280' }}>
            {getWindDirection(weather.windDirection)}
          </div>
        </div>

        {/* Humidity */}
        <div style={{
          padding: '10px',
          background: '#f1f5f9',
          borderRadius: '6px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '20px', marginBottom: '4px' }}>💧</div>
          <div style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937' }}>
            {weather.humidity}%
          </div>
          <div style={{ fontSize: '11px', color: '#6b7280' }}>
            Humidity
          </div>
        </div>

        {/* Visibility */}
        <div style={{
          padding: '10px',
          background: '#f1f5f9',
          borderRadius: '6px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '20px', marginBottom: '4px' }}>👁️</div>
          <div style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937' }}>
            {weather.visibility} mi
          </div>
          <div style={{ 
            fontSize: '11px', 
            color: visCondition.color,
            fontWeight: '500'
          }}>
            {visCondition.text}
          </div>
        </div>

        {/* Pressure */}
        <div style={{
          padding: '10px',
          background: '#f1f5f9',
          borderRadius: '6px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '20px', marginBottom: '4px' }}>🌡️</div>
          <div style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937' }}>
            {weather.pressure}"
          </div>
          <div style={{ fontSize: '11px', color: '#6b7280' }}>
            inHg
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
        🌦️ Current airport weather conditions
      </div>
    </div>
  );
};

export default WeatherPopup; 