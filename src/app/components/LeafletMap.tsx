"use client";
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useState } from 'react';

export default function LeafletMap() {
  const [geoData, setGeoData] = useState(null);

  useEffect(() => {
    fetch('/data/EasternSeaboardSampled-test.geojson')
      .then((res) => res.json())
      .then((data) => setGeoData(data));
  }, []);

  return (
    <div className="w-full h-screen">
      <MapContainer center={[39.18, -76.72]} zoom={6} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution="&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {geoData && <GeoJSON data={geoData} />}
      </MapContainer>
    </div>
  );
} 