import { AircraftFeature } from '../types/flight';

export interface BoundingBox {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface SpatialNode {
  feature: AircraftFeature;
  lat: number;
  lng: number;
}

/**
 * Simple spatial index for aircraft features using a grid-based approach
 * Optimized for fast viewport-based queries
 */
export class SpatialIndex {
  private gridSize: number;
  private grid: Map<string, SpatialNode[]>;
  private bounds: BoundingBox;

  constructor(gridSize: number = 1.0) {
    this.gridSize = gridSize; // Grid cell size in degrees
    this.grid = new Map();
    this.bounds = { north: -90, south: 90, east: -180, west: 180 };
  }

  /**
   * Add flights to the spatial index
   */
  addFlights(features: AircraftFeature[]): void {
    this.clear();
    
    for (const feature of features) {
      const [lng, lat] = feature.geometry.coordinates;
      
      // Update overall bounds
      this.bounds.north = Math.max(this.bounds.north, lat);
      this.bounds.south = Math.min(this.bounds.south, lat);
      this.bounds.east = Math.max(this.bounds.east, lng);
      this.bounds.west = Math.min(this.bounds.west, lng);
      
      // Add to grid cell
      const cellKey = this.getCellKey(lat, lng);
      if (!this.grid.has(cellKey)) {
        this.grid.set(cellKey, []);
      }
      
      this.grid.get(cellKey)!.push({
        feature,
        lat,
        lng
      });
    }
  }

  /**
   * Query flights within the given bounding box
   */
  queryBounds(bounds: BoundingBox): AircraftFeature[] {
    const results: AircraftFeature[] = [];
    const visited = new Set<string>();

    // Expand bounds slightly to account for grid cell boundaries
    const expandedBounds = {
      north: bounds.north + this.gridSize,
      south: bounds.south - this.gridSize,
      east: bounds.east + this.gridSize,
      west: bounds.west - this.gridSize
    };

    // Find all grid cells that intersect with the query bounds
    const minLatCell = Math.floor(expandedBounds.south / this.gridSize);
    const maxLatCell = Math.ceil(expandedBounds.north / this.gridSize);
    const minLngCell = Math.floor(expandedBounds.west / this.gridSize);
    const maxLngCell = Math.ceil(expandedBounds.east / this.gridSize);

    for (let latCell = minLatCell; latCell <= maxLatCell; latCell++) {
      for (let lngCell = minLngCell; lngCell <= maxLngCell; lngCell++) {
        const cellKey = `${latCell},${lngCell}`;
        const nodes = this.grid.get(cellKey);
        
        if (nodes) {
          for (const node of nodes) {
            // Additional bounds check for accuracy
            if (this.isPointInBounds(node.lat, node.lng, bounds)) {
              const featureKey = node.feature.properties.number || `${node.lat}-${node.lng}`;
              if (!visited.has(featureKey)) {
                visited.add(featureKey);
                results.push(node.feature);
              }
            }
          }
        }
      }
    }

    return results;
  }

  /**
   * Get nearby flights within a radius (in degrees)
   */
  queryRadius(centerLat: number, centerLng: number, radiusDegrees: number): AircraftFeature[] {
    const bounds: BoundingBox = {
      north: centerLat + radiusDegrees,
      south: centerLat - radiusDegrees,
      east: centerLng + radiusDegrees,
      west: centerLng - radiusDegrees
    };

    return this.queryBounds(bounds).filter(feature => {
      const [lng, lat] = feature.geometry.coordinates;
      const distance = this.calculateDistance(centerLat, centerLng, lat, lng);
      return distance <= radiusDegrees;
    });
  }

  /**
   * Clear the spatial index
   */
  clear(): void {
    this.grid.clear();
    this.bounds = { north: -90, south: 90, east: -180, west: 180 };
  }

  /**
   * Get statistics about the spatial index
   */
  getStats(): { totalFlights: number; gridCells: number; averageFlightsPerCell: number } {
    let totalFlights = 0;
    for (const nodes of this.grid.values()) {
      totalFlights += nodes.length;
    }

    const gridCells = this.grid.size;
    const averageFlightsPerCell = gridCells > 0 ? totalFlights / gridCells : 0;

    return {
      totalFlights,
      gridCells,
      averageFlightsPerCell
    };
  }

  private getCellKey(lat: number, lng: number): string {
    const latCell = Math.floor(lat / this.gridSize);
    const lngCell = Math.floor(lng / this.gridSize);
    return `${latCell},${lngCell}`;
  }

  private isPointInBounds(lat: number, lng: number, bounds: BoundingBox): boolean {
    return lat >= bounds.south && 
           lat <= bounds.north && 
           lng >= bounds.west && 
           lng <= bounds.east;
  }

  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    // Simple Euclidean distance for small areas (good enough for viewport queries)
    const dLat = lat2 - lat1;
    const dLng = lng2 - lng1;
    return Math.sqrt(dLat * dLat + dLng * dLng);
  }
}

/**
 * Create and populate a spatial index from flight features
 */
export const createSpatialIndex = (features: AircraftFeature[], gridSize?: number): SpatialIndex => {
  const index = new SpatialIndex(gridSize);
  index.addFlights(features);
  return index;
};

/**
 * Convert Leaflet bounds to BoundingBox
 */
export const leafletBoundsToBoundingBox = (bounds: any): BoundingBox => {
  return {
    north: bounds.getNorth(),
    south: bounds.getSouth(),
    east: bounds.getEast(),
    west: bounds.getWest()
  };
}; 