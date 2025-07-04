import React from 'react';
import type { IpInfo } from '../lib/icpClient';

interface StaticMapProps {
  ipInfo: IpInfo | null;
  mapImageUrl: string | null;
  isLoading: boolean;
  error: string | null;
  onGenerateMap: () => void;
}

export const StaticMap: React.FC<StaticMapProps> = ({
  ipInfo,
  mapImageUrl,
  isLoading,
  error,
  onGenerateMap,
}) => {
  if (!ipInfo) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-800">🗺️ Location Map</h2>
        <button
          onClick={onGenerateMap}
          disabled={isLoading}
          className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors"
        >
          {isLoading ? 'Generating...' : 'Generate Map'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {isLoading && (
        <div className="bg-gray-100 rounded-lg h-64 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-2 text-gray-600">Generating map...</span>
        </div>
      )}

      {mapImageUrl && !isLoading && (
        <div className="bg-gray-100 rounded-lg overflow-hidden">
          <img
            src={mapImageUrl}
            alt={`Map showing location: ${ipInfo.city}, ${ipInfo.country}`}
            className="w-full h-auto"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
            }}
          />
        </div>
      )}

      {!mapImageUrl && !isLoading && !error && (
        <div className="bg-gray-100 rounded-lg h-64 flex items-center justify-center">
          <div className="text-center text-gray-600">
            <p className="mb-2">No map generated yet</p>
            <p className="text-sm">
              Location: {ipInfo.latitude}, {ipInfo.longitude}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};