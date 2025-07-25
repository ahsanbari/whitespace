import React from 'react';
import { Marker, Popup, Polyline } from 'react-leaflet';
import { AIRPORT_NAMES } from '../../../infrastructure/config';
import { createAirportIcon, createCurrentPositionIcon } from '../../../infrastructure/utils';
import { WeatherData } from '../../../services/weatherService';
import WeatherPopup from '../UI/WeatherPopup';

interface FlightRoute {
  flightNumber: string;
  origin: string;
  destination: string;
  originName: string;
  destinationName: string;
  originCoords: [number, number];
  destinationCoords: [number, number];
  currentCoords: [number, number];
}

interface FlightRouteLayerProps {
  flightRoute: FlightRoute;
  flightPath: [number, number][];
  weatherData: { [airportCode: string]: WeatherData };
  loadingWeather: string | null;
  onAirportClick: (airportCode: string, airport: { coords: [number, number] }) => void;
}

const FlightRouteLayer = React.memo(({
  flightRoute,
  flightPath,
  weatherData,
  loadingWeather,
  onAirportClick
}: FlightRouteLayerProps) => {
  return (
    <>
      {/* Flight Path */}
      <Polyline
        positions={flightPath}
        color="var(--color-route)"
        weight={3}
        opacity={0.8}
        dashArray="10, 10"
      />

      {/* Origin Airport */}
      <Marker
        position={flightRoute.originCoords}
        icon={createAirportIcon('origin')}
        eventHandlers={{
          click: () => onAirportClick(flightRoute.origin, { coords: flightRoute.originCoords })
        }}
      >
        <Popup>
          {weatherData[flightRoute.origin] ? (
            <WeatherPopup
              airportCode={flightRoute.origin}
              airportName={AIRPORT_NAMES[flightRoute.origin] || 'Airport'}
              weather={weatherData[flightRoute.origin]}
              type="origin"
            />
          ) : (
            <div style={{ fontSize: '12px', color: '#1f2937', textAlign: 'center', padding: '12px' }}>
              <strong>{flightRoute.origin}</strong><br />
              <div style={{ margin: '8px 0' }}>
                {AIRPORT_NAMES[flightRoute.origin] || 'Airport Name'}
              </div>
              {loadingWeather === flightRoute.origin ? (
                <div style={{ color: '#6b7280', fontSize: '11px' }}>
                  🌦️ Fetching current METAR conditions...
                </div>
              ) : (
                <div style={{ 
                  background: '#10b981', 
                  color: 'white', 
                  padding: '6px 12px', 
                  borderRadius: '4px', 
                  fontSize: '11px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}>
                  📊 View Airport Weather & Flight Conditions ⛅
                </div>
              )}
            </div>
          )}
        </Popup>
      </Marker>

      {/* Destination Airport */}
      <Marker
        position={flightRoute.destinationCoords}
        icon={createAirportIcon('destination')}
        eventHandlers={{
          click: () => onAirportClick(flightRoute.destination, { coords: flightRoute.destinationCoords })
        }}
      >
        <Popup>
          {weatherData[flightRoute.destination] ? (
            <WeatherPopup
              airportCode={flightRoute.destination}
              airportName={AIRPORT_NAMES[flightRoute.destination] || 'Airport'}
              weather={weatherData[flightRoute.destination]}
              type="destination"
            />
          ) : (
            <div style={{ fontSize: '12px', color: '#1f2937', textAlign: 'center', padding: '12px' }}>
              <strong>{flightRoute.destination}</strong><br />
              <div style={{ margin: '8px 0' }}>
                {AIRPORT_NAMES[flightRoute.destination] || 'Airport Name'}
              </div>
              {loadingWeather === flightRoute.destination ? (
                <div style={{ color: '#6b7280', fontSize: '11px' }}>
                  🌦️ Fetching current METAR conditions...
                </div>
              ) : (
                <div style={{ 
                  background: '#ef4444', 
                  color: 'white', 
                  padding: '6px 12px', 
                  borderRadius: '4px', 
                  fontSize: '11px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}>
                  📊 View Airport Weather & Flight Conditions ⛅
                </div>
              )}
            </div>
          )}
        </Popup>
      </Marker>

      {/* Current Aircraft Position */}
      <Marker
        position={flightRoute.currentCoords}
        icon={createCurrentPositionIcon()}
      >
        <Popup>
          <div style={{ fontSize: '12px', color: '#1f2937' }}>
            <strong>Flight {flightRoute.flightNumber}</strong><br />
            Current Position<br />
            En route: {flightRoute.origin} → {flightRoute.destination}
          </div>
        </Popup>
      </Marker>
    </>
  );
});

FlightRouteLayer.displayName = 'FlightRouteLayer';

export default FlightRouteLayer; 