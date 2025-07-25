import React, { useEffect } from 'react';
import { useMapEvents } from 'react-leaflet';
import { BoundingBox, leafletBoundsToBoundingBox } from '../../../infrastructure/utils';

interface ViewportTrackerProps {
  onBoundsChange: (bounds: BoundingBox) => void;
}

const ViewportTracker = React.memo(({ onBoundsChange }: ViewportTrackerProps) => {
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

export default ViewportTracker; 