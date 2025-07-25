import L from 'leaflet';

/**
 * Flight path utilities for generating realistic routes using Earth's curvature
 */

// Convert degrees to radians
const toRadians = (degrees: number): number => degrees * (Math.PI / 180);

// Convert radians to degrees  
const toDegrees = (radians: number): number => radians * (180 / Math.PI);

/**
 * Generate intermediate points along a great circle route
 * Uses spherical interpolation for accurate geodesic paths
 */
export const generateGreatCirclePath = (
  startLat: number, 
  startLon: number, 
  endLat: number, 
  endLon: number, 
  numPoints: number = 20
): [number, number][] => {
  const points: [number, number][] = [];
  
  // Convert to radians
  const lat1 = toRadians(startLat);
  const lon1 = toRadians(startLon);
  const lat2 = toRadians(endLat);
  const lon2 = toRadians(endLon);
  
  // Calculate the angular distance between points
  const d = Math.acos(
    Math.sin(lat1) * Math.sin(lat2) + 
    Math.cos(lat1) * Math.cos(lat2) * Math.cos(lon2 - lon1)
  );
  
  // Handle edge case where points are the same
  if (d === 0) {
    return [[startLat, startLon], [endLat, endLon]];
  }
  
  // Generate intermediate points using spherical interpolation
  for (let i = 0; i <= numPoints; i++) {
    const f = i / numPoints;
    const a = Math.sin((1 - f) * d) / Math.sin(d);
    const b = Math.sin(f * d) / Math.sin(d);
    
    const x = a * Math.cos(lat1) * Math.cos(lon1) + b * Math.cos(lat2) * Math.cos(lon2);
    const y = a * Math.cos(lat1) * Math.sin(lon1) + b * Math.cos(lat2) * Math.sin(lon2);
    const z = a * Math.sin(lat1) + b * Math.sin(lat2);
    
    const lat = Math.atan2(z, Math.sqrt(x * x + y * y));
    const lon = Math.atan2(y, x);
    
    points.push([toDegrees(lat), toDegrees(lon)]);
  }
  
  return points;
};

/**
 * Generate flight path coordinates using Leaflet's distance calculation
 * Automatically chooses between straight line and great circle based on distance
 */
export const getFlightPath = (
  originCoords: [number, number], 
  destinationCoords: [number, number]
): [number, number][] => {
  // Use Leaflet's built-in distance calculation (more accurate than Haversine)
  const origin = L.latLng(originCoords[0], originCoords[1]);
  const destination = L.latLng(destinationCoords[0], destinationCoords[1]);
  const distanceMeters = origin.distanceTo(destination);
  const distanceKm = distanceMeters / 1000;
  
  // Use great circle for flights longer than 500km
  if (distanceKm > 500) {
    // Calculate optimal number of points based on distance
    // More points for longer flights, capped for performance
    const numPoints = Math.min(Math.max(Math.floor(distanceKm / 100), 10), 50);
    
    return generateGreatCirclePath(
      originCoords[0], 
      originCoords[1], 
      destinationCoords[0], 
      destinationCoords[1], 
      numPoints
    );
  } else {
    // Short flights use straight line for efficiency
    return [originCoords, destinationCoords];
  }
};

/**
 * Calculate flight distance using Leaflet's accurate distance method
 */
export const calculateFlightDistance = (
  originCoords: [number, number], 
  destinationCoords: [number, number]
): number => {
  const origin = L.latLng(originCoords[0], originCoords[1]);
  const destination = L.latLng(destinationCoords[0], destinationCoords[1]);
  return Math.round(origin.distanceTo(destination) / 1000); // Return km as integer
}; 