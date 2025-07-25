import { FlightGeoJSON } from '../infrastructure/types';

export class FlightDataService {
  private static instance: FlightDataService;
  private cache: FlightGeoJSON | null = null;
  private loading = false;

  private constructor() {}

  static getInstance(): FlightDataService {
    if (!FlightDataService.instance) {
      FlightDataService.instance = new FlightDataService();
    }
    return FlightDataService.instance;
  }

  async loadFlightData(): Promise<FlightGeoJSON> {
    // Return cached data if available
    if (this.cache) {
      return this.cache;
    }

    // Prevent multiple simultaneous requests
    if (this.loading) {
      return new Promise((resolve, reject) => {
        const checkCache = () => {
          if (this.cache) {
            resolve(this.cache);
          } else if (!this.loading) {
            reject(new Error('Failed to load flight data'));
          } else {
            setTimeout(checkCache, 100);
          }
        };
        checkCache();
      });
    }

    this.loading = true;

    try {
      const response = await fetch('/data/EasternSeaboardSampled.geojson');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: FlightGeoJSON = await response.json();
      
      // Validate data structure
      if (!data.features || !Array.isArray(data.features)) {
        throw new Error('Invalid flight data format');
      }

      this.cache = data;
      return data;
    } catch (error) {
      console.error('Error loading flight data:', error);
      throw error;
    } finally {
      this.loading = false;
    }
  }

  // Clear cache if needed (for refresh functionality)
  clearCache(): void {
    this.cache = null;
  }

  // Get cached data without making a new request
  getCachedData(): FlightGeoJSON | null {
    return this.cache;
  }

  // Check if data is currently loading
  isLoading(): boolean {
    return this.loading;
  }
}

// Export a singleton instance
export const flightDataService = FlightDataService.getInstance(); 