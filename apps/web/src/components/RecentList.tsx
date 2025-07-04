import React from 'react';
import type { IpInfo } from '../lib/icpClient';

interface RecentListProps {
  visits: IpInfo[] | null;
  isLoading: boolean;
  error: string | null;
}

export const RecentList: React.FC<RecentListProps> = ({
  visits,
  isLoading,
  error,
}) => {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">🕒 Recent Visits</h2>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h2 className="text-xl font-bold text-red-800 mb-2">Recent Visits Error</h2>
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (!visits || visits.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-2">🕒 Recent Visits</h2>
        <p className="text-gray-600">No recent visits available</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold text-gray-800 mb-6">🕒 Recent Visits</h2>
      <div className="space-y-4">
        {visits.map((visit, index) => (
          <div
            key={`${visit.ip}-${visit.timestamp}`}
            className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                    {visit.ip}
                  </span>
                  <span className="text-lg">
                    {visit.city}, {visit.country}
                  </span>
                </div>
                <div className="text-sm text-gray-600">
                  <span>{visit.isp}</span>
                  <span className="mx-2">•</span>
                  <span>{visit.timezone}</span>
                </div>
              </div>
              <div className="text-right text-sm text-gray-500">
                <div>#{index + 1}</div>
                <div>
                  {new Date(Number(visit.timestamp) * 1000).toLocaleDateString()}
                </div>
                <div>
                  {new Date(Number(visit.timestamp) * 1000).toLocaleTimeString()}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};