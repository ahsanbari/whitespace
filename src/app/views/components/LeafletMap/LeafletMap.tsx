"use client";
import { useState, useMemo, useCallback } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';

// Infrastructure imports
import { AircraftFeature, BoundingBox } from '../../../infrastructure';
import { getFlightStatistics, analyzeBusyRoutes, isWebGLSupported } from '../../../infrastructure/utils';

// Component imports organized by feature
import { ViewportTracker } from './';
import { FlightMarkersLayer } from '../FlightMarkers';
import { FlightRouteLayer } from '../FlightRoute';
import { MapLayerControls, BusyRoutesPanel, FloatingControlsCard } from '../Controls';
import { FlightRouteLegend } from '../FlightRoute';
import { HeatLayer, HeatmapLegend, WebGLLayerManager } from '../Overlays';
import { LoadingSpinner } from '../UI';

// ViewModel imports
import { 
  useFlightData, 
  useFlightDisplay, 
  useAirportWeather, 
  useFlightRoute, 
  useLoadingState 
} from '../../../viewmodels';

// Types
import { FilterOptions } from '../Controls/MapLayerControls';
import React from 'react';



interface LeafletMapProps {
  selectedFlightNumber: string;
  onFlightSelect: (flightNumber: string) => void;
}

export default function LeafletMap({ selectedFlightNumber, onFlightSelect }: LeafletMapProps) {
  // State for map settings
  const [viewportBounds, setViewportBounds] = useState<BoundingBox | null>(null);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [showMarkers, setShowMarkers] = useState(true);
  const [markerLimit, setMarkerLimit] = useState(1000);
  const [enableClustering, setEnableClustering] = useState(true);
  const [enableViewportCulling, setEnableViewportCulling] = useState(false);
  const [enableWebGL, setEnableWebGL] = useState(false);
  const [webglSupported, setWebglSupported] = useState(false);
  const [webglStats, setWebglStats] = useState({ 
    totalFlights: 0, 
    visibleFlights: 0, 
    currentLOD: 1
  });
  const [mapLayerControlsOpen, setMapLayerControlsOpen] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    showGrounded: true,
    showInAir: true,
    showDomestic: true,
    showInternational: true,
    showIncomplete: false
  });

  // Custom hooks for data and logic management
  const { flightData, filteredFlights, spatialIndex } = useFlightData(filters);
  const { displayFlights, hasValidRouteInfo, setDisplayFlights } = useFlightDisplay({
    filteredFlights,
    spatialIndex,
    viewportBounds,
    markerLimit,
    enableViewportCulling,
    enableWebGL,
    filters
  });
  const { weatherData, loadingWeather, handleAirportClick } = useAirportWeather();
  const { flightRoute, flightPath, handleAircraftClick, setFlightRoute } = useFlightRoute(
    enableWebGL,
    setDisplayFlights,
    flightData,
    selectedFlightNumber
  );
  const { isLoading, withLoading } = useLoadingState();

  // Initialize WebGL support check
  React.useEffect(() => {
    setWebglSupported(isWebGLSupported());
  }, []);

  // Calculate flight statistics and busy routes from currently displayed flights
  const displayedFlightsForStats = useMemo(() => {
    if (enableWebGL) {
      // In WebGL mode, show stats for ALL filtered flights since WebGL renders all of them
      // (WebGL handles performance through LOD and spatial partitioning, not by limiting the dataset)
      return filteredFlights;
    } else {
      // In regular mode, show stats only for the limited displayFlights array
      return displayFlights;
    }
  }, [enableWebGL, filteredFlights, displayFlights]);

  const flightStats = useMemo(() => getFlightStatistics(displayedFlightsForStats), [displayedFlightsForStats]);
  const busyRoutes = useMemo(() => analyzeBusyRoutes(displayedFlightsForStats), [displayedFlightsForStats]);

  // Wrapped setters that trigger loading
  const setShowHeatmapWithLoading = withLoading(setShowHeatmap);
  const setShowMarkersWithLoading = withLoading(setShowMarkers);
  const setMarkerLimitWithLoading = withLoading(setMarkerLimit);
  const setEnableClusteringWithLoading = withLoading(setEnableClustering);
  const setEnableViewportCullingWithLoading = withLoading(setEnableViewportCulling);
  const setFiltersWithLoading = withLoading(setFilters);

  // Special WebGL setter with canvas cleanup
  const setEnableWebGLWithLoading = useCallback((value: boolean) => {
    withLoading(setEnableWebGL)(value);
    
    // If disabling WebGL, immediately try to clean up canvases
    if (!value) {
      console.log('[WebGL Toggle] Disabling WebGL, cleaning canvases');
      setTimeout(() => {
        const canvases = document.querySelectorAll('canvas');
        canvases.forEach((canvas, index) => {
          const style = canvas.style;
          // Check if it looks like a WebGL canvas
          if (style.position === 'absolute' && 
              (style.zIndex === '200' || style.top === '0px' || style.left === '0px')) {
            console.log(`[WebGL Toggle] Removing canvas ${index}`);
            canvas.remove();
          }
        });
      }, 50); // Immediate cleanup
    }
  }, [withLoading]);

  // Handle WebGL stats updates
  const handleWebGLStatsUpdate = useCallback((stats: any) => {
    setWebglStats(stats);
  }, []);

  // Reset WebGL stats when WebGL is disabled
  React.useEffect(() => {
    if (!enableWebGL) {
      setWebglStats({ 
        totalFlights: 0, 
        visibleFlights: 0, 
        currentLOD: 1
      });
    }
  }, [enableWebGL]);

  // Handle viewport bounds change
  const handleBoundsChange = useCallback((bounds: BoundingBox) => {
    setViewportBounds(bounds);
  }, []);

  return (
    <div data-testid="map-container" style={{ height: '100vh', width: '100%', position: 'relative' }}>
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

        {/* WebGL Layer Manager */}
        {enableWebGL && (
          <WebGLLayerManager
            key="webgl-manager" // Stable key to prevent recreation
            flights={filteredFlights}
            enabled={enableWebGL}
            onStatsUpdate={handleWebGLStatsUpdate}
            onAircraftClick={handleAircraftClick}
          />
        )}

        {/* Aircraft Markers with Spatial Optimization */}
        {!enableWebGL && showMarkers && (
          <FlightMarkersLayer
            displayFlights={displayFlights}
            enableClustering={enableClustering}
            markerLimit={markerLimit}
            hasValidRouteInfo={hasValidRouteInfo}
            onAircraftClick={handleAircraftClick}
          />
        )}

        {/* Flight Route Display */}
        {flightRoute && (
          <FlightRouteLayer
            flightRoute={flightRoute}
            flightPath={flightPath}
            weatherData={weatherData}
            loadingWeather={loadingWeather}
            onAirportClick={handleAirportClick}
          />
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
            showAllFlights={enableWebGL}
            webglSupported={webglSupported}
            onHeatmapToggle={setShowHeatmapWithLoading}
            onMarkersToggle={setShowMarkersWithLoading}
            onMarkerLimitChange={setMarkerLimitWithLoading}
            onClusteringToggle={setEnableClusteringWithLoading}
            onViewportCullingToggle={setEnableViewportCullingWithLoading}
            onShowAllFlightsToggle={setEnableWebGLWithLoading}
            onOpenChange={setMapLayerControlsOpen}
            onFilterChange={setFiltersWithLoading}
          />
        </div>

        {/* Flight Route Control */}
        {flightRoute && (
          <div style={{ 
            position: 'absolute', 
            top: mapLayerControlsOpen ? '372px' : '48px', 
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
    </div>
  );
} 