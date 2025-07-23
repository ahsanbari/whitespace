"use client";
import { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { FlightGeoJSON, AircraftFeature } from '../types/flight';
import { createPlaneIcon, createAirportIcon, createCurrentPositionIcon } from '../utils/mapIcons';
import { AIRPORT_COORDS, AIRPORT_NAMES } from '../config/airports';
import HeatLayer from './HeatLayer';

// Initialize Leaflet icons
// fixLeafletDefaultIcons(); // This line is removed as per the new_code, as the icons are now imported directly.

interface LeafletMapProps {
  selectedFlightNumber?: string;
  onFlightSelect?: (flightNumber: string) => void;
}

export default function LeafletMap({ selectedFlightNumber, onFlightSelect }: LeafletMapProps) {
  const [flightData, setFlightData] = useState<FlightGeoJSON | null>(null);
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

  useEffect(() => {
    fetch('/data/EasternSeaboardSampled.geojson')
      .then((res) => res.json())
      .then((data: FlightGeoJSON) => {
        console.log('Loaded GeoJSON data:', data);
        console.log('Total aircraft:', data.features?.length || 0);
        setFlightData(data);

        // Build heat points from ALL aircraft data for heatmap
        // const points: [number, number, number][] = data.features.map((feature: AircraftFeature) => {
        //   const coords = feature.geometry.coordinates;
        //   return [coords[1], coords[0], 1];
        // });
        
        // setHeatPoints(points); // This line is removed as per the new_code, as heatmap is now handled by HeatLayer.

        // Create limited dataset for markers
        const shuffled = [...data.features].sort(() => 0.5 - Math.random());
        const limited = shuffled.slice(0, markerLimit);
        // setLimitedGeoData({ ...data, features: limited }); // This line is removed as per the new_code, as limitedGeoData is no longer used.
        
        console.log('Limited markers:', limited.length);
      })
      .catch((error) => {
        console.error('Error loading GeoJSON:', error);
      });
      }, [markerLimit]);

  // Handle flight selection from input
  useEffect(() => {
    if (!selectedFlightNumber || !flightData) {
      return;
    }

    const flight = flightData.features.find(
      f => f.properties.number === selectedFlightNumber
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
  }, [selectedFlightNumber, flightData]);

  const handleFlightSearch = (flightNumber: string) => {
    if (!flightData) return;

    const flight = flightData.features.find(
      f => f.properties.number === flightNumber
    );

    if (!flight) {
      alert(`Flight ${flightNumber} not found`);
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
  };

  // Handle aircraft click to show flight route
  const handleAircraftClick = (flight: any) => {
    console.log('Aircraft clicked:', flight.properties);
    const { origin_airport_iata, destination_airport_iata, number } = flight.properties;
    
    if (!origin_airport_iata || !destination_airport_iata || !number) {
      console.log('Missing route info:', { origin_airport_iata, destination_airport_iata, number });
      alert(`Flight ${number || 'unknown'} does not have complete route information`);
      return;
    }

    const originCoords = AIRPORT_COORDS[origin_airport_iata];
    const destinationCoords = AIRPORT_COORDS[destination_airport_iata];

    if (!originCoords || !destinationCoords) {
      console.log('Missing airport coordinates:', { origin_airport_iata, destination_airport_iata, originCoords, destinationCoords });
      alert(`Airport coordinates not found for ${origin_airport_iata} or ${destination_airport_iata}`);
      return;
    }

    const currentCoords: [number, number] = [
      flight.geometry.coordinates[1],
      flight.geometry.coordinates[0]
    ];

    console.log('Setting flight route:', { number, origin_airport_iata, destination_airport_iata, originCoords, destinationCoords, currentCoords });

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
        {showMarkers && flightData && flightData.features.slice(0, markerLimit).map((feature, index) => {
          const { coordinates } = feature.geometry;
          const lat = coordinates[1];
          const lng = coordinates[0];
          const props = feature.properties;

          return (
            <Marker
              key={index}
              position={[lat, lng]}
              icon={createPlaneIcon()}
              eventHandlers={{
                click: () => handleAircraftClick(feature)
              }}
            >
              <Popup>
                <div style={{ fontSize: '12px', color: '#1f2937' }}>
                  <strong>Flight {props.number || 'N/A'}</strong><br />
                  Callsign: {props.callsign || 'N/A'}<br />
                  Aircraft: {props.aircraft_code || 'N/A'}<br />
                  Altitude: {props.altitude?.toLocaleString() || 'N/A'} ft<br />
                  Speed: {props.ground_speed || 'N/A'} kts<br />
                  {props.origin_airport_iata && props.destination_airport_iata && (
                    <>Route: {props.origin_airport_iata} → {props.destination_airport_iata}<br /></>
                  )}
                  {props.on_ground ? 'On Ground' : 'In Flight'}
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
              positions={[flightRoute.originCoords, flightRoute.destinationCoords]}
              color="#3b82f6"
              weight={2}
              opacity={0.8}
              dashArray="5, 10"
            />

            {/* Origin Airport Marker */}
            <Marker
              position={flightRoute.originCoords}
              icon={createAirportIcon('origin')}
            >
              <Popup>
                <div style={{ fontSize: '12px', color: '#1f2937' }}>
                  <strong>{flightRoute.origin}</strong><br />
                  Origin Airport<br />
                                     {AIRPORT_NAMES[flightRoute.origin] || 'Airport Name'}
                </div>
              </Popup>
            </Marker>

            {/* Destination Airport Marker */}
            <Marker
              position={flightRoute.destinationCoords}
              icon={createAirportIcon('destination')}
            >
              <Popup>
                <div style={{ fontSize: '12px', color: '#1f2937' }}>
                  <strong>{flightRoute.destination}</strong><br />
                  Destination Airport<br />
                                     {AIRPORT_NAMES[flightRoute.destination] || 'Airport Name'}
                </div>
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

      {/* Map Layer Controls */}
      <div className="absolute top-4 right-4 z-1000 bg-white rounded-lg shadow-lg p-3 border border-gray-300">
        <h3 className="text-sm font-semibold mb-2 text-gray-800">Map Layers</h3>
        <div className="space-y-2">
          <label className="flex items-center text-sm text-gray-800">
            <input
              type="checkbox"
              checked={showHeatmap}
              onChange={(e) => setShowHeatmap(e.target.checked)}
              className="mr-2"
            />
            Show Heatmap
          </label>
          
          <label className="flex items-center text-sm text-gray-800">
            <input
              type="checkbox"
              checked={showMarkers}
              onChange={(e) => setShowMarkers(e.target.checked)}
              className="mr-2"
            />
            Show Aircraft ({markerLimit})
          </label>
          
          {showMarkers && (
            <div className="mt-2">
              <label className="text-xs text-gray-800 block mb-1">
                Max Aircraft:
              </label>
              <select
                value={markerLimit}
                onChange={(e) => setMarkerLimit(Number(e.target.value))}
                className="text-xs border rounded px-2 py-1 w-full text-gray-800"
              >
                <option value={100}>100</option>
                <option value={500}>500</option>
                <option value={1000}>1,000</option>
                <option value={2000}>2,000</option>
                <option value={5000}>5,000</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Flight Route Legend - positioned below Map Layers */}
      {flightRoute && (
        <div className="absolute top-4 right-4 z-999 bg-white rounded-lg shadow-lg p-3 border border-gray-300 max-w-xs" style={{ marginTop: showMarkers ? '200px' : '160px' }}>
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-semibold text-gray-800">Flight Route: {flightRoute.flightNumber}</h3>
          </div>
          
          <div className="space-y-1 text-xs">
            <div className="flex items-center">
              <div className="w-3 h-3 mr-2 rounded-full bg-green-500 border border-white"></div>
              <span className="text-gray-800">{flightRoute.origin} (Origin)</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 mr-2 rounded-full bg-red-500 border border-white"></div>
              <span className="text-gray-800">{flightRoute.destination} (Destination)</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 mr-2 rounded-full bg-orange-500 border border-white"></div>
              <span className="text-gray-800">Current Position</span>
            </div>
            <div className="flex items-center mt-2">
              <div className="w-4 h-1 mr-2 bg-blue-500 opacity-80" style={{borderTop: '2px dashed #3b82f6'}}></div>
              <span className="text-gray-800">Flight Path</span>
            </div>
            <button
              onClick={() => setFlightRoute(null)}
              className="mt-3 px-4 py-2 bg-gray-100 text-gray-700 rounded-md border border-gray-300 shadow-sm hover:bg-gray-200 hover:text-gray-900 transition-colors text-xs font-medium"
              aria-label="Clear flight route"
              title="Clear flight route"
            >
              Clear Selected Flight
            </button>
          </div>
        </div>
      )}

      {/* Heatmap Legend */}
      {showHeatmap && (
        <div className="absolute bottom-4 left-4 z-1000 bg-white rounded-lg shadow-lg p-3 border border-gray-300">
          <h3 className="text-sm font-semibold mb-2 text-gray-800">Aircraft Density</h3>
          
          <div className="space-y-1">
            <div className="flex items-center text-xs text-gray-800">
              <div className="w-4 h-3 mr-2 rounded" style={{ background: 'linear-gradient(to right, blue, cyan, lime, yellow, red)' }}></div>
              <span>Low → High</span>
            </div>
            
            <div className="text-xs text-gray-600 mt-2">
              <div className="flex items-center mb-1">
                <div className="w-3 h-3 mr-2 rounded" style={{ backgroundColor: 'blue' }}></div>
                <span>Few aircraft</span>
              </div>
              <div className="flex items-center mb-1">
                <div className="w-3 h-3 mr-2 rounded" style={{ backgroundColor: 'lime' }}></div>
                <span>Moderate traffic</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 mr-2 rounded" style={{ backgroundColor: 'red' }}></div>
                <span>Heavy traffic</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 