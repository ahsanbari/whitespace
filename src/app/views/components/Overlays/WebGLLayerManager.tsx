import React, { useState, useEffect } from 'react';
import { useMapEvents } from 'react-leaflet';
import { AircraftFeature } from '../../../infrastructure/types';
import { WebGLFlightLayer } from '../../../infrastructure/utils';

interface WebGLLayerManagerProps {
  flights: AircraftFeature[];
  enabled: boolean;
  onStatsUpdate: (stats: any) => void;
  onAircraftClick?: (feature: AircraftFeature) => void;
}

const WebGLLayerManager = React.memo(({ 
  flights, 
  enabled,
  onStatsUpdate,
  onAircraftClick
}: WebGLLayerManagerProps) => {
  const [webglLayer, setWebglLayer] = useState<WebGLFlightLayer | null>(null);
  
  const map = useMapEvents({});

  // Single useEffect to handle all WebGL layer lifecycle
  useEffect(() => {
    if (!map) return;

    if (!enabled || !flights.length) {
      // Clean up existing layer
      if (webglLayer) {
        console.log('[WebGLLayerManager] Removing WebGL layer - disabled or no flights');
        try {
          map.removeLayer(webglLayer);
        } catch (error) {
          console.error('[WebGLLayerManager] Error removing layer:', error);
        }
        setWebglLayer(null);
        onStatsUpdate({ 
          totalFlights: 0, 
          visibleFlights: 0, 
          currentLOD: 1
        });
      }
      return;
    }

    // Create or update WebGL layer
    if (!webglLayer) {
      console.log('[WebGLLayerManager] Creating new WebGL layer');
      try {
        const layer = new WebGLFlightLayer(flights, onAircraftClick);
        map.addLayer(layer);
        setWebglLayer(layer);
        console.log('[WebGLLayerManager] Created WebGL layer with', flights.length, 'flights');
        
        // Update stats after creation
        setTimeout(() => {
          onStatsUpdate(layer.getStats());
        }, 100);
      } catch (error) {
        console.error('[WebGLLayerManager] Error creating layer:', error);
      }
    } else {
      // Update existing layer with new flights
      console.log('[WebGLLayerManager] Updating existing layer with', flights.length, 'flights');
      try {
        webglLayer.setFlights(flights);
        setTimeout(() => {
          onStatsUpdate(webglLayer.getStats());
        }, 100);
      } catch (error) {
        console.error('[WebGLLayerManager] Error updating layer:', error);
      }
    }
  }, [map, enabled, flights.length]); // Simplified dependencies - only track flights.length, not the array itself

  // Cleanup on unmount only
  useEffect(() => {
    return () => {
      console.log('[WebGLLayerManager] Component unmounting');
      if (webglLayer && map) {
        try {
          map.removeLayer(webglLayer);
          console.log('[WebGLLayerManager] Cleanup: Layer removed');
        } catch (error) {
          console.error('[WebGLLayerManager] Error during cleanup:', error);
        }
      }
    };
  }, []); // Empty dependency array - only run on unmount

  return null;
});

WebGLLayerManager.displayName = 'WebGLLayerManager';

export default WebGLLayerManager; 