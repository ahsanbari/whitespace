// Map configuration constants
export const MAP_CONFIG = {
  CENTER: [40.0, -75.0] as [number, number],
  ZOOM: 6,
  ATTRIBUTION: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  TILE_URL: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
};

// Marker limits for performance
export const MARKER_LIMITS = [100, 500, 1000, 2000, 5000];

// Z-index values for overlays
export const Z_INDEX = {
  MAP_CONTROLS: 1000,
  FLIGHT_LEGEND: 999,
  HEATMAP_LEGEND: 1000
};

// Heatmap configuration
export const HEATMAP_CONFIG = {
  RADIUS: 25,
  BLUR: 15,
  MAX_ZOOM: 5,
  GRADIENT: {
    0.0: 'blue',
    0.2: 'cyan', 
    0.4: 'lime',
    0.6: 'yellow',
    1.0: 'red'
  }
};

// Animation durations
export const ANIMATION = {
  WEATHER_FETCH_DELAY: 500,
  PULSE_DURATION: '2s'
}; 