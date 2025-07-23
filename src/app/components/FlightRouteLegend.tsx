import React from 'react';

interface FlightRouteLegendProps {
  flightRoute: {
    flightNumber: string;
    origin: string;
    destination: string;
  };
  showMarkers: boolean;
  mapLayerControlsOpen: boolean;
  onClearRoute: () => void;
}

export default function FlightRouteLegend({
  flightRoute,
  showMarkers,
  mapLayerControlsOpen,
  onClearRoute
}: FlightRouteLegendProps) {
  // Calculate dynamic top margin based on map layer controls state
  const getTopMargin = () => {
    if (mapLayerControlsOpen) {
      return showMarkers ? '220px' : '180px';
    } else {
      return '60px';
    }
  };

  return (
    <div 
      className="absolute top-4 right-4 map-control" 
      style={{ 
        zIndex: 'var(--z-index-modal)',
        marginTop: getTopMargin(),
        maxWidth: '18rem'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-sm)' }}>
        <h3 className="map-control__title" style={{ marginBottom: 0 }}>
          Flight Route: {flightRoute.flightNumber}
        </h3>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
        <div className="flex items-center">
          <div 
            className="legend-origin"
            style={{ 
              width: 'var(--space-md)', 
              height: 'var(--space-md)', 
              marginRight: 'var(--space-sm)', 
              borderRadius: 'var(--radius-full)',
              border: '1px solid white'
            }}
          ></div>
          <span className="map-control__text">{flightRoute.origin} (Origin)</span>
        </div>
        <div className="flex items-center">
          <div 
            className="legend-destination"
            style={{ 
              width: 'var(--space-md)', 
              height: 'var(--space-md)', 
              marginRight: 'var(--space-sm)', 
              borderRadius: 'var(--radius-full)',
              border: '1px solid white'
            }}
          ></div>
          <span className="map-control__text">{flightRoute.destination} (Destination)</span>
        </div>
        <div className="flex items-center">
          <div 
            className="legend-current"
            style={{ 
              width: 'var(--space-md)', 
              height: 'var(--space-md)', 
              marginRight: 'var(--space-sm)', 
              borderRadius: 'var(--radius-full)',
              border: '1px solid white'
            }}
          ></div>
          <span className="map-control__text">Current Position</span>
        </div>
        <div className="flex items-center" style={{ marginTop: 'var(--space-sm)' }}>
          <div 
            className="legend-route"
            style={{
              width: 'var(--space-lg)', 
              height: '4px', 
              marginRight: 'var(--space-sm)', 
              opacity: 0.8,
              borderTop: '2px dashed var(--color-route)'
            }}
          ></div>
          <span className="map-control__text">Flight Path</span>
        </div>
        <button
          onClick={onClearRoute}
          className="btn-secondary"
          style={{ 
            marginTop: 'var(--space-md)',
            fontSize: 'var(--font-size-xs)',
            fontWeight: 'var(--font-weight-medium)'
          }}
          aria-label="Clear flight route"
          title="Clear flight route"
        >
          Clear Selected Flight
        </button>
      </div>
    </div>
  );
} 