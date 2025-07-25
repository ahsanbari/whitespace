import React, { useState, useEffect, useCallback } from 'react';

interface MapLayerControlsProps {
  showHeatmap: boolean;
  showMarkers: boolean;
  markerLimit: number;
  enableClustering: boolean;
  enableViewportCulling?: boolean;
  onHeatmapToggle: (show: boolean) => void;
  onMarkersToggle: (show: boolean) => void;
  onMarkerLimitChange: (limit: number) => void;
  onClusteringToggle: (enable: boolean) => void;
  onViewportCullingToggle?: (enable: boolean) => void;
  onOpenChange?: (isOpen: boolean) => void;
  // New filter props
  onFilterChange?: (filters: FilterOptions) => void;
}

export interface FilterOptions {
  showGrounded: boolean;
  showInAir: boolean;
  showDomestic: boolean;
  showInternational: boolean;
  showIncomplete: boolean;
}

const MapLayerControls = React.memo(({
  showHeatmap,
  showMarkers,
  markerLimit,
  enableClustering,
  enableViewportCulling = true,
  onHeatmapToggle,
  onMarkersToggle,
  onMarkerLimitChange,
  onClusteringToggle,
  onViewportCullingToggle,
  onOpenChange,
  onFilterChange
}: MapLayerControlsProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>('display');
  const [filters, setFilters] = useState<FilterOptions>({
    showGrounded: true,
    showInAir: true,
    showDomestic: true,
    showInternational: true,
    showIncomplete: true
  });

  useEffect(() => {
    if (onOpenChange) {
      onOpenChange(isOpen);
    }
  }, [isOpen, onOpenChange]);

  const handleFilterChange = useCallback((newFilters: Partial<FilterOptions>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    
    if (onFilterChange) {
      onFilterChange(updatedFilters);
    }
  }, [filters, onFilterChange]);

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

  const SectionButton = ({ id, title, isActive, onClick }: { id: string; title: string; isActive: boolean; onClick: () => void }) => (
    <button
      onClick={onClick}
      className="map-control__section-btn"
      style={{
        width: '100%',
        padding: 'var(--space-sm)',
        border: 'none',
        background: isActive ? 'var(--color-primary-100)' : 'transparent',
        color: isActive ? 'var(--color-primary-700)' : 'var(--color-text-secondary)',
        borderRadius: 'var(--radius-sm)',
        fontSize: 'var(--font-size-xs)',
        fontWeight: isActive ? 'var(--font-weight-semibold)' : 'var(--font-weight-normal)',
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'all 0.2s ease'
      }}
    >
      {title}
    </button>
  );

  if (!isOpen) {
    return (
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
    );
  }

  return (
    <div className="map-control" style={{ minWidth: '280px' }}>
      <div className="flex items-center justify-between">
        <h3 className="map-control__title">Map Settings</h3>
        <button
          onClick={() => setIsOpen(false)}
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
          title="Close Settings"
          aria-label="Close Settings"
        >
          <CloseIcon />
        </button>
      </div>
      
      {/* Section Navigation */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)', marginTop: 'var(--space-sm)', marginBottom: 'var(--space-md)' }}>
        <SectionButton
          id="display"
          title="Display & Layers"
          isActive={activeSection === 'display'}
          onClick={() => setActiveSection(activeSection === 'display' ? null : 'display')}
        />
        <SectionButton
          id="filters"
          title="Flight Filters"
          isActive={activeSection === 'filters'}
          onClick={() => setActiveSection(activeSection === 'filters' ? null : 'filters')}
        />
      </div>

      {/* Display & Layers Section */}
      {activeSection === 'display' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)', marginBottom: 'var(--space-md)' }}>
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
            <label className="flex items-center map-control__text">
              <input
                type="checkbox"
                checked={enableClustering}
                onChange={(e) => onClusteringToggle(e.target.checked)}
                style={{ marginRight: 'var(--space-sm)' }}
              />
              Group Nearby Aircraft
            </label>
          )}
          
          {showMarkers && (
            <label className="flex items-center map-control__text">
              <input
                type="checkbox"
                checked={enableViewportCulling}
                onChange={(e) => onViewportCullingToggle?.(e.target.checked)}
                style={{ marginRight: 'var(--space-sm)' }}
              />
              Smart Viewport Rendering
            </label>
          )}
          
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
      )}

      {/* Flight Filters Section */}
      {activeSection === 'filters' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          {/* Flight Status */}
          <div>
            <label className="map-control__text" style={{ display: 'block', marginBottom: 'var(--space-xs)', fontWeight: 'var(--font-weight-semibold)' }}>
              Flight Status:
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
              <label className="flex items-center map-control__text">
                <input
                  type="checkbox"
                  checked={filters.showInAir}
                  onChange={(e) => handleFilterChange({ showInAir: e.target.checked })}
                  style={{ marginRight: 'var(--space-sm)' }}
                />
                In-Air Flights
              </label>
              <label className="flex items-center map-control__text">
                <input
                  type="checkbox"
                  checked={filters.showGrounded}
                  onChange={(e) => handleFilterChange({ showGrounded: e.target.checked })}
                  style={{ marginRight: 'var(--space-sm)' }}
                />
                Grounded Aircraft
              </label>
            </div>
          </div>

          {/* Route Type */}
          <div>
            <label className="map-control__text" style={{ display: 'block', marginBottom: 'var(--space-xs)', fontWeight: 'var(--font-weight-semibold)' }}>
              Route Type:
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
              <label className="flex items-center map-control__text">
                <input
                  type="checkbox"
                  checked={filters.showDomestic}
                  onChange={(e) => handleFilterChange({ showDomestic: e.target.checked })}
                  style={{ marginRight: 'var(--space-sm)' }}
                />
                Domestic Flights
              </label>
              <label className="flex items-center map-control__text">
                <input
                  type="checkbox"
                  checked={filters.showInternational}
                  onChange={(e) => handleFilterChange({ showInternational: e.target.checked })}
                  style={{ marginRight: 'var(--space-sm)' }}
                />
                International Flights
              </label>
              <label className="flex items-center map-control__text">
                <input
                  type="checkbox"
                  checked={filters.showIncomplete}
                  onChange={(e) => handleFilterChange({ showIncomplete: e.target.checked })}
                  style={{ marginRight: 'var(--space-sm)' }}
                />
                Incomplete Route Data
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

MapLayerControls.displayName = 'MapLayerControls';

export default MapLayerControls;

// Close Icon Component
const CloseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path 
      d="M18 6L6 18M6 6l12 12" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </svg>
); 