import { useState, useEffect, useCallback, useMemo } from 'react';
import { AircraftFeature } from '../../infrastructure/types';
import { FilterOptions } from '../../views/components/Controls/MapLayerControls';
import { SpatialIndex, BoundingBox } from '../../infrastructure/utils';

interface UseFlightDisplayProps {
  filteredFlights: AircraftFeature[];
  spatialIndex: SpatialIndex | null;
  viewportBounds: BoundingBox | null;
  markerLimit: number;
  enableViewportCulling: boolean;
  enableWebGL: boolean;
  filters: FilterOptions;
}

export const useFlightDisplay = ({
  filteredFlights,
  spatialIndex,
  viewportBounds,
  markerLimit,
  enableViewportCulling,
  enableWebGL,
  filters
}: UseFlightDisplayProps) => {
  const [displayFlights, setDisplayFlights] = useState<AircraftFeature[]>([]);

  // Memoized function to check if flight has valid route info
  const hasValidRouteInfo = useCallback((feature: AircraftFeature): boolean => {
    const { origin_airport_iata, destination_airport_iata, number } = feature.properties;
    return !!(origin_airport_iata && destination_airport_iata && number);
  }, []);

  // Update display flights based on viewport and settings
  const updateDisplayFlights = useCallback(() => {
    if (!spatialIndex || !filteredFlights.length) return;

    // Create a stable pseudorandom number generator based on viewport
    const createStableRandom = (seed: number) => {
      return () => {
        seed = (seed * 9301 + 49297) % 233280;
        return seed / 233280;
      };
    };

    // In WebGL mode, clear displayFlights since WebGL handles rendering
    if (enableWebGL) {
      setDisplayFlights([]);
      return;
    }

    let flightsToShow: AircraftFeature[];

    if (enableViewportCulling && viewportBounds) {
      // Use spatial index to get only flights in current viewport
      const viewportFlights = spatialIndex.queryBounds(viewportBounds);
      
      // Apply current filters to viewport flights
      const filteredViewportFlights = viewportFlights.filter(flight => {
        const hasComplete = hasValidRouteInfo(flight);
        // If incomplete flights are hidden and this flight is incomplete, filter it out
        if (!filters.showIncomplete && !hasComplete) {
          return false;
        }
        return true;
      });

      // Regular mode: use pseudorandom selection with marker limit
      // Create a stable seed based on viewport bounds (rounded to avoid tiny changes)
      const stableSeed = Math.floor(viewportBounds.north * 100) + 
                        Math.floor(viewportBounds.south * 100) + 
                        Math.floor(viewportBounds.east * 100) + 
                        Math.floor(viewportBounds.west * 100);
      
      const stableRandom = createStableRandom(stableSeed);

      // Add stable random value to each flight for consistent but natural selection
      const flightsWithRandom = filteredViewportFlights.map(flight => ({
        flight,
        randomValue: stableRandom()
      }));

      // Sort by random value for natural distribution
      flightsWithRandom.sort((a, b) => a.randomValue - b.randomValue);
      
      // If viewport has more flights than limit, take first N flights (which are "randomly" distributed)
      if (flightsWithRandom.length > markerLimit) {
        flightsToShow = flightsWithRandom.slice(0, markerLimit).map(item => item.flight);
      } else {
        flightsToShow = flightsWithRandom.map(item => item.flight);
        
        // If viewport has fewer flights than limit, add flights from outside
        if (flightsToShow.length < markerLimit) {
          const remainingSlots = markerLimit - flightsToShow.length;
          const viewportSet = new Set(viewportFlights);
          const outsideFlights = filteredFlights.filter(f => !viewportSet.has(f));
          
          if (outsideFlights.length > 0) {
            // Use same stable random for outside flights
            const outsideWithRandom = outsideFlights.map(flight => ({
              flight,
              randomValue: stableRandom()
            }));
            
            outsideWithRandom.sort((a, b) => a.randomValue - b.randomValue);
            flightsToShow = [...flightsToShow, ...outsideWithRandom.slice(0, remainingSlots).map(item => item.flight)];
          }
        }
      }
    } else {
      // No viewport culling OR no viewport bounds yet - use stable random sampling from all filtered flights
      // Regular mode with random sampling
      const globalSeed = 12345; // Fixed seed for global view
      const stableRandom = createStableRandom(globalSeed);

      const flightsWithRandom = filteredFlights.map(flight => ({
        flight,
        randomValue: stableRandom()
      }));

      flightsWithRandom.sort((a, b) => a.randomValue - b.randomValue);
      flightsToShow = flightsWithRandom.slice(0, markerLimit).map(item => item.flight);
    }

    // Final safety check: ensure we never exceed the marker limit
    if (flightsToShow.length > markerLimit) {
      flightsToShow = flightsToShow.slice(0, markerLimit);
      console.warn(`[updateDisplayFlights] Enforced marker limit: ${flightsToShow.length}/${markerLimit}`);
    }

    // Final safety check: ensure we never exceed the marker limit
    if (flightsToShow.length > markerLimit) {
      flightsToShow = flightsToShow.slice(0, markerLimit);
      console.warn(`[updateDisplayFlights] Enforced marker limit: ${flightsToShow.length}/${markerLimit}`);
    }

    console.log(`[updateDisplayFlights] Setting displayFlights to ${flightsToShow.length} flights (limit: ${markerLimit})`);
    setDisplayFlights(flightsToShow);
  }, [spatialIndex, filteredFlights, viewportBounds, markerLimit, enableViewportCulling, filters, hasValidRouteInfo, enableWebGL]);

  // Update display flights when dependencies change
  useEffect(() => {
    updateDisplayFlights();
  }, [updateDisplayFlights]);

  return {
    displayFlights,
    hasValidRouteInfo,
    setDisplayFlights
  };
}; 