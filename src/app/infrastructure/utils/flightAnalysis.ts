import { AircraftFeature } from '../types/flight';
import { AIRPORT_COORDS } from '../config/airports';

/**
 * Flight data analysis utilities for route popularity and flight classification
 */

export interface RouteInfo {
  route: string;
  origin: string;
  destination: string;
  count: number;
  flights: string[];
  distance?: number;
}

export interface FlightClassification {
  isDomestic: boolean;
  isGrounded: boolean;
  isInternational: boolean;
  isInAir: boolean;
  hasCompleteRoute: boolean;
}

/**
 * Analyze flight data to find the most busy routes
 */
export const analyzeBusyRoutes = (flights: AircraftFeature[]): RouteInfo[] => {
  const routeMap = new Map<string, RouteInfo>();

  flights.forEach(flight => {
    const { origin_airport_iata, destination_airport_iata, number } = flight.properties;
    
    // Only analyze flights with complete route information
    if (origin_airport_iata && destination_airport_iata && number) {
      // Create a consistent route key (alphabetically sorted to avoid duplicates)
      const routeKey = [origin_airport_iata, destination_airport_iata].sort().join('-');
      const routeDisplay = `${origin_airport_iata} ↔ ${destination_airport_iata}`;
      
      if (routeMap.has(routeKey)) {
        const existing = routeMap.get(routeKey)!;
        existing.count++;
        existing.flights.push(number);
      } else {
        routeMap.set(routeKey, {
          route: routeDisplay,
          origin: origin_airport_iata,
          destination: destination_airport_iata,
          count: 1,
          flights: [number]
        });
      }
    }
  });

  // Convert to array and sort by frequency
  return Array.from(routeMap.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 10); // Return top 10 busiest routes
};

/**
 * Classify a flight based on various criteria
 */
export const classifyFlight = (flight: AircraftFeature): FlightClassification => {
  const { origin_airport_iata, destination_airport_iata, on_ground } = flight.properties;
  
  // Check if flight has complete route information
  const hasCompleteRoute = !!(
    origin_airport_iata && 
    destination_airport_iata && 
    AIRPORT_COORDS[origin_airport_iata] && 
    AIRPORT_COORDS[destination_airport_iata]
  );

  // Determine if flight is grounded (on_ground property or very low altitude/speed)
  const isGrounded = on_ground === true || 
    (flight.properties.altitude !== undefined && flight.properties.altitude < 1000) ||
    (flight.properties.ground_speed !== undefined && flight.properties.ground_speed < 50);

  const isInAir = !isGrounded;

  // Determine if flight is domestic or international
  let isDomestic = false;
  let isInternational = false;

  if (hasCompleteRoute) {
    // Simple country classification based on airport codes
    // This is a basic implementation - you could enhance with a proper country database
    const originCountry = getCountryFromAirport(origin_airport_iata);
    const destinationCountry = getCountryFromAirport(destination_airport_iata);
    
    isDomestic = originCountry === destinationCountry;
    isInternational = originCountry !== destinationCountry;
  }

  return {
    isDomestic,
    isInternational,
    isGrounded,
    isInAir,
    hasCompleteRoute
  };
};

/**
 * Simple country classification based on airport codes
 * This is a basic implementation focusing on major countries
 */
const getCountryFromAirport = (airportCode: string): string => {
  // US airports (most common in dataset)
  if (/^[A-Z]{3}$/.test(airportCode)) {
    // Most 3-letter codes in North America are US/Canada
    const canadianCodes = ['YYZ', 'YUL', 'YVR', 'YYC', 'YOW', 'YHZ'];
    if (canadianCodes.includes(airportCode)) {
      return 'CA';
    }
    return 'US';
  }
  
  // European airports (ICAO codes starting with E)
  if (airportCode.startsWith('LHR') || airportCode.startsWith('LGW') || airportCode.startsWith('STN')) return 'GB';
  if (airportCode.startsWith('CDG') || airportCode.startsWith('ORY')) return 'FR';
  if (airportCode.startsWith('FRA') || airportCode.startsWith('MUC')) return 'DE';
  if (airportCode.startsWith('AMS')) return 'NL';
  if (airportCode.startsWith('MAD')) return 'ES';
  if (airportCode.startsWith('FCO') || airportCode.startsWith('MXP')) return 'IT';
  
  // Other major airports
  if (airportCode.startsWith('NRT') || airportCode.startsWith('HND')) return 'JP';
  if (airportCode.startsWith('ICN')) return 'KR';
  if (airportCode.startsWith('PEK') || airportCode.startsWith('PVG')) return 'CN';
  if (airportCode.startsWith('SIN')) return 'SG';
  if (airportCode.startsWith('DXB')) return 'AE';
  if (airportCode.startsWith('SYD') || airportCode.startsWith('MEL')) return 'AU';
  
  // Default to US for unknown codes (since most data appears to be US-focused)
  return 'US';
};

/**
 * Filter flights based on classification criteria
 */
export const filterFlights = (
  flights: AircraftFeature[],
  filters: {
    showGrounded?: boolean;
    showInAir?: boolean;
    showDomestic?: boolean;
    showInternational?: boolean;
    showIncomplete?: boolean;
  }
): AircraftFeature[] => {
  return flights.filter(flight => {
    const classification = classifyFlight(flight);
    
    // Flight status filtering
    if (filters.showGrounded === false && classification.isGrounded) return false;
    if (filters.showInAir === false && classification.isInAir) return false;
    
    // Route completeness filtering
    if (filters.showIncomplete === false && !classification.hasCompleteRoute) return false;
    
    // Route type filtering (only apply if flight has complete route info)
    if (classification.hasCompleteRoute) {
      if (filters.showDomestic === false && classification.isDomestic) return false;
      if (filters.showInternational === false && classification.isInternational) return false;
    }
    
    return true;
  });
};

/**
 * Get statistics about the current flight dataset
 */
export const getFlightStatistics = (flights: AircraftFeature[]) => {
  let groundedCount = 0;
  let inAirCount = 0;
  let domesticCount = 0;
  let internationalCount = 0;
  let completeRouteCount = 0;

  flights.forEach(flight => {
    const classification = classifyFlight(flight);
    
    if (classification.isGrounded) groundedCount++;
    if (classification.isInAir) inAirCount++;
    if (classification.hasCompleteRoute) {
      completeRouteCount++;
      if (classification.isDomestic) domesticCount++;
      if (classification.isInternational) internationalCount++;
    }
  });

  return {
    total: flights.length,
    grounded: groundedCount,
    inAir: inAirCount,
    domestic: domesticCount,
    international: internationalCount,
    completeRoutes: completeRouteCount
  };
}; 