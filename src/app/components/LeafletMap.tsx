"use client";
import { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { FlightGeoJSON, AircraftFeature } from '../types/flight';
import { createPlaneIcon, createAirportIcon, createCurrentPositionIcon } from '../utils/mapIcons';
import { getFlightPath, calculateFlightDistance } from '../utils/flightPaths';
import { AIRPORT_COORDS, AIRPORT_NAMES, AIRPORTS } from '../config/airports';
import { fetchAirportWeather, WeatherData } from '../services/weatherService';
import WeatherPopup from './WeatherPopup';
import HeatLayer from './HeatLayer';
import MapLayerControls from './MapLayerControls';
import FlightRouteLegend from './FlightRouteLegend';
import HeatmapLegend from './HeatmapLegend';



interface LeafletMapProps {
  selectedFlightNumber?: string;
  onFlightSelect?: (flightNumber: string) => void;
}

export default function LeafletMap({ selectedFlightNumber, onFlightSelect }: LeafletMapProps) {
  const [flightData, setFlightData] = useState<FlightGeoJSON | null>(null);
  const [displayFlights, setDisplayFlights] = useState<AircraftFeature[]>([]);
  const [flightRoute, setFlightRoute] = useState<{
    flightNumber: string;
    origin: string;
    destination: string;
    originCoords: [number, number];
    destinationCoords: [number, number];
    currentCoords: [number, number];
  } | null>(null);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [showMarkers, setShowMarkers] = useState(true);
  const [markerLimit, setMarkerLimit] = useState(500);
  const [weatherData, setWeatherData] = useState<{
    [airportCode: string]: WeatherData;
  }>({});
  const [loadingWeather, setLoadingWeather] = useState<string | null>(null);
  const [mapLayerControlsOpen, setMapLayerControlsOpen] = useState(false);

  useEffect(() => {
    fetch('/data/EasternSeaboardSampled.geojson')
      .then((res) => res.json())
      .then((data: FlightGeoJSON) => {
        setFlightData(data);

        // Create randomly selected subset for display
        const shuffled = [...data.features].sort(() => 0.5 - Math.random());
        const randomSelection = shuffled.slice(0, markerLimit);
        setDisplayFlights(randomSelection);
      })
      .catch((error) => {
        console.error('Error loading GeoJSON:', error);
      });
  }, []);

  // Update random selection when marker limit changes
  useEffect(() => {
    if (flightData) {
      const shuffled = [...flightData.features].sort(() => 0.5 - Math.random());
      const randomSelection = shuffled.slice(0, markerLimit);
      setDisplayFlights(randomSelection);
    }
  }, [markerLimit, flightData]);

  // Helper function to check if flight has valid route information
  const hasValidRouteInfo = (flight: AircraftFeature): boolean => {
    const { origin_airport_iata, destination_airport_iata, number } = flight.properties;
    
    if (!origin_airport_iata || !destination_airport_iata || !number) {
      return false;
    }

    const originCoords = AIRPORT_COORDS[origin_airport_iata];
    const destinationCoords = AIRPORT_COORDS[destination_airport_iata];
    
    return !!(originCoords && destinationCoords);
  };

  // Handle flight selection from input
  useEffect(() => {
    if (!selectedFlightNumber || !flightData) {
      return;
    }

    // Case-insensitive search for flight codes (e.g., "BA205", "dl675")
    const searchCode = selectedFlightNumber.trim().toUpperCase();
    const flight = flightData.features.find(
      f => f.properties.number?.toUpperCase() === searchCode
    );

    if (!flight) {
      alert(`Flight ${selectedFlightNumber} not found`);
      return;
    }

    const { origin_airport_iata, destination_airport_iata, number } = flight.properties;
    
    if (!origin_airport_iata || !destination_airport_iata) {
      alert(`Flight route information not available for ${number}`);
      return;
    }

    const originCoords = AIRPORT_COORDS[origin_airport_iata];
    const destinationCoords = AIRPORT_COORDS[destination_airport_iata];

    if (!originCoords || !destinationCoords) {
      alert(`Airport coordinates not found for ${origin_airport_iata} or ${destination_airport_iata}`);
      return;
    }

    const currentCoords: [number, number] = [
      flight.geometry.coordinates[1],
      flight.geometry.coordinates[0]
    ];

    setFlightRoute({
      flightNumber: number!,
      origin: origin_airport_iata,
      destination: destination_airport_iata,
      originCoords,
      destinationCoords,
      currentCoords
    });

    // Ensure the searched flight is visible in displayFlights
    setDisplayFlights(prev => {
      // Check if the flight is already in the display list (case-insensitive)
      const flightExists = prev.some(f => f.properties.number?.toUpperCase() === searchCode);
      if (!flightExists) {
        // Add the searched flight to the display list, removing one random flight if at limit
        const newDisplayFlights = [flight, ...prev.slice(0, markerLimit - 1)];
        return newDisplayFlights;
      }
      return prev;
    });
  }, [selectedFlightNumber, flightData, markerLimit]);



  // Handle aircraft click to show flight route
  const handleAircraftClick = (flight: any) => {
    const { origin_airport_iata, destination_airport_iata, number } = flight.properties;
    
    if (!origin_airport_iata || !destination_airport_iata || !number) {
      alert(`Flight ${number || 'unknown'} does not have complete route information`);
      return;
    }

    const originCoords = AIRPORT_COORDS[origin_airport_iata];
    const destinationCoords = AIRPORT_COORDS[destination_airport_iata];

    if (!originCoords || !destinationCoords) {
      alert(`Airport coordinates not found for ${origin_airport_iata} or ${destination_airport_iata}`);
      return;
    }

    const currentCoords: [number, number] = [
      flight.geometry.coordinates[1],
      flight.geometry.coordinates[0]
    ];

    setFlightRoute({
      flightNumber: number,
      origin: origin_airport_iata,
      destination: destination_airport_iata,
      originCoords,
      destinationCoords,
      currentCoords
    });

    // Also update the parent component
    if (onFlightSelect) {
      onFlightSelect(number);
    }
  };

  // Handle airport marker click to fetch and display weather
  const handleAirportClick = async (airportCode: string) => {
    // Check if we already have weather data for this airport
    if (weatherData[airportCode]) {
      return;
    }

    const airport = AIRPORTS[airportCode];
    if (!airport) {
      return;
    }

    setLoadingWeather(airportCode);
    
    try {
      const response = await fetchAirportWeather(airportCode, airport.coords);
      
      if (response.success && response.data) {
        setWeatherData(prev => ({
          ...prev,
          [airportCode]: response.data!
        }));
      }
    } catch (error) {
      // Silently handle error - weather is optional feature
    } finally {
      setLoadingWeather(null);
    }
  };

  return (
    <div className="relative w-full h-screen">
      <MapContainer
        center={[39.8283, -76.4951]}
        zoom={7}
        className="w-full h-full"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        {/* Heatmap Layer */}
        {showHeatmap && flightData && (
          <HeatLayer points={flightData.features.map(feature => [
            feature.geometry.coordinates[1], 
            feature.geometry.coordinates[0], 
            1
          ])} />
        )}

        {/* Aircraft Markers */}
        {showMarkers && displayFlights.map((feature, index) => {
          const { coordinates } = feature.geometry;
          const lat = coordinates[1];
          const lng = coordinates[0];
          const props = feature.properties;
          const hasRoute = hasValidRouteInfo(feature);

          return (
            <Marker
              key={index}
              position={[lat, lng]}
              icon={createPlaneIcon(hasRoute ? '#1f2937' : '#ef4444')}
              eventHandlers={hasRoute ? {
                click: () => handleAircraftClick(feature)
              } : {}}
            >
              <Popup>
                <div style={{ fontSize: '12px', color: '#1f2937' }}>
                  <strong>Flight {props.number || 'N/A'}</strong><br />
                  Callsign: {props.callsign || 'N/A'}<br />
                  Aircraft: {props.aircraft_code || 'N/A'}<br />
                  Altitude: {props.altitude?.toLocaleString() || 'N/A'} ft<br />
                  Speed: {props.ground_speed || 'N/A'} kts<br />
                  {hasRoute ? (
                    <>Route: {props.origin_airport_iata} → {props.destination_airport_iata}<br /></>
                  ) : (
                    <span style={{ color: '#ef4444', fontStyle: 'italic' }}>
                      Route information unavailable<br />
                    </span>
                  )}
                  {props.on_ground ? 'On Ground' : 'In Flight'}
                  {!hasRoute && (
                    <div style={{ 
                      marginTop: '8px', 
                      padding: '4px', 
                      background: '#fef2f2', 
                      border: '1px solid #fecaca', 
                      borderRadius: '4px', 
                      color: '#991b1b',
                      fontSize: '10px'
                    }}>
                      ⚠️ Click disabled - Missing airport data
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Flight Route Visualization */}
        {flightRoute && (
          <>
            {/* Flight path polyline */}
            <Polyline
              positions={getFlightPath(flightRoute.originCoords, flightRoute.destinationCoords)}
              color="#3b82f6"
              weight={2}
              opacity={0.8}
              dashArray="5, 10"
            />

                        {/* Origin Airport Marker */}
            <Marker
              position={flightRoute.originCoords}
              icon={createAirportIcon('origin')}
              eventHandlers={{
                click: () => handleAirportClick(flightRoute.origin)
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
                        🌦️ Loading weather...
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
                        Click for Weather ⛅
                      </div>
                    )}
                  </div>
                )}
              </Popup>
            </Marker>

            {/* Destination Airport Marker */}
            <Marker
              position={flightRoute.destinationCoords}
              icon={createAirportIcon('destination')}
              eventHandlers={{
                click: () => handleAirportClick(flightRoute.destination)
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
                        🌦️ Loading weather...
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
                        Click for Weather ⛅
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
        )}
      </MapContainer>

      <MapLayerControls
        showHeatmap={showHeatmap}
        showMarkers={showMarkers}
        markerLimit={markerLimit}
        onHeatmapToggle={setShowHeatmap}
        onMarkersToggle={setShowMarkers}
        onMarkerLimitChange={setMarkerLimit}
        onOpenChange={setMapLayerControlsOpen}
      />

      {flightRoute && (
        <FlightRouteLegend
          flightRoute={flightRoute}
          showMarkers={showMarkers}
          mapLayerControlsOpen={mapLayerControlsOpen}
          onClearRoute={() => setFlightRoute(null)}
        />
      )}

      <HeatmapLegend showHeatmap={showHeatmap} />
    </div>
  );
} 