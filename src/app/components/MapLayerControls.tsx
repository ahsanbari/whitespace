import React from 'react';

interface MapLayerControlsProps {
  showHeatmap: boolean;
  showMarkers: boolean;
  markerLimit: number;
  onHeatmapToggle: (show: boolean) => void;
  onMarkersToggle: (show: boolean) => void;
  onMarkerLimitChange: (limit: number) => void;
}

export default function MapLayerControls({
  showHeatmap,
  showMarkers,
  markerLimit,
  onHeatmapToggle,
  onMarkersToggle,
  onMarkerLimitChange
}: MapLayerControlsProps) {
  return (
    <div className="absolute top-4 right-4 map-control" style={{ zIndex: 'var(--z-index-overlay)' }}>
      <h3 className="map-control__title">Map Layers</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
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