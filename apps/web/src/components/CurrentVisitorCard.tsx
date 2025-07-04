import React from 'react';
import type { IpInfo } from '../lib/icpClient';

interface CurrentVisitorCardProps {
  ipInfo: IpInfo | null;
  isLoading: boolean;
  error: string | null;
}

export const CurrentVisitorCard: React.FC<CurrentVisitorCardProps> = ({
  ipInfo,
  isLoading,
  error,
}) => {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Your Location</h2>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
        <h2 className="text-xl font-bold text-red-800 mb-2">Error</h2>
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (!ipInfo) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-800 mb-2">Your Location</h2>
        <p className="text-gray-600">No location data available</p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow-md p-6 mb-6 text-white">
      <h2 className="text-xl font-bold mb-4">🌍 Your Location</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <p className="text-blue-100 text-sm">IP Address</p>
          <p className="font-mono text-lg">{ipInfo.ip}</p>
        </div>
        <div>
          <p className="text-blue-100 text-sm">Location</p>
          <p className="text-lg">
            {ipInfo.city}, {ipInfo.region}, {ipInfo.country}
          </p>
        </div>
        <div>
          <p className="text-blue-100 text-sm">ISP</p>
          <p className="text-lg">{ipInfo.isp}</p>
        </div>
        <div>
          <p className="text-blue-100 text-sm">Timezone</p>
          <p className="text-lg">{ipInfo.timezone}</p>
        </div>
        <div>
          <p className="text-blue-100 text-sm">Coordinates</p>
          <p className="font-mono text-lg">
            {ipInfo.latitude}, {ipInfo.longitude}
          </p>
        </div>
        <div>
          <p className="text-blue-100 text-sm">Recorded</p>
          <p className="text-lg">
            {new Date(Number(ipInfo.timestamp) * 1000).toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
};