import { AIRPORT_COORDS, AIRPORT_NAMES } from '../infrastructure/config';

export class AirportModel {
  constructor(
    private code: string,
    private coordinates?: [number, number],
    private name?: string
  ) {}

  get airportCode(): string {
    return this.code;
  }

  get displayName(): string {
    return this.name || AIRPORT_NAMES[this.code] || this.code;
  }

  get coords(): [number, number] | null {
    return this.coordinates || AIRPORT_COORDS[this.code] || null;
  }

  get latitude(): number | null {
    const coords = this.coords;
    return coords ? coords[1] : null;
  }

  get longitude(): number | null {
    const coords = this.coords;
    return coords ? coords[0] : null;
  }

  // Business logic methods
  isValidAirport(): boolean {
    return !!(this.coords && this.displayName);
  }

  distanceToAirport(other: AirportModel): number | null {
    const thisCoords = this.coords;
    const otherCoords = other.coords;
    
    if (!thisCoords || !otherCoords) return null;

    // Haversine formula for distance calculation
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(otherCoords[1] - thisCoords[1]);
    const dLon = this.toRadians(otherCoords[0] - thisCoords[0]);
    
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(this.toRadians(thisCoords[1])) * Math.cos(this.toRadians(otherCoords[1])) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  // Static factory methods
  static fromCode(code: string): AirportModel {
    return new AirportModel(code);
  }

  static fromCodeWithDetails(code: string, coords: [number, number], name: string): AirportModel {
    return new AirportModel(code, coords, name);
  }
} 