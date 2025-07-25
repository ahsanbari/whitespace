import { useState, useEffect, useMemo } from 'react';
import { FlightGeoJSON, AircraftFeature } from '../../infrastructure/types';
import { FilterOptions } from '../../views/components/Controls/MapLayerControls';
import { filterFlights, createSpatialIndex } from '../../infrastructure/utils';
import { SpatialIndex } from '../../infrastructure/utils';

export const useFlightData = (filters: FilterOptions) => {
  const [flightData, setFlightData] = useState<FlightGeoJSON | null>(null);
  const [spatialIndex, setSpatialIndex] = useState<SpatialIndex | null>(null);

  // Load flight data
  useEffect(() => {
    fetch('/data/EasternSeaboardSampled.geojson')
      .then((res) => res.json())
      .then((data: FlightGeoJSON) => {
        setFlightData(data);
        
        // Create initial spatial index with ALL flights for fast viewport queries
        const index = createSpatialIndex(data.features, 0.5); // 0.5 degree grid cells
        setSpatialIndex(index);
      })
      .catch((err) => console.error('Error loading flight data:', err));
  }, []);

  // Memoized filtered flights calculation
  const filteredFlights = useMemo(() => {
    if (!flightData) return [];
    return filterFlights(flightData.features, filters);
  }, [flightData, filters]);

  // Update spatial index when filtered flights change
  useEffect(() => {
    if (filteredFlights.length > 0) {
      // Always create spatial index with ALL filtered flights
      const index = createSpatialIndex(filteredFlights, 0.5);
      setSpatialIndex(index);
    }
  }, [filteredFlights]);

  return {
    flightData,
    filteredFlights,
    spatialIndex
  };
}; 