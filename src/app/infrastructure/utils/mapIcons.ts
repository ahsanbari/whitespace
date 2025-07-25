import L from 'leaflet';

// Fix for default markers in React-Leaflet
export const fixLeafletDefaultIcons = () => {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  });
};

// Create a plane icon with customizable color and rotation
const createPlaneIcon = (color: string = '#1f2937', rotation: number = 0) => {
  return L.divIcon({
    html: `
      <div style="transform: rotate(${rotation}deg); width: 16px; height: 16px; display: flex; align-items: center; justify-content: center;">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" 
                fill="${color}" 
                stroke="#fff" 
                stroke-width="0.5"/>
        </svg>
      </div>
    `,
    className: 'custom-plane-icon',
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
};

// Create Google Maps style airport pin markers
const createAirportIcon = (type: 'origin' | 'destination') => {
  const color = type === 'origin' ? 'var(--color-origin)' : 'var(--color-destination)';
  const label = type === 'origin' ? 'DEP' : 'ARR';
  
  return L.divIcon({
    html: `
      <div style="position: relative; width: 40px; height: 50px;">
        <!-- Pin shape with shadow -->
        <svg width="40" height="50" viewBox="0 0 40 50" style="drop-shadow: 0 4px 8px rgba(0,0,0,0.3);">
          <!-- Pin shadow -->
          <ellipse cx="20" cy="46" rx="8" ry="3" fill="rgba(0,0,0,0.2)"/>
          <!-- Pin body -->
          <path d="M20 2 C30 2, 38 10, 38 20 C38 25, 35 30, 20 45 C5 30, 2 25, 2 20 C2 10, 10 2, 20 2 Z" 
                fill="${color}" stroke="#fff" stroke-width="2"/>
          <!-- Inner circle -->
          <circle cx="20" cy="20" r="12" fill="#fff"/>
          <!-- Airport icon -->
          <svg x="11" y="11" width="18" height="18" viewBox="0 0 24 24" fill="${color}">
            <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
          </svg>
        </svg>
        <!-- Label at bottom -->
        <div style="
          position: absolute; 
          bottom: -8px; 
          left: 50%; 
          transform: translateX(-50%);
          background: ${color}; 
          color: white; 
          padding: 2px 6px; 
          border-radius: 4px; 
          font-size: 10px; 
          font-weight: bold;
          white-space: nowrap;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        ">${label}</div>
      </div>
    `,
    className: `custom-airport-pin airport-${type}`,
    iconSize: [40, 50],
    iconAnchor: [20, 45], // Point to the bottom tip of the pin
  });
};

// Create current position icon - larger and more visible
const createCurrentPositionIcon = () => {
  return L.divIcon({
    html: `
      <div style="position: relative;">
        <!-- Pulsing ring animation -->
        <div class="pulse-ring" style="
          position: absolute;
          top: -15px;
          left: -15px;
          width: 60px;
          height: 60px;
          background: color-mix(in srgb, var(--color-current) 30%, transparent);
          border-radius: 50%;
        "></div>
        <!-- Main icon -->
        <svg width="var(--map-marker-size-xl)" height="var(--map-marker-size-xl)" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="8" fill="var(--color-current)" stroke="var(--color-text-inverse)" stroke-width="2"/>
          <circle cx="12" cy="12" r="3" fill="var(--color-text-inverse)"/>
        </svg>
      </div>
    `,
    className: 'custom-position-icon',
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });
};

export { createPlaneIcon, createAirportIcon, createCurrentPositionIcon }; 