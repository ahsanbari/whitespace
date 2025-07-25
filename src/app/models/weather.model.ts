export interface WeatherCondition {
  temperature: number;
  description: string;
  windSpeed: number;
  windDirection: number;
  visibility: number;
  pressure: number;
  humidity: number;
}

export class WeatherModel {
  constructor(private data: WeatherCondition) {}

  get temperature(): number {
    return this.data.temperature;
  }

  get description(): string {
    return this.data.description;
  }

  get windSpeed(): number {
    return this.data.windSpeed;
  }

  get windDirection(): number {
    return this.data.windDirection;
  }

  get visibility(): number {
    return this.data.visibility;
  }

  get pressure(): number {
    return this.data.pressure;
  }

  get humidity(): number {
    return this.data.humidity;
  }

  get rawData(): WeatherCondition {
    return { ...this.data };
  }

  // Business logic methods
  isGoodFlightConditions(): boolean {
    return this.visibility > 5 && this.windSpeed < 25; // Basic criteria
  }

  getFlightRisk(): 'low' | 'medium' | 'high' {
    if (this.windSpeed > 35 || this.visibility < 2) return 'high';
    if (this.windSpeed > 25 || this.visibility < 5) return 'medium';
    return 'low';
  }

  getTemperatureInFahrenheit(): number {
    return (this.temperature * 9/5) + 32;
  }

  getWindDescription(): string {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 
                       'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round(this.windDirection / 22.5) % 16;
    return `${directions[index]} ${this.windSpeed} kt`;
  }

  getVisibilityStatus(): string {
    if (this.visibility >= 10) return 'Excellent';
    if (this.visibility >= 5) return 'Good';
    if (this.visibility >= 2) return 'Poor';
    return 'Very Poor';
  }

  // Static factory methods
  static fromApiData(apiData: any): WeatherModel {
    return new WeatherModel({
      temperature: apiData.temperature || 0,
      description: apiData.description || 'Unknown',
      windSpeed: apiData.windSpeed || 0,
      windDirection: apiData.windDirection || 0,
      visibility: apiData.visibility || 0,
      pressure: apiData.pressure || 0,
      humidity: apiData.humidity || 0
    });
  }
} 