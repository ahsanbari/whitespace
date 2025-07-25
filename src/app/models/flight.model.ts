import { AircraftFeature } from '../infrastructure/types';
import { AIRPORT_COORDS, AIRPORT_NAMES } from '../infrastructure/config';

export class FlightModel {
  constructor(private feature: AircraftFeature) {}

  get flightNumber(): string | null {
    return this.feature.properties.number || null;
  }

  get origin(): string | null {
    return this.feature.properties.origin_airport_iata || null;
  }

  get destination(): string | null {
    return this.feature.properties.destination_airport_iata || null;
  }

  get coordinates(): [number, number] {
    return [this.feature.geometry.coordinates[1], this.feature.geometry.coordinates[0]];
  }

  get altitude(): number | null {
    return this.feature.properties.altitude || null;
  }

  get groundSpeed(): number | null {
    return this.feature.properties.ground_speed || null;
  }

  get heading(): number {
    return this.feature.properties.heading || 0;
  }

  get rawFeature(): AircraftFeature {
    return this.feature;
  }

  // Business logic methods
  hasCompleteRouteInfo(): boolean {
    return !!(this.origin && this.destination && this.flightNumber);
  }

  isGrounded(): boolean {
    return (this.altitude || 0) < 100;
  }

  isInternational(): boolean {
    if (!this.origin || !this.destination) return false;
    // Simple heuristic: if origin and destination are different countries
    // This would need more sophisticated logic in a real app
    return this.origin.length === 3 && this.destination.length === 3;
  }

  getOriginCoordinates(): [number, number] | null {
    if (!this.origin) return null;
    const coords = AIRPORT_COORDS[this.origin];
    return coords ? [coords[0], coords[1]] : null;
  }

  getDestinationCoordinates(): [number, number] | null {
    if (!this.destination) return null;
    const coords = AIRPORT_COORDS[this.destination];
    return coords ? [coords[0], coords[1]] : null;
  }

  getOriginName(): string {
    if (!this.origin) return 'Unknown';
    return AIRPORT_NAMES[this.origin] || this.origin;
  }

  getDestinationName(): string {
    if (!this.destination) return 'Unknown';
    return AIRPORT_NAMES[this.destination] || this.destination;
  }

  getRouteDisplayName(): string {
    if (!this.hasCompleteRouteInfo()) return 'Incomplete Route';
    return `${this.origin} → ${this.destination}`;
  }

  // Static factory methods
  static fromFeature(feature: AircraftFeature): FlightModel {
    return new FlightModel(feature);
  }

  static fromFeatures(features: AircraftFeature[]): FlightModel[] {
    return features.map(feature => new FlightModel(feature));
  }
} 