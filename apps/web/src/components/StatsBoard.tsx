import React from 'react';
import type { Stats } from '../lib/icpClient';

interface StatsBoardProps {
  stats: Stats | null;
  isLoading: boolean;
  error: string | null;
}

export const StatsBoard: React.FC<StatsBoardProps> = ({
  stats,
  isLoading,
  error,
}) => {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">📊 Site Statistics</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-8 bg-gray-200 rounded w-3/4"></div>
          </div>
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-8 bg-gray-200 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
        <h2 className="text-xl font-bold text-red-800 mb-2">Statistics Error</h2>
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-800 mb-2">📊 Site Statistics</h2>
        <p className="text-gray-600">No statistics available</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-xl font-bold text-gray-800 mb-6">📊 Site Statistics</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="text-center">
          <div className="bg-gradient-to-r from-green-400 to-green-600 rounded-lg p-6 text-white">
            <div className="text-3xl font-bold mb-2">
              {stats.totalVisits.toString()}
            </div>
            <div className="text-green-100">Total Visits</div>
          </div>
        </div>
        <div className="text-center">
          <div className="bg-gradient-to-r from-orange-400 to-orange-600 rounded-lg p-6 text-white">
            <div className="text-3xl font-bold mb-2">
              {stats.uniqueCountries.toString()}
            </div>
            <div className="text-orange-100">Unique Countries</div>
          </div>
        </div>
      </div>
    </div>
  );
};