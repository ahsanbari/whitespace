import React, { useState } from 'react';
import { RouteInfo } from '../../../infrastructure/utils';

const CloseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <path 
      d="M18 6L6 18M6 6l12 12" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </svg>
);

const ChartIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path 
      d="M3 3v18h18M8 17V9m4 8V5m4 12v-4" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </svg>
);

interface BusyRoutesPanelProps {
  routes: RouteInfo[];
  totalFlights: number;
  inAirFlights: number;
  domesticFlights: number;
  internationalFlights: number;
  onRouteClick: (origin: string, destination: string) => void;
}

const BusyRoutesPanel = React.memo(({
  routes,
  totalFlights,
  inAirFlights,
  domesticFlights,
  internationalFlights,
  onRouteClick
}: BusyRoutesPanelProps) => {
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
        title="Show Flight Statistics"
      >
        <ChartIcon />
      </button>
    );
  }

  return (
    <div data-testid="busy-routes-panel" className="map-control" style={{ minWidth: '300px', maxWidth: '350px' }}>
      <div className="flex items-center justify-between" style={{ marginBottom: 'var(--space-md)' }}>
        <h3 className="map-control__title" style={{ marginBottom: 0 }}>Flight Statistics</h3>
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
          title="Close Statistics Panel"
          aria-label="Close Statistics Panel"
        >
          <CloseIcon />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3" style={{ marginBottom: 'var(--space-md)' }}>
        <div className="text-center p-2 rounded" style={{ background: 'rgba(59, 130, 246, 0.1)' }}>
          <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-primary)' }}>
            {totalFlights}
          </div>
          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
            Total Flights
          </div>
        </div>
        
        <div className="text-center p-2 rounded" style={{ background: 'rgba(34, 197, 94, 0.1)' }}>
          <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-bold)', color: 'rgb(34, 197, 94)' }}>
            {inAirFlights}
          </div>
          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
            In Air
          </div>
        </div>
        
        <div className="text-center p-2 rounded" style={{ background: 'rgba(168, 85, 247, 0.1)' }}>
          <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-bold)', color: 'rgb(168, 85, 247)' }}>
            {domesticFlights}
          </div>
          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
            Domestic
          </div>
        </div>
        
        <div className="text-center p-2 rounded" style={{ background: 'rgba(245, 158, 11, 0.1)' }}>
          <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-bold)', color: 'rgb(245, 158, 11)' }}>
            {internationalFlights}
          </div>
          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
            International
          </div>
        </div>
      </div>

      <h4 style={{ 
        fontSize: 'var(--font-size-sm)', 
        fontWeight: 'var(--font-weight-medium)', 
        marginBottom: 'var(--space-sm)',
        color: 'var(--color-text-primary)'
      }}>
        Top 8 Busiest Routes
      </h4>
      
      <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
        {routes.slice(0, 8).map((route, index) => (
          <div
            data-testid="busy-route-row"
            key={`${route.origin}-${route.destination}`}
            onClick={() => onRouteClick(route.origin, route.destination)}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: 'var(--space-sm)',
              borderBottom: '1px solid var(--map-control-border)',
              cursor: 'pointer',
              background: index % 2 === 0 ? 'var(--map-control-bg)' : 'var(--map-control-bg-alt)'
            }}
          >
            <div>
              <span style={{ fontSize: 'var(--font-size-md)', fontWeight: 'var(--font-weight-medium)' }}>{route.origin}</span>
              <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}> to </span>
              <span style={{ fontSize: 'var(--font-size-md)', fontWeight: 'var(--font-weight-medium)' }}>{route.destination}</span>
            </div>
            <div style={{ fontSize: 'var(--font-size-md)', fontWeight: 'var(--font-weight-medium)' }}>{route.count}</div>
          </div>
        ))}
      </div>
    </div>
  );
});

export default BusyRoutesPanel;