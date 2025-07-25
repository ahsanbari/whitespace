import React, { useState } from 'react';
import { AIRPORT_NAMES } from '../../../infrastructure/config';

interface FlightRouteLegendProps {
  flightRoute: {
    flightNumber: string;
    origin: string;
    destination: string;
    originName: string;
    destinationName: string;
  };
  showMarkers: boolean;
  mapLayerControlsOpen: boolean;
  onClearRoute: () => void;
}

const FlightRouteLegend = React.memo(({
  flightRoute,
  showMarkers,
  mapLayerControlsOpen,
  onClearRoute
}: FlightRouteLegendProps) => {
  const [isVisible, setIsVisible] = useState(true);

  // If panel is dismissed, show a small reopener button
  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="map-control__settings-btn"
        style={{
          background: 'var(--map-control-bg)',
          border: '1px solid var(--map-control-border)',
          borderRadius: 'var(--map-control-radius)',
          boxShadow: 'var(--map-control-shadow)',
          cursor: 'pointer',
          padding: 'var(--space-sm)',
          color: 'var(--color-neutral-600)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '40px',
          height: '40px'
        }}
        title={`Show Flight Route: ${flightRoute.flightNumber}`}
        aria-label={`Show Flight Route: ${flightRoute.flightNumber}`}
      >
        <FlightRouteIcon />
      </button>
    );
  }

  return (
    <div className="map-control" style={{ maxWidth: '18rem', minWidth: '16rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-sm)' }}>
        <h3 className="map-control__title" style={{ marginBottom: 0 }}>
          Flight Route: {flightRoute.flightNumber}
        </h3>
        <button
          onClick={() => setIsVisible(false)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-neutral-500)',
            borderRadius: '4px',
            width: '24px',
            height: '24px'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--color-neutral-100)';
            e.currentTarget.style.color = 'var(--color-neutral-700)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'none';
            e.currentTarget.style.color = 'var(--color-neutral-500)';
          }}
          title="Minimize Flight Route Panel"
          aria-label="Minimize Flight Route Panel"
        >
          <MinimizeIcon />
        </button>
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
              border: '1px solid white',
              background: 'var(--color-origin)'
            }}
          ></div>
          <span className="map-control__text">{flightRoute.originName} [{flightRoute.origin}] (Origin)</span>
        </div>
        <div className="flex items-center">
          <div 
            className="legend-destination"
            style={{ 
              width: 'var(--space-md)', 
              height: 'var(--space-md)', 
              marginRight: 'var(--space-sm)', 
              borderRadius: 'var(--radius-full)',
              border: '1px solid white',
              background: 'var(--color-destination)'
            }}
          ></div>
          <span className="map-control__text">{flightRoute.destinationName} [{flightRoute.destination}] (Destination)</span>
        </div>
        <div className="flex items-center">
          <div 
            className="legend-current"
            style={{ 
              width: 'var(--space-md)', 
              height: 'var(--space-md)', 
              marginRight: 'var(--space-sm)', 
              borderRadius: 'var(--radius-full)',
              border: '1px solid white',
              background: 'var(--color-current)'
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
            fontWeight: 'var(--font-weight-medium)',
            padding: 'var(--space-sm) var(--space-md)',
            border: '1px solid var(--color-neutral-300)',
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(255, 255, 255, 0.9)',
            color: 'var(--color-text-secondary)',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--color-neutral-100)';
            e.currentTarget.style.color = 'var(--color-text-primary)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.9)';
            e.currentTarget.style.color = 'var(--color-text-secondary)';
          }}
          aria-label="Clear flight route"
          title="Clear flight route"
        >
          Clear Selected Flight
        </button>
      </div>
    </div>
  );
});

FlightRouteLegend.displayName = 'FlightRouteLegend';

export default FlightRouteLegend;

// Flight Route Icon Component for the reopener button
const FlightRouteIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path 
      d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" 
      fill="currentColor"
    />
    <circle cx="6" cy="12" r="2" fill="var(--color-origin)" opacity="0.8"/>
    <circle cx="18" cy="12" r="2" fill="var(--color-destination)" opacity="0.8"/>
  </svg>
);

// Minimize Icon Component
const MinimizeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path 
      d="M6 12h12" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </svg>
); 