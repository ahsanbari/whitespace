// Flight route interface
export interface FlightRoute {
  flightNumber: string;
  origin: string;
  destination: string;
  originCoords: [number, number];
  destinationCoords: [number, number];
  aircraftPosition: [number, number];
}

// Flight data interface
export interface Flight {
  number: string;
  callsign: string;
  origin: string;
  destination: string;
  aircraft_code: string;
}

// Aircraft feature from GeoJSON
export interface AircraftFeature {
  type: 'Feature';
  properties: {
    id: string;
    icao_24bit?: string;
    heading?: number;
    altitude?: number;
    ground_speed?: number;
    squawk?: number;
    aircraft_code?: string;
    registration?: string;
    time?: number;
    origin_airport_iata?: string;
    destination_airport_iata?: string;
    number?: string;
    airline_iata?: string;
    on_ground?: boolean;
    vertical_speed?: number;
    callsign?: string;
    airline_icao?: string;
  };
  geometry: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
}

// GeoJSON data structure
export interface FlightGeoJSON {
  type: 'FeatureCollection';
  crs?: {
    type: string;
    properties: {
      name: string;
    };
  };
  features: AircraftFeature[];
} 