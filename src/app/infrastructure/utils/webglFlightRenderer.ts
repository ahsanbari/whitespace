import L from 'leaflet';
import { AircraftFeature } from '../types/flight';

interface WebGLFlightPoint {
  lat: number;
  lng: number;
  heading: number;
  color: [number, number, number, number]; // RGBA
  feature: AircraftFeature;
}

interface SpatialGrid {
  [key: string]: WebGLFlightPoint[];
}

/**
 * Production-ready WebGL flight renderer for massive datasets
 * Features: Spatial partitioning, LOD rendering, proper coordinate mapping
 */
export class WebGLFlightRenderer {
  private gl: WebGLRenderingContext;
  private canvas: HTMLCanvasElement;
  private map: L.Map | null = null;
  private program: WebGLProgram | null = null;
  
  // Buffers
  private positionBuffer: WebGLBuffer | null = null;
  private colorBuffer: WebGLBuffer | null = null;
  private sizeBuffer: WebGLBuffer | null = null;
  
  // Spatial partitioning
  private spatialGrid: SpatialGrid = {};
  private gridSize: number = 0.1; // degrees
  private currentLOD: number = 1;
  
  // Data
  private allFlights: WebGLFlightPoint[] = [];
  private visibleFlights: WebGLFlightPoint[] = [];
  private maxFlightsToRender: number = 10000;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const gl = canvas.getContext('webgl', { 
      antialias: true,
      alpha: true,
      premultipliedAlpha: false
    });
    
    if (!gl) {
      throw new Error('WebGL not supported');
    }
    
    this.gl = gl;
    this.initializeWebGL();
  }

  private initializeWebGL(): void {
    const gl = this.gl;
    
    // Enable necessary features
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.clearColor(0, 0, 0, 0); // Transparent background
    
    this.createShaderProgram();
    this.createBuffers();
  }

  private createShaderProgram(): void {
    const gl = this.gl;
    
    const vertexShaderSource = `
      attribute vec2 a_position;
      attribute vec4 a_color;
      attribute float a_size;
      
      uniform vec2 u_resolution;
      uniform vec2 u_offset;
      uniform float u_scale;
      
      varying vec4 v_color;
      varying float v_size;
      
      void main() {
        // Positions are already in container coordinates
        // Convert directly to clip space
        vec2 clipSpace = ((a_position / u_resolution) * 2.0) - 1.0;
        
        gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
        gl_PointSize = a_size;
        
        v_color = a_color;
        v_size = a_size;
      }
    `;

    const fragmentShaderSource = `
      precision mediump float;
      
      varying vec4 v_color;
      varying float v_size;
      
      void main() {
        vec2 coord = gl_PointCoord - 0.5;
        float distance = length(coord);
        
        // Simple circle with smooth edges
        float alpha = 1.0 - smoothstep(0.3, 0.5, distance);
        
        if (alpha < 0.1) discard;
        
        gl_FragColor = vec4(v_color.rgb, v_color.a * alpha);
      }
    `;

    const vertexShader = this.compileShader(gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = this.compileShader(gl.FRAGMENT_SHADER, fragmentShaderSource);
    
    this.program = gl.createProgram()!;
    gl.attachShader(this.program, vertexShader);
    gl.attachShader(this.program, fragmentShader);
    gl.linkProgram(this.program);

    if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
      throw new Error('Shader program failed to link: ' + gl.getProgramInfoLog(this.program));
    }
  }

  private compileShader(type: number, source: string): WebGLShader {
    const gl = this.gl;
    const shader = gl.createShader(type)!;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      throw new Error('Shader compilation error: ' + gl.getShaderInfoLog(shader));
    }

    return shader;
  }

  private createBuffers(): void {
    const gl = this.gl;
    this.positionBuffer = gl.createBuffer();
    this.colorBuffer = gl.createBuffer();
    this.sizeBuffer = gl.createBuffer();
  }

  setMap(map: L.Map): void {
    this.map = map;
  }

  setFlights(flights: AircraftFeature[]): void {
    this.allFlights = flights.map(feature => {
      const [lng, lat] = feature.geometry.coordinates;
      const heading = (feature.properties.heading || 0) * Math.PI / 180;
      
      // Determine color based on flight status
      let color: [number, number, number, number];
      if (!feature.properties.origin_airport_iata || !feature.properties.destination_airport_iata) {
        color = [1.0, 0.2, 0.2, 0.8]; // Red for incomplete
      } else if (feature.properties.on_ground) {
        color = [0.6, 0.6, 0.6, 0.7]; // Gray for grounded
      } else {
        color = [0.2, 0.4, 0.8, 0.8]; // Blue for in-air
      }

      return {
        lat,
        lng,
        heading,
        color,
        feature
      };
    });

    this.buildSpatialGrid();
    console.log(`[WebGLFlightRenderer] Loaded ${this.allFlights.length} flights into spatial grid`);
  }

  private buildSpatialGrid(): void {
    this.spatialGrid = {};
    
    for (const flight of this.allFlights) {
      const gridX = Math.floor(flight.lng / this.gridSize);
      const gridY = Math.floor(flight.lat / this.gridSize);
      const key = `${gridX},${gridY}`;
      
      if (!this.spatialGrid[key]) {
        this.spatialGrid[key] = [];
      }
      
      this.spatialGrid[key].push(flight);
    }
  }

  private calculateLOD(): number {
    if (!this.map) return 1;
    
    const zoom = this.map.getZoom();
    
    // Adjust LOD based on zoom level
    if (zoom >= 10) return 1;      // Show all details
    if (zoom >= 8) return 2;       // Skip every other flight
    if (zoom >= 6) return 4;       // Show 1/4 of flights
    return 8;                      // Show 1/8 of flights
  }

  render(): void {
    if (!this.map || !this.program) return;

    const gl = this.gl;
    
    // Update canvas size to match container
    const rect = this.canvas.getBoundingClientRect();
    if (this.canvas.width !== rect.width || this.canvas.height !== rect.height) {
      this.canvas.width = rect.width;
      this.canvas.height = rect.height;
      gl.viewport(0, 0, rect.width, rect.height);
    }

    // Get flights to render based on viewport and LOD
    this.visibleFlights = this.calculateVisibleFlights();
    
    if (this.visibleFlights.length === 0) return;

    // Clear canvas
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Use shader program
    gl.useProgram(this.program);

    // Prepare data arrays
    const positions = new Float32Array(this.visibleFlights.length * 2);
    const colors = new Float32Array(this.visibleFlights.length * 4);
    const sizes = new Float32Array(this.visibleFlights.length);

    // Get current map bounds and container size
    const size = this.map.getSize();
    
    for (let i = 0; i < this.visibleFlights.length; i++) {
      const flight = this.visibleFlights[i];
      
      // Convert lat/lng to container coordinates using Leaflet's projection
      const point = this.map.latLngToContainerPoint([flight.lat, flight.lng]);
      
      positions[i * 2] = point.x;
      positions[i * 2 + 1] = point.y;
      
      colors[i * 4] = flight.color[0];
      colors[i * 4 + 1] = flight.color[1];
      colors[i * 4 + 2] = flight.color[2];
      colors[i * 4 + 3] = flight.color[3];
      
      // Scale size based on zoom
      const baseSize = 8;
      const zoomScale = Math.max(0.5, Math.min(2, this.map.getZoom() / 8));
      sizes[i] = baseSize * zoomScale;
    }

    // Upload data to GPU
    this.uploadBufferData(positions, colors, sizes);

    // Set uniforms for coordinate transformation
    const resolutionLocation = gl.getUniformLocation(this.program, 'u_resolution');
    const offsetLocation = gl.getUniformLocation(this.program, 'u_offset');
    const scaleLocation = gl.getUniformLocation(this.program, 'u_scale');

    // Simple coordinate mapping - positions are already in container coordinates
    gl.uniform2f(resolutionLocation, this.canvas.width, this.canvas.height);
    gl.uniform2f(offsetLocation, 0, 0); // No offset needed
    gl.uniform1f(scaleLocation, 1); // No scaling needed

    // Draw
    gl.drawArrays(gl.POINTS, 0, this.visibleFlights.length);
    
    // Optional: Only log occasionally to avoid spam
    if (Math.random() < 0.01) { // 1% chance to log
      console.log(`[WebGLFlightRenderer] Rendered ${this.visibleFlights.length} flights at LOD ${this.currentLOD}`);
    }
  }

  // Public method to get visible flights for click detection
  getVisibleFlights(): WebGLFlightPoint[] {
    return this.visibleFlights;
  }

  private calculateVisibleFlights(): WebGLFlightPoint[] {
    if (!this.map) return [];

    const bounds = this.map.getBounds();
    const lod = this.calculateLOD();
    this.currentLOD = lod; // Store current LOD for stats
    
    const minGridX = Math.floor(bounds.getWest() / this.gridSize);
    const maxGridX = Math.ceil(bounds.getEast() / this.gridSize);
    const minGridY = Math.floor(bounds.getSouth() / this.gridSize);
    const maxGridY = Math.ceil(bounds.getNorth() / this.gridSize);

    const visible: WebGLFlightPoint[] = [];
    
    for (let x = minGridX; x <= maxGridX; x++) {
      for (let y = minGridY; y <= maxGridY; y++) {
        const key = `${x},${y}`;
        const gridFlights = this.spatialGrid[key];
        
        if (gridFlights) {
          // Apply LOD filtering
          for (let i = 0; i < gridFlights.length; i += lod) {
            const flight = gridFlights[i];
            
            // Check if flight is actually in bounds
            if (flight.lat >= bounds.getSouth() && flight.lat <= bounds.getNorth() &&
                flight.lng >= bounds.getWest() && flight.lng <= bounds.getEast()) {
              visible.push(flight);
              
              // Limit total rendered flights for performance
              if (visible.length >= this.maxFlightsToRender) {
                return visible;
              }
            }
          }
        }
      }
    }
    
    return visible;
  }

  private uploadBufferData(positions: Float32Array, colors: Float32Array, sizes: Float32Array): void {
    const gl = this.gl;
    if (!this.program) return;

    // Position attribute
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.DYNAMIC_DRAW);
    const positionLocation = gl.getAttribLocation(this.program, 'a_position');
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    // Color attribute
    gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, colors, gl.DYNAMIC_DRAW);
    const colorLocation = gl.getAttribLocation(this.program, 'a_color');
    gl.enableVertexAttribArray(colorLocation);
    gl.vertexAttribPointer(colorLocation, 4, gl.FLOAT, false, 0, 0);

    // Size attribute
    gl.bindBuffer(gl.ARRAY_BUFFER, this.sizeBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, sizes, gl.DYNAMIC_DRAW);
    const sizeLocation = gl.getAttribLocation(this.program, 'a_size');
    gl.enableVertexAttribArray(sizeLocation);
    gl.vertexAttribPointer(sizeLocation, 1, gl.FLOAT, false, 0, 0);
  }

  resize(width: number, height: number): void {
    this.canvas.width = width;
    this.canvas.height = height;
    this.gl.viewport(0, 0, width, height);
  }

  dispose(): void {
    const gl = this.gl;
    
    // Clear the canvas completely (make it transparent)
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    
    // Delete WebGL resources
    if (this.program) gl.deleteProgram(this.program);
    if (this.positionBuffer) gl.deleteBuffer(this.positionBuffer);
    if (this.colorBuffer) gl.deleteBuffer(this.colorBuffer);
    if (this.sizeBuffer) gl.deleteBuffer(this.sizeBuffer);
    
    // Clear references
    this.program = null;
    this.positionBuffer = null;
    this.colorBuffer = null;
    this.sizeBuffer = null;
    this.map = null;
    this.allFlights = [];
    this.visibleFlights = [];
    this.spatialGrid = {};
    
    console.log('[WebGLFlightRenderer] Disposed of all resources');
  }

  // Public method to clear the canvas
  clearCanvas(): void {
    const gl = this.gl;
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
  }

  getStats(): { 
    totalFlights: number; 
    visibleFlights: number; 
    currentLOD: number;
  } {
    return {
      totalFlights: this.allFlights.length,
      visibleFlights: this.visibleFlights.length,
      currentLOD: this.currentLOD
    };
  }
}

/**
 * Leaflet layer that integrates WebGL rendering
 */
export class WebGLFlightLayer extends L.Layer {
  private renderer: WebGLFlightRenderer | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private flights: AircraftFeature[] = [];
  private onFlightClick?: (feature: AircraftFeature) => void;

  constructor(flights: AircraftFeature[] = [], onFlightClick?: (feature: AircraftFeature) => void) {
    super();
    this.flights = flights;
    this.onFlightClick = onFlightClick;
  }

  onAdd(map: L.Map): this {
    // Create canvas
    this.canvas = document.createElement('canvas');
    this.canvas.style.position = 'absolute';
    this.canvas.style.top = '0';
    this.canvas.style.left = '0';
    this.canvas.style.pointerEvents = 'auto'; // Enable pointer events for click detection
    this.canvas.style.zIndex = '200';

    // Add to map pane
    map.getPanes().overlayPane?.appendChild(this.canvas);

    try {
      this.renderer = new WebGLFlightRenderer(this.canvas);
      this.renderer.setMap(map);
      this.renderer.setFlights(this.flights);
      
      // Set up event listeners
      map.on('viewreset zoom move zoomend moveend resize', this.update, this);
      
      // Add click handler to canvas
      this.canvas.addEventListener('click', this.handleCanvasClick.bind(this));
      
      // Initial render
      this.update();
      
      console.log('[WebGLFlightLayer] Successfully initialized with', this.flights.length, 'flights');
    } catch (error) {
      console.error('[WebGLFlightLayer] Failed to initialize:', error);
      this.remove();
    }

    return this;
  }

  onRemove(map: L.Map): this {
    console.log('[WebGLFlightLayer] onRemove called');
    
    // Remove event listener first
    if (this.canvas) {
      try {
        this.canvas.removeEventListener('click', this.handleCanvasClick.bind(this));
        console.log('[WebGLFlightLayer] Click listener removed');
      } catch (error) {
        console.error('[WebGLFlightLayer] Error removing click listener:', error);
      }
    }

    // Clear and dispose of WebGL resources first
    if (this.renderer) {
      try {
        this.renderer.clearCanvas(); // Clear before disposal
        this.renderer.dispose();
        this.renderer = null;
        console.log('[WebGLFlightLayer] Renderer disposed');
      } catch (error) {
        console.error('[WebGLFlightLayer] Error disposing renderer:', error);
      }
    }

    // Aggressively remove canvas from DOM
    if (this.canvas) {
      try {
        // Try multiple removal methods
        if (this.canvas.parentNode) {
          this.canvas.parentNode.removeChild(this.canvas);
          console.log('[WebGLFlightLayer] Canvas removed via parentNode');
        }
        
        // Force style changes to hide it
        this.canvas.style.display = 'none';
        this.canvas.style.visibility = 'hidden';
        this.canvas.style.opacity = '0';
        this.canvas.style.pointerEvents = 'none';
        
        // Try remove() method as well
        this.canvas.remove();
        console.log('[WebGLFlightLayer] Canvas.remove() called');
        
      } catch (error) {
        console.error('[WebGLFlightLayer] Error removing canvas:', error);
      }
    }

    // Clear canvas reference
    this.canvas = null;

    // Remove map event listeners
    try {
      map.off('viewreset zoom move zoomend moveend resize', this.update, this);
      console.log('[WebGLFlightLayer] Map event listeners removed');
    } catch (error) {
      console.error('[WebGLFlightLayer] Error removing map listeners:', error);
    }
    
    console.log('[WebGLFlightLayer] Layer cleanup complete');
    return this;
  }

  setFlights(flights: AircraftFeature[]): void {
    this.flights = flights;
    if (this.renderer) {
      this.renderer.setFlights(flights);
      this.update();
    }
  }

  private handleCanvasClick = (event: MouseEvent): void => {
    if (!this._map || !this.renderer || !this.onFlightClick) return;

    const rect = this.canvas!.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Convert canvas coordinates to lat/lng
    const containerPoint = L.point(x, y);
    const latLng = this._map.containerPointToLatLng(containerPoint);

    // Find the nearest flight to the click point
    const clickThreshold = 20; // pixels
    const nearestFlight = this.findNearestFlight(latLng, clickThreshold);

    if (nearestFlight) {
      this.onFlightClick(nearestFlight);
    }
  };

  private findNearestFlight(clickLatLng: L.LatLng, thresholdPixels: number): AircraftFeature | null {
    if (!this._map || !this.renderer) return null;

    const visibleFlights = this.renderer.getVisibleFlights();
    let nearestFlight: AircraftFeature | null = null;
    let nearestDistance = Infinity;

    const clickPoint = this._map.latLngToContainerPoint(clickLatLng);

    for (const flight of visibleFlights) {
      const flightLatLng = L.latLng(flight.lat, flight.lng);
      const flightPoint = this._map.latLngToContainerPoint(flightLatLng);
      
      const distance = clickPoint.distanceTo(flightPoint);
      
      if (distance <= thresholdPixels && distance < nearestDistance) {
        nearestDistance = distance;
        nearestFlight = flight.feature;
      }
    }

    return nearestFlight;
  }

  private update = (): void => {
    if (!this.canvas || !this.renderer || !this._map) return;

    const map = this._map;
    const size = map.getSize();
    const topLeft = map.containerPointToLayerPoint([0, 0]);

    // Update canvas size and position to match the map
    this.canvas.width = size.x;
    this.canvas.height = size.y;
    this.canvas.style.width = size.x + 'px';
    this.canvas.style.height = size.y + 'px';
    
    // Position canvas to align with map layers
    L.DomUtil.setPosition(this.canvas, topLeft);

    // Resize and render
    this.renderer.resize(size.x, size.y);
    this.renderer.render();
  };

  getStats() {
    return this.renderer?.getStats() || { 
      totalFlights: 0, 
      visibleFlights: 0, 
      currentLOD: 1
    };
  }
}

/**
 * Check WebGL support
 */
export const isWebGLSupported = (): boolean => {
  try {
    const canvas = document.createElement('canvas');
    return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
  } catch (e) {
    return false;
  }
}; 