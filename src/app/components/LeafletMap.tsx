"use client";
import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMapEvents } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-markercluster';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import { FlightGeoJSON, AircraftFeature } from '../types/flight';
import { createPlaneIcon, createAirportIcon, createCurrentPositionIcon } from '../utils/mapIcons';
import { getFlightPath, calculateFlightDistance } from '../utils/flightPaths';
import { filterFlights, getFlightStatistics, analyzeBusyRoutes } from '../utils/flightAnalysis';
import { SpatialIndex, createSpatialIndex, leafletBoundsToBoundingBox, BoundingBox } from '../utils/spatialIndex';
import { AIRPORT_COORDS, AIRPORT_NAMES, AIRPORTS } from '../config/airports';
import { fetchAirportWeather, WeatherData } from '../services/weatherService';
import WeatherPopup from './WeatherPopup';
import MapLayerControls, { FilterOptions } from './MapLayerControls';
import FlightRouteLegend from './FlightRouteLegend';
import FloatingControlsCard from './FloatingControlsCard';
import HeatLayer from './HeatLayer';
import HeatmapLegend from './HeatmapLegend';
import BusyRoutesPanel from './BusyRoutesPanel';
import React from 'react';

// Loading Spinner Component
const LoadingSpinner = React.memo(() => (
  <div 
    className="absolute inset-0 flex items-center justify-center" 
    style={{ 
      backgroundColor: 'rgba(0, 0, 0, 0.3)', 
      zIndex: 10000 
    }}
  >
    <div className="bg-white rounded-lg p-6 shadow-lg flex items-center gap-3">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <span className="text-gray-700 font-medium">Updating flights...</span>
    </div>
  </div>
));

LoadingSpinner.displayName = 'LoadingSpinner';

// Viewport bounds tracker component
const ViewportTracker = React.memo(({ onBoundsChange }: { onBoundsChange: (bounds: BoundingBox) => void }) => {
  const map = useMapEvents({
    moveend: () => {
      const bounds = map.getBounds();
      onBoundsChange(leafletBoundsToBoundingBox(bounds));
    },
    zoomend: () => {
      const bounds = map.getBounds();
      onBoundsChange(leafletBoundsToBoundingBox(bounds));
    },
    resize: () => {
      const bounds = map.getBounds();
      onBoundsChange(leafletBoundsToBoundingBox(bounds));
    }
  });

  // Get initial bounds
  useEffect(() => {
    if (map) {
      const bounds = map.getBounds();
      onBoundsChange(leafletBoundsToBoundingBox(bounds));
    }
  }, [map, onBoundsChange]);

  return null;
});

ViewportTracker.displayName = 'ViewportTracker';

// Memoized Flight Marker Component
const FlightMarker = React.memo(({
  feature,
  hasRoute,
  onAircraftClick
}: {
  feature: AircraftFeature;
  hasRoute: boolean;
  onAircraftClick?: (feature: AircraftFeature) => void;
}) => {
  const { coordinates } = feature.geometry;
  const lat = coordinates[1];
  const lng = coordinates[0];
  const heading = feature.properties.heading || 0;

  const eventHandlers = useMemo(() => hasRoute ? {
    click: () => onAircraftClick?.(feature)
  } : {}, [hasRoute, onAircraftClick, feature]);

  const icon = useMemo(() => 
    createPlaneIcon(hasRoute ? '#1f2937' : '#ef4444', heading),
    [hasRoute, heading]
  );

  return (
    <Marker
      position={[lat, lng]}
      icon={icon}
      eventHandlers={eventHandlers}
    >
      <Popup>
        <div style={{ fontSize: '12px', color: '#1f2937' }}>
          <strong>Flight {feature.properties.number || 'Unknown'}</strong><br />
          {feature.properties.origin_airport_iata && feature.properties.destination_airport_iata ? (
            <>
              Route: {feature.properties.origin_airport_iata} → {feature.properties.destination_airport_iata}<br />
            </>
          ) : (
            <>Incomplete route information<br /></>
          )}
          Altitude: {feature.properties.altitude || 'Unknown'} ft<br />
          Speed: {feature.properties.ground_speed || 'Unknown'} mph
        </div>
      </Popup>
    </Marker>
  );
});

FlightMarker.displayName = 'FlightMarker';

interface LeafletMapProps {
  selectedFlightNumber: string;
  onFlightSelect: (flightNumber: string) => void;
}

export default function LeafletMap({ selectedFlightNumber, onFlightSelect }: LeafletMapProps) {
  const [flightData, setFlightData] = useState<FlightGeoJSON | null>(null);
  const [displayFlights, setDisplayFlights] = useState<AircraftFeature[]>([]);
  const [viewportBounds, setViewportBounds] = useState<BoundingBox | null>(null);
  const [spatialIndex, setSpatialIndex] = useState<SpatialIndex | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [flightRoute, setFlightRoute] = useState<{
    flightNumber: string;
    origin: string;
    destination: string;
    originName: string;
    destinationName: string;
    originCoords: [number, number];
    destinationCoords: [number, number];
    currentCoords: [number, number];
  } | null>(null);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [showMarkers, setShowMarkers] = useState(true);
  const [markerLimit, setMarkerLimit] = useState(500);
  const [enableClustering, setEnableClustering] = useState(true);
  const [enableViewportCulling, setEnableViewportCulling] = useState(true);
  const [weatherData, setWeatherData] = useState<{
    [airportCode: string]: WeatherData;
  }>({});
  const [loadingWeather, setLoadingWeather] = useState<string | null>(null);
  const [mapLayerControlsOpen, setMapLayerControlsOpen] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    showGrounded: true,
    showInAir: true,
    showDomestic: true,
    showInternational: true,
    showIncomplete: true
  });
  const [filteredFlights, setFilteredFlights] = useState<AircraftFeature[]>([]);

  // Calculate flight statistics and busy routes from filtered data
  const flightStats = useMemo(() => getFlightStatistics(filteredFlights), [filteredFlights]);
  const busyRoutes = useMemo(() => analyzeBusyRoutes(filteredFlights), [filteredFlights]);

  // Trigger loading when settings change
  const triggerLoading = useCallback(() => {
    setIsLoading(true);
    // Auto-hide loading after a short delay
    setTimeout(() => setIsLoading(false), 800);
  }, []);

  // Wrapped setters that trigger loading
  const setShowHeatmapWithLoading = useCallback((value: boolean) => {
    triggerLoading();
    setShowHeatmap(value);
  }, [triggerLoading]);

  const setShowMarkersWithLoading = useCallback((value: boolean) => {
    triggerLoading();
    setShowMarkers(value);
  }, [triggerLoading]);

  const setMarkerLimitWithLoading = useCallback((value: number) => {
    triggerLoading();
    setMarkerLimit(value);
  }, [triggerLoading]);

  const setEnableClusteringWithLoading = useCallback((value: boolean) => {
    triggerLoading();
    setEnableClustering(value);
  }, [triggerLoading]);

  const setEnableViewportCullingWithLoading = useCallback((value: boolean) => {
    triggerLoading();
    setEnableViewportCulling(value);
  }, [triggerLoading]);

  const setFiltersWithLoading = useCallback((value: FilterOptions) => {
    triggerLoading();
    setFilters(value);
  }, [triggerLoading]);

  // Load flight data and create spatial index
  useEffect(() => {
    fetch('/data/EasternSeaboardSampled.geojson')
      .then((res) => res.json())
      .then((data: FlightGeoJSON) => {
        setFlightData(data);
        
        // Create spatial index for fast viewport queries
        const index = createSpatialIndex(data.features, 0.5); // 0.5 degree grid cells
        setSpatialIndex(index);
        
        // Initially populate displayFlights with a random subset
        const shuffled = [...data.features].sort(() => 0.5 - Math.random());
        const randomSubset = shuffled.slice(0, markerLimit);
        setDisplayFlights(randomSubset);
      })
      .catch((err) => console.error('Error loading flight data:', err));
  }, [markerLimit]);

  // Memoized filtered flights calculation
  const memoizedFilteredFlights = useMemo(() => {
    if (!flightData) return [];
    return filterFlights(flightData.features, filters);
  }, [flightData, filters]);

  // Update spatial index when filtered flights change
  useEffect(() => {
    setFilteredFlights(memoizedFilteredFlights);
    
    if (memoizedFilteredFlights.length > 0) {
      const index = createSpatialIndex(memoizedFilteredFlights, 0.5);
      setSpatialIndex(index);
    }
  }, [memoizedFilteredFlights]);

  // Handle viewport bounds change
  const handleBoundsChange = useCallback((bounds: BoundingBox) => {
    setViewportBounds(bounds);
  }, []);

  // Memoized function to check if flight has valid route info
  const hasValidRouteInfo = useCallback((feature: AircraftFeature): boolean => {
    const { origin_airport_iata, destination_airport_iata, number } = feature.properties;
    return !!(origin_airport_iata && destination_airport_iata && number);
  }, []);

  // Update display flights based on viewport and settings
  const updateDisplayFlights = useCallback(() => {
    if (!spatialIndex || !memoizedFilteredFlights.length) return;

    let flightsToShow: AircraftFeature[];

    // Create a stable pseudorandom number generator based on viewport
    const createStableRandom = (seed: number) => {
      return () => {
        seed = (seed * 9301 + 49297) % 233280;
        return seed / 233280;
      };
    };

    if (enableViewportCulling && viewportBounds) {
      // Use spatial index to get only flights in current viewport
      const viewportFlights = spatialIndex.queryBounds(viewportBounds);
      
      // Apply current filters to viewport flights
      const filteredViewportFlights = viewportFlights.filter(flight => {
        const hasComplete = hasValidRouteInfo(flight);
        // If incomplete flights are hidden and this flight is incomplete, filter it out
        if (!filters.showIncomplete && !hasComplete) {
          return false;
        }
        return true;
      });

      // Create a stable seed based on viewport bounds (rounded to avoid tiny changes)
      const stableSeed = Math.floor(viewportBounds.north * 100) + 
                        Math.floor(viewportBounds.south * 100) + 
                        Math.floor(viewportBounds.east * 100) + 
                        Math.floor(viewportBounds.west * 100);
      
      const stableRandom = createStableRandom(stableSeed);

      // Add stable random value to each flight for consistent but natural selection
      const flightsWithRandom = filteredViewportFlights.map(flight => ({
        flight,
        randomValue: stableRandom()
      }));

      // Sort by random value for natural distribution
      flightsWithRandom.sort((a, b) => a.randomValue - b.randomValue);
      
      // If viewport has more flights than limit, take first N flights (which are "randomly" distributed)
      if (flightsWithRandom.length > markerLimit) {
        flightsToShow = flightsWithRandom.slice(0, markerLimit).map(item => item.flight);
      } else {
        flightsToShow = flightsWithRandom.map(item => item.flight);
        
        // If viewport has fewer flights than limit, add flights from outside
        if (flightsToShow.length < markerLimit) {
          const remainingSlots = markerLimit - flightsToShow.length;
          const viewportSet = new Set(viewportFlights);
          const outsideFlights = memoizedFilteredFlights.filter(f => !viewportSet.has(f));
          
          if (outsideFlights.length > 0) {
            // Use same stable random for outside flights
            const outsideWithRandom = outsideFlights.map(flight => ({
              flight,
              randomValue: stableRandom()
            }));
            
            outsideWithRandom.sort((a, b) => a.randomValue - b.randomValue);
            flightsToShow = [...flightsToShow, ...outsideWithRandom.slice(0, remainingSlots).map(item => item.flight)];
          }
        }
      }
    } else {
      // No viewport culling - use stable random sampling
      const globalSeed = 12345; // Fixed seed for global view
      const stableRandom = createStableRandom(globalSeed);

      const flightsWithRandom = memoizedFilteredFlights.map(flight => ({
        flight,
        randomValue: stableRandom()
      }));

      flightsWithRandom.sort((a, b) => a.randomValue - b.randomValue);
      flightsToShow = flightsWithRandom.slice(0, markerLimit).map(item => item.flight);
    }

    setDisplayFlights(flightsToShow);
  }, [spatialIndex, memoizedFilteredFlights, viewportBounds, markerLimit, enableViewportCulling, filters, hasValidRouteInfo]);

  // Update display flights when dependencies change
  useEffect(() => {
    updateDisplayFlights();
  }, [updateDisplayFlights]);

  // Memoized aircraft click handler
  const handleAircraftClick = useCallback((flight: AircraftFeature) => {
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
      flightNumber: number!,
      origin: origin_airport_iata,
      destination: destination_airport_iata,
      originName: AIRPORT_NAMES[origin_airport_iata] || origin_airport_iata,
      destinationName: AIRPORT_NAMES[destination_airport_iata] || destination_airport_iata,
      originCoords,
      destinationCoords,
      currentCoords
    });

    // Ensure the searched flight is visible in displayFlights
    setDisplayFlights(prev => {
      // Check if the flight is already in the display list (case-insensitive)
      const flightExists = prev.some(f => f.properties.number?.toUpperCase() === number.toUpperCase());
      if (!flightExists) {
        // Remove one random flight and add the clicked flight
        const newFlights = prev.slice(0, -1);
        return [...newFlights, flight];
      }
      return prev;
    });
  }, []);

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

  // Handle selected flight number changes
  useEffect(() => {
    if (selectedFlightNumber && flightData) {
      const searchCode = selectedFlightNumber.trim().toUpperCase();
      const flight = flightData.features.find(f => f.properties.number?.toUpperCase() === searchCode);
      
      if (flight) {
        handleAircraftClick(flight);
      }
    }
  }, [selectedFlightNumber, flightData, handleAircraftClick]);

  // Memoized flight path calculation
  const flightPath = useMemo(() => {
    if (!flightRoute) return [];
    return getFlightPath(flightRoute.originCoords, flightRoute.destinationCoords);
  }, [flightRoute]);

  return (
    <div style={{ height: '100vh', width: '100%', position: 'relative' }}>
      {/* Loading Spinner Overlay */}
      {isLoading && <LoadingSpinner />}
      
      <MapContainer
        center={[40.7128, -74.0060]}
        zoom={6}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Viewport bounds tracker */}
        <ViewportTracker onBoundsChange={handleBoundsChange} />

        {/* Heatmap Layer */}
        {showHeatmap && filteredFlights.length > 0 && (
          <HeatLayer points={filteredFlights.map(feature => [
            feature.geometry.coordinates[1],
            feature.geometry.coordinates[0],
            0.8
          ])} />
        )}

        {/* Aircraft Markers with Spatial Optimization */}
        {showMarkers && (
          enableClustering ? (
            <MarkerClusterGroup
              chunkedLoading
              spiderfyOnMaxZoom={true}
              showCoverageOnHover={false}
              zoomToBoundsOnClick={true}
              iconCreateFunction={(cluster: any) => {
                const count = cluster.getChildCount();
                let size = 'small';
                if (count > 10) size = 'medium';
                if (count > 100) size = 'large';
                
                return L.divIcon({
                  html: `<div style="
                    background: linear-gradient(135deg, #3b82f6, #1d4ed8);
                    color: white;
                    width: ${size === 'small' ? '30px' : size === 'medium' ? '40px' : '50px'};
                    height: ${size === 'small' ? '30px' : size === 'medium' ? '40px' : '50px'};
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: ${size === 'small' ? '12px' : size === 'medium' ? '14px' : '16px'};
                    font-weight: bold;
                    border: 3px solid white;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                  ">${count}</div>`,
                  className: 'custom-cluster-icon',
                  iconSize: L.point(40, 40)
                });
              }}
            >
              {displayFlights.map((feature, index) => (
                <FlightMarker
                  key={`${feature.properties.number}-${index}`}
                  feature={feature}
                  hasRoute={hasValidRouteInfo(feature)}
                  onAircraftClick={handleAircraftClick}
                />
              ))}
            </MarkerClusterGroup>
          ) : (
            displayFlights.map((feature, index) => (
              <FlightMarker
                key={`${feature.properties.number}-${index}`}
                feature={feature}
                hasRoute={hasValidRouteInfo(feature)}
                onAircraftClick={handleAircraftClick}
              />
            ))
          )
        )}

        {/* Flight Route Display */}
        {flightRoute && (
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
                click: () => handleAirportClick(flightRoute.origin, { coords: flightRoute.originCoords })
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
                click: () => handleAirportClick(flightRoute.destination, { coords: flightRoute.destinationCoords })
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
        )}
      </MapContainer>

      {/* Right-side Controls Container */}
      <div className="absolute top-4 right-4" style={{ zIndex: 'var(--z-index-overlay-high)' }}>
        {/* Settings Control */}
        <div style={{ position: 'relative' }}>
          <MapLayerControls
            showHeatmap={showHeatmap}
            showMarkers={showMarkers}
            markerLimit={markerLimit}
            enableClustering={enableClustering}
            enableViewportCulling={enableViewportCulling}
            onHeatmapToggle={setShowHeatmapWithLoading}
            onMarkersToggle={setShowMarkersWithLoading}
            onMarkerLimitChange={setMarkerLimitWithLoading}
            onClusteringToggle={setEnableClusteringWithLoading}
            onViewportCullingToggle={setEnableViewportCullingWithLoading}
            onOpenChange={setMapLayerControlsOpen}
            onFilterChange={setFiltersWithLoading}
          />
        </div>

        {/* Flight Route Control */}
        {flightRoute && (
          <div style={{ 
            position: 'absolute', 
            top: mapLayerControlsOpen ? '336px' : '48px', 
            right: '0',
            transition: 'top 0.3s ease-in-out'
          }}>
            <FlightRouteLegend
              flightRoute={flightRoute}
              showMarkers={showMarkers}
              mapLayerControlsOpen={mapLayerControlsOpen}
              onClearRoute={() => setFlightRoute(null)}
            />
          </div>
        )}
      </div>

      {/* Left-side Controls Container */}
      <div className="absolute bottom-4 left-4" style={{ zIndex: 'var(--z-index-overlay)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <BusyRoutesPanel 
          routes={busyRoutes}
          totalFlights={flightStats.total}
          inAirFlights={flightStats.inAir}
          domesticFlights={flightStats.domestic}
          internationalFlights={flightStats.international}
          onRouteClick={(origin, destination) => {
            // Find a flight on this route to display
            const routeFlight = filteredFlights.find(f => 
              (f.properties.origin_airport_iata === origin && f.properties.destination_airport_iata === destination) ||
              (f.properties.origin_airport_iata === destination && f.properties.destination_airport_iata === origin)
            );
            if (routeFlight && routeFlight.properties.number) {
              // Trigger the same logic as searching for a flight
              const searchCode = routeFlight.properties.number.trim().toUpperCase();
              const flight = flightData?.features.find(f => f.properties.number?.toUpperCase() === searchCode);
              if (flight && onFlightSelect) {
                onFlightSelect(routeFlight.properties.number);
              }
            }
          }}
        />
        
        <HeatmapLegend showHeatmap={showHeatmap} />
      </div>

      {/* Performance Debug Info */}
      {spatialIndex && viewportBounds && (
        <div className="absolute top-4 left-4" style={{ 
          background: 'rgba(0,0,0,0.7)', 
          color: 'white', 
          padding: '8px', 
          borderRadius: '4px', 
          fontSize: '11px',
          zIndex: 1000 
        }}>
          Displaying: {displayFlights.length} / {filteredFlights.length} flights
          <br />
          Viewport Culling: {enableViewportCulling ? 'ON' : 'OFF'}
        </div>
      )}
    </div>
  );
} 