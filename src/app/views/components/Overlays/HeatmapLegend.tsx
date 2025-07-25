import React from 'react';

interface HeatmapLegendProps {
  showHeatmap: boolean;
}

const HeatmapLegend = React.memo(({ showHeatmap }: HeatmapLegendProps) => {
  if (!showHeatmap) return null;

  return (
    <div className="map-control max-w-max">
      <h3 className="map-control__title">Aircraft Density</h3>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
        <div className="flex items-center map-control__text">
          <div 
            className="heatmap-gradient"
            style={{ 
              width: 'var(--space-lg)', 
              height: 'var(--space-md)', 
              marginRight: 'var(--space-sm)', 
              borderRadius: 'var(--radius-sm)' 
            }}
          ></div>
          <span>Low → High</span>
        </div>
        
        <div style={{ marginTop: 'var(--space-sm)' }}>
          <div className="flex items-center" style={{ marginBottom: 'var(--space-xs)' }}>
            <div 
              className="heat-low"
              style={{ 
                width: 'var(--space-md)', 
                height: 'var(--space-md)', 
                marginRight: 'var(--space-sm)', 
                borderRadius: 'var(--radius-sm)' 
              }}
            ></div>
            <span className="map-control__text" style={{ color: 'var(--color-text-muted)' }}>Few aircraft</span>
          </div>
          <div className="flex items-center" style={{ marginBottom: 'var(--space-xs)' }}>
            <div 
              className="heat-medium"
              style={{ 
                width: 'var(--space-md)', 
                height: 'var(--space-md)', 
                marginRight: 'var(--space-sm)', 
                borderRadius: 'var(--radius-sm)' 
              }}
            ></div>
            <span className="map-control__text" style={{ color: 'var(--color-text-muted)' }}>Moderate traffic</span>
          </div>
          <div className="flex items-center">
            <div 
              className="heat-high"
              style={{ 
                width: 'var(--space-md)', 
                height: 'var(--space-md)', 
                marginRight: 'var(--space-sm)', 
                borderRadius: 'var(--radius-sm)' 
              }}
            ></div>
            <span className="map-control__text" style={{ color: 'var(--color-text-muted)' }}>Heavy traffic</span>
          </div>
        </div>
      </div>
    </div>
  );
});

HeatmapLegend.displayName = 'HeatmapLegend';

export default HeatmapLegend; 