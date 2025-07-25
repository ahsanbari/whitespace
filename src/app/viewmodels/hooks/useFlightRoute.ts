import { useState, useCallback, useMemo, useEffect } from 'react';
import { AircraftFeature, FlightGeoJSON } from '../../infrastructure/types';
import { AIRPORT_COORDS, AIRPORT_NAMES } from '../../infrastructure/config';
import { getFlightPath } from '../../infrastructure/utils';

interface FlightRoute {
  flightNumber: string;
  origin: string;
  destination: string;
  originName: string;
  destinationName: string;
  originCoords: [number, number];
  destinationCoords: [number, number];
  currentCoords: [number, number];
}

export const useFlightRoute = (
  enableWebGL: boolean,
  setDisplayFlights: React.Dispatch<React.SetStateAction<AircraftFeature[]>>,
  flightData: FlightGeoJSON | null,
  selectedFlightNumber: string
) => {
  const [flightRoute, setFlightRoute] = useState<FlightRoute | null>(null);

  // Memoized aircraft click handler - ensure it's stable
  const handleAircraftClick = useCallback((flight: AircraftFeature) => {
    const { origin_airport_iata, destination_airport_iata, number } = flight.properties;

    if (!origin_airport_iata || !destination_airport_iata || !number) {
      alert(`Flight ${number || 'unknown'} does not have complete route information`);
      return;
    }

    const originCoords = AIRPORT_COORDS[origin_airport_iata];
    const destinationCoords = AIRPORT_COORDS[destination_airport_iata];

    if (!originCoords || !destinationCoords) {
      alert(`Airport coordinates not found for ${origin_airport_iata} or ${destination_airport_iata}`);
      return;
    }

    const currentCoords = flight.geometry.coordinates;

    setFlightRoute({
      flightNumber: number,
      origin: origin_airport_iata,
      destination: destination_airport_iata,
      originName: AIRPORT_NAMES[origin_airport_iata] || origin_airport_iata,
      destinationName: AIRPORT_NAMES[destination_airport_iata] || destination_airport_iata,
      originCoords: [originCoords[0], originCoords[1]],
      destinationCoords: [destinationCoords[0], destinationCoords[1]],
      currentCoords: [currentCoords[1], currentCoords[0]]
    });

    // Ensure the clicked flight is visible in displayFlights (only for regular mode)
    if (!enableWebGL) {
      setDisplayFlights(prev => {
        // Check if the flight is already in the display list (case-insensitive)
        const flightExists = prev.some(f => f.properties.number?.toUpperCase() === number.toUpperCase());
        if (!flightExists) {
          // Remove one random flight and add the clicked flight
          const newFlights = prev.slice(0, -1);
          return [...newFlights, flight];
        }
        return prev;
      });
    }
  }, [enableWebGL, setDisplayFlights]); // Include enableWebGL as dependency since we use it

  // Handle selected flight number changes
  useEffect(() => {
    if (selectedFlightNumber && flightData) {
      const searchCode = selectedFlightNumber.trim().toUpperCase();
      const flight = flightData.features.find(f => f.properties.number?.toUpperCase() === searchCode);
      
      if (flight) {
        handleAircraftClick(flight);
      }
    }
  }, [selectedFlightNumber, flightData, handleAircraftClick]);

  // Memoized flight path calculation
  const flightPath = useMemo(() => {
    if (!flightRoute) return [];
    return getFlightPath(flightRoute.originCoords, flightRoute.destinationCoords);
  }, [flightRoute]);

  return {
    flightRoute,
    flightPath,
    handleAircraftClick,
    setFlightRoute
  };
}; 