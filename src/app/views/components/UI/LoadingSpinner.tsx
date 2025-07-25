import React from 'react';

const LoadingSpinner = React.memo(() => (
  <div 
    className="absolute inset-0 flex items-center justify-center" 
    style={{ 
      backgroundColor: 'rgba(0, 0, 0, 0.3)', 
      zIndex: 10000 
    }}
  >
    <div className="bg-white rounded-lg p-6 shadow-lg flex items-center gap-3">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <span className="text-gray-700 font-medium">Updating flights...</span>
    </div>
  </div>
));

LoadingSpinner.displayName = 'LoadingSpinner';

export default LoadingSpinner; 