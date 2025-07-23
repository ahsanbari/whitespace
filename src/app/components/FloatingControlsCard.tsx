"use client";
import { useState, useEffect } from 'react';

interface Flight {
  number: string;
  callsign: string;
  origin: string;
  destination: string;
  aircraft_code: string;
}

export default function FloatingControlsCard({ onFlightSearch }: { 
  onFlightSearch?: (flightNumber: string) => void;
}) {
  const [visible, setVisible] = useState(true);
  const [flightNumber, setFlightNumber] = useState("");
  const [flights, setFlights] = useState<Flight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const HamburgerIcon = () => (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="3" y1="6" x2="21" y2="6"></line>
      <line x1="3" y1="12" x2="21" y2="12"></line>
      <line x1="3" y1="18" x2="21" y2="18"></line>
    </svg>
  );

  useEffect(() => {
    // Load flight data
    setLoading(true);
    fetch('/data/EasternSeaboardSampled.geojson')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {

        
        const flightList = data.features
          .filter((feature: any) => 
            feature.properties.number && 
            feature.properties.origin_airport_iata && 
            feature.properties.destination_airport_iata
          ) // Only flights with complete route information
          .map((feature: any) => ({
            number: feature.properties.number,
            callsign: feature.properties.callsign || 'Unknown',
            origin: feature.properties.origin_airport_iata,
            destination: feature.properties.destination_airport_iata,
            aircraft_code: feature.properties.aircraft_code || 'N/A'
          }));
          
        
        setFlights(flightList);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error loading flight data:', error);
        setError(error.message);
        setLoading(false);
      });
  }, []);

  const handleFlightSearch = () => {
    if (flightNumber.trim() && onFlightSearch) {
      onFlightSearch(flightNumber.trim());
    }
  };

  if (!visible) {
    return (
      <button
        className="fixed bottom-4 right-4 z-50 bg-white shadow-lg rounded-full p-3 border border-gray-300 hover:bg-gray-50 transition-colors text-gray-800"
        aria-label="Show flight tracker controls"
        onClick={() => setVisible(true)}
      >
        <HamburgerIcon />
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-999 w-80 max-w-[90vw] bg-white shadow-xl rounded-xl p-4 border border-gray-300 flex flex-col gap-4">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-lg font-semibold text-gray-900">Flight Tracker</h2>
        <button
          className="text-gray-600 hover:text-gray-900 text-xl font-bold transition-colors"
          aria-label="Dismiss controls"
          onClick={() => setVisible(false)}
        >
          ×
        </button>
      </div>
      
      <div className="flex flex-col gap-3">
        {/* Flight Number Search */}
        <div>
          <label htmlFor="flight-input" className="text-sm font-medium text-gray-700 block mb-2">
            Enter Flight Code
          </label>
          <div className="flex gap-2">
            <input
              id="flight-input"
              type="text"
              className="flex-1 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
              placeholder="e.g. BA205, DL675, AA1234"
              value={flightNumber}
              onChange={e => setFlightNumber(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && handleFlightSearch()}
            />
            <button
              className="bg-blue-600 text-white rounded px-4 py-2 hover:bg-blue-700 active:bg-blue-800 transition-colors font-medium"
              onClick={handleFlightSearch}
            >
              Show Route
            </button>
          </div>
        </div>

        {/* Flight Information */}
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-2">
            How to Use
          </label>
          <div className="text-xs text-gray-600 space-y-1">
            <p>• Enter flight code above OR click any plane on map</p>
            <p>• See departure and arrival airports</p>
            <p>• Toggle heatmap to view aircraft density</p>
          </div>
        </div>

        {/* Example Flights */}
        {flights.length > 0 && (
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">
              Example Flights
            </label>
            <div className="text-xs text-gray-600 space-y-1 max-h-32 overflow-y-auto">
              {flights.slice(0, 5).map((flight, idx) => (
                <div 
                  key={idx}
                  className="cursor-pointer hover:bg-gray-100 p-1 rounded"
                  onClick={() => setFlightNumber(flight.number)}
                >
                  <span className="font-medium">{flight.number}</span> - {flight.origin} → {flight.destination}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Status */}
        <div className="text-sm text-gray-600 text-center">
          {loading && "Loading flight data..."}
          {error && <span className="text-red-600">Error: {error}</span>}
          {!loading && !error && `${flights.length} flights with routes available`}
        </div>
      </div>
    </div>
  );
} 