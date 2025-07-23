"use client";
import dynamic from 'next/dynamic';
import FloatingControlsCard from './components/FloatingControlsCard';
import { useState } from 'react';

const LeafletMap = dynamic(() => import('./components/LeafletMap'), { 
  ssr: false,
  loading: () => <div className="w-full h-screen bg-gray-100 flex items-center justify-center">Loading map...</div>
});

export default function Home() {
  const [selectedFlightNumber, setSelectedFlightNumber] = useState<string>('');

  // Handle flight search from input
  const handleFlightSearch = (flightNumber: string) => {

    setSelectedFlightNumber(flightNumber);
  };

  return (
    <>
      <div className="fixed bottom-4 left-4 z-9999">
        <FloatingControlsCard onFlightSearch={handleFlightSearch} />
      </div>
      <LeafletMap selectedFlightNumber={selectedFlightNumber} onFlightSelect={setSelectedFlightNumber} />
    </>
  );
}
