import React, { useMemo } from 'react';
import { Marker, Popup } from 'react-leaflet';
import { AircraftFeature } from '../../../infrastructure/types';
import { createPlaneIcon } from '../../../infrastructure/utils';

interface FlightMarkerProps {
  feature: AircraftFeature;
  hasRoute: boolean;
  onAircraftClick?: (feature: AircraftFeature) => void;
}

const FlightMarker = React.memo(({
  feature,
  hasRoute,
  onAircraftClick
}: FlightMarkerProps) => {
  const { coordinates } = feature.geometry;
  const lat = coordinates[1];
  const lng = coordinates[0];
  const heading = feature.properties.heading || 0;

  const eventHandlers = useMemo(() => hasRoute ? {
    click: () => onAircraftClick?.(feature)
  } : {}, [hasRoute, onAircraftClick, feature]);

  const icon = useMemo(() => 
    createPlaneIcon(hasRoute ? '#1f2937' : '#ef4444', heading),
    [hasRoute, heading]
  );

  return (
    <Marker
      position={[lat, lng]}
      icon={icon}
      eventHandlers={eventHandlers}
    >
      <Popup>
        <div style={{ fontSize: '12px', color: '#1f2937' }}>
          <strong>Flight {feature.properties.number || 'Unknown'}</strong><br />
          {feature.properties.origin_airport_iata && feature.properties.destination_airport_iata ? (
            <>
              Route: {feature.properties.origin_airport_iata} → {feature.properties.destination_airport_iata}<br />
            </>
          ) : (
            <>Incomplete route information<br /></>
          )}
          Altitude: {feature.properties.altitude || 'Unknown'} ft<br />
          Speed: {feature.properties.ground_speed || 'Unknown'} mph
        </div>
      </Popup>
    </Marker>
  );
});

FlightMarker.displayName = 'FlightMarker';

export default FlightMarker; 