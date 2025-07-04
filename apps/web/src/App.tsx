import React, { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createBackendActor, getClientIP } from './lib/icpClient';
import type { BackendActor, IpInfo, Stats } from './lib/icpClient';
import { CurrentVisitorCard } from './components/CurrentVisitorCard';
import { StatsBoard } from './components/StatsBoard';
import { RecentList } from './components/RecentList';
import { StaticMap } from './components/StaticMap';

function App() {
  const [backend, setBackend] = useState<BackendActor | null>(null);
  const [currentIpInfo, setCurrentIpInfo] = useState<IpInfo | null>(null);
  const [mapImageUrl, setMapImageUrl] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Initialize backend actor
  useEffect(() => {
    const initBackend = async () => {
      try {
        const actor = await createBackendActor();
        setBackend(actor);
      } catch (error) {
        console.error('Failed to initialize backend:', error);
      }
    };

    initBackend();
  }, []);

  // Record visit on component mount
  const recordVisitMutation = useMutation({
    mutationFn: async () => {
      if (!backend) throw new Error('Backend not initialized');
      
      const clientIP = await getClientIP();
      const result = await backend.recordVisitFromClient(clientIP);
      
      if ('err' in result) {
        throw new Error(result.err);
      }
      
      return result.ok!;
    },
    onSuccess: (ipInfo) => {
      setCurrentIpInfo(ipInfo);
      // Invalidate and refetch other queries
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      queryClient.invalidateQueries({ queryKey: ['recentVisits'] });
    },
  });

  // Fetch stats
  const {
    data: stats,
    isLoading: statsLoading,
    error: statsError,
  } = useQuery<Stats>({
    queryKey: ['stats'],
    queryFn: async () => {
      if (!backend) throw new Error('Backend not initialized');
      return backend.getStats();
    },
    enabled: !!backend,
  });

  // Fetch recent visits
  const {
    data: recentVisits,
    isLoading: visitsLoading,
    error: visitsError,
  } = useQuery<IpInfo[]>({
    queryKey: ['recentVisits'],
    queryFn: async () => {
      if (!backend) throw new Error('Backend not initialized');
      return backend.getLatestVisits(BigInt(10));
    },
    enabled: !!backend,
  });

  // Generate static map
  const generateMapMutation = useMutation({
    mutationFn: async () => {
      if (!backend || !currentIpInfo) {
        throw new Error('Backend or IP info not available');
      }
      
      const result = await backend.getStaticMap(
        currentIpInfo.latitude,
        currentIpInfo.longitude,
        8, // zoom level
        800, // width
        600  // height
      );
      
      if ('err' in result) {
        throw new Error(result.err);
      }
      
      return result.ok!;
    },
    onSuccess: (imageUrl) => {
      setMapImageUrl(imageUrl);
    },
  });

  // Record visit on mount
  useEffect(() => {
    if (backend && !currentIpInfo) {
      recordVisitMutation.mutate();
    }
  }, [backend]);

  const handleGenerateMap = () => {
    generateMapMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            🌍 IP Address Tracker
          </h1>
          <p className="text-gray-600">
            Track your location and see global visitors in real-time
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Powered by Internet Computer & Motoko
          </p>
        </header>

        <div className="max-w-6xl mx-auto">
          <CurrentVisitorCard
            ipInfo={currentIpInfo}
            isLoading={recordVisitMutation.isPending}
            error={
              recordVisitMutation.error 
                ? recordVisitMutation.error.message 
                : null
            }
          />

          <StatsBoard
            stats={stats || null}
            isLoading={statsLoading}
            error={statsError ? statsError.message : null}
          />

          <StaticMap
            ipInfo={currentIpInfo}
            mapImageUrl={mapImageUrl}
            isLoading={generateMapMutation.isPending}
            error={
              generateMapMutation.error 
                ? generateMapMutation.error.message 
                : null
            }
            onGenerateMap={handleGenerateMap}
          />

          <RecentList
            visits={recentVisits || null}
            isLoading={visitsLoading}
            error={visitsError ? visitsError.message : null}
          />
        </div>

        <footer className="text-center mt-12 py-8 border-t border-gray-200">
          <p className="text-gray-500 text-sm">
            Built with React 18, TypeScript, Tailwind CSS & Internet Computer
          </p>
        </footer>
      </div>
    </div>
  );
}

export default App;
