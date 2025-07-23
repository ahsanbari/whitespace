import React, { useState, useEffect } from 'react';

interface MapLayerControlsProps {
  showHeatmap: boolean;
  showMarkers: boolean;
  markerLimit: number;
  onHeatmapToggle: (show: boolean) => void;
  onMarkersToggle: (show: boolean) => void;
  onMarkerLimitChange: (limit: number) => void;
  onOpenChange?: (isOpen: boolean) => void;
}

export default function MapLayerControls({
  showHeatmap,
  showMarkers,
  markerLimit,
  onHeatmapToggle,
  onMarkersToggle,
  onMarkerLimitChange,
  onOpenChange
}: MapLayerControlsProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (onOpenChange) {
      onOpenChange(isOpen);
    }
  }, [isOpen, onOpenChange]);

  const CogIcon = () => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="3"></circle>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
    </svg>
  );

  if (!isOpen) {
    return (
      <div className="absolute top-4 right-4" style={{ zIndex: 'var(--z-index-overlay)' }}>
        <button
          onClick={() => setIsOpen(true)}
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
          title="Map Layer Settings"
        >
          <CogIcon />
        </button>
      </div>
    );
  }

  return (
    <div className="absolute top-4 right-4 map-control" style={{ zIndex: 'var(--z-index-overlay)' }}>
      <div className="flex items-center justify-between">
        <h3 className="map-control__title">Map Layers</h3>
        <button
          onClick={() => setIsOpen(false)}
          className="map-control__settings-btn"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 'var(--space-xs)',
            marginLeft: 'var(--space-sm)',
            fontSize: '16px',
            color: 'var(--color-neutral-600)',
            borderRadius: 'var(--radius-sm)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '24px',
            height: '24px'
          }}
          title="Close settings"
        >
          -
        </button>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)', marginTop: 'var(--space-sm)' }}>
        <label className="flex items-center map-control__text">
          <input
            type="checkbox"
            checked={showHeatmap}
            onChange={(e) => onHeatmapToggle(e.target.checked)}
            style={{ marginRight: 'var(--space-sm)' }}
          />
          Show Heatmap
        </label>
        
        <label className="flex items-center map-control__text">
          <input
            type="checkbox"
            checked={showMarkers}
            onChange={(e) => onMarkersToggle(e.target.checked)}
            style={{ marginRight: 'var(--space-sm)' }}
          />
          Show Aircraft ({markerLimit})
        </label>
        
        {showMarkers && (
          <div style={{ marginTop: 'var(--space-sm)' }}>
            <label 
              className="map-control__text" 
              style={{ display: 'block', marginBottom: 'var(--space-xs)' }}
            >
              Max Aircraft:
            </label>
            <select
              value={markerLimit}
              onChange={(e) => onMarkerLimitChange(Number(e.target.value))}
              className="map-control__text"
              style={{ 
                border: '1px solid var(--color-neutral-300)',
                borderRadius: 'var(--radius-sm)',
                padding: 'var(--space-xs) var(--space-sm)',
                width: '100%'
              }}
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
  );
} 