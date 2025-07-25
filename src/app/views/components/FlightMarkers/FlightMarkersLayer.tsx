import React from 'react';
import MarkerClusterGroup from 'react-leaflet-markercluster';
import L from 'leaflet';
import { AircraftFeature } from '../../../infrastructure/types';
import FlightMarker from './FlightMarker';

interface FlightMarkersLayerProps {
  displayFlights: AircraftFeature[];
  enableClustering: boolean;
  markerLimit: number;
  hasValidRouteInfo: (feature: AircraftFeature) => boolean;
  onAircraftClick: (feature: AircraftFeature) => void;
}

const FlightMarkersLayer = React.memo(({
  displayFlights,
  enableClustering,
  markerLimit,
  hasValidRouteInfo,
  onAircraftClick
}: FlightMarkersLayerProps) => {
  if (enableClustering) {
    return (
      <MarkerClusterGroup
        key={`cluster-${displayFlights.length}-${markerLimit}`} // Force recreation when flights change
        chunkedLoading
        spiderfyOnMaxZoom={true}
        showCoverageOnHover={false}
        zoomToBoundsOnClick={true}
        maxClusterRadius={50}
        iconCreateFunction={(cluster: any) => {
          const count = cluster.getChildCount();
          let size = 'small';
          if (count > 100) size = 'large';
          else if (count > 10) size = 'medium';
          
          // Debug log for large clusters
          if (count > markerLimit) {
            console.warn(`[ClusterGroup] Cluster shows ${count} flights but limit is ${markerLimit}. DisplayFlights: ${displayFlights.length}`);
          }
          
          return L.divIcon({
            html: `<div data-testid="cluster-marker" style="
              background: linear-gradient(135deg, #3b82f6, #1d4ed8);
              color: white;
              width: ${size === 'small' ? '30px' : size === 'medium' ? '40px' : '50px'};
              height: ${size === 'small' ? '30px' : size === 'medium' ? '40px' : '50px'};
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: ${size === 'small' ? '12px' : size === 'medium' ? '14px' : '16px'};
              font-weight: bold;
              border: 3px solid white;
              box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            ">${count}</div>`,
            className: 'custom-cluster-icon',
            iconSize: L.point(40, 40)
          });
        }}
      >
        {displayFlights.map((feature, index) => (
          <FlightMarker
            key={`${feature.properties.number}-${index}-${markerLimit}`}
            feature={feature}
            hasRoute={hasValidRouteInfo(feature)}
            onAircraftClick={onAircraftClick}
            data-testid="flight-marker"
          />
        ))}
      </MarkerClusterGroup>
    );
  }

  return (
    <>
      {displayFlights.map((feature, index) => (
        <FlightMarker
          key={`${feature.properties.number}-${index}-${markerLimit}`}
          feature={feature}
          hasRoute={hasValidRouteInfo(feature)}
          onAircraftClick={onAircraftClick}
        />
      ))}
    </>
  );
});

FlightMarkersLayer.displayName = 'FlightMarkersLayer';

export default FlightMarkersLayer; 