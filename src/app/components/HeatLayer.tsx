"use client";
import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat';

interface HeatLayerProps {
  points: [number, number, number][];
}

export default function HeatLayer({ points }: HeatLayerProps) {
  const map = useMap();
  const heatLayerRef = useRef<any>(null);

  useEffect(() => {
    if (!map || points.length === 0) return;


    if (heatLayerRef.current) {
      map.removeLayer(heatLayerRef.current);
      heatLayerRef.current = null;
    }

    // Create new heat layer with standard heat map colors
    const newHeatLayer = (L as any).heatLayer(points, {
      radius: 20,
      blur: 10,
      maxZoom: 12,
      max: 10, 
      gradient: {
        0.2: 'blue',
        0.4: 'cyan',
        0.6: 'lime',
        0.8: 'yellow',
        1.0: 'red'
      }
    });

    map.addLayer(newHeatLayer);
    heatLayerRef.current = newHeatLayer;

    // Cleanup function
    return () => {
      if (heatLayerRef.current && map) {
        map.removeLayer(heatLayerRef.current);
        heatLayerRef.current = null;
      }
    };
  }, [map, points]);

  return null;
} 