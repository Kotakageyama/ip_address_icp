import { useState, useEffect } from 'react';
import { Stats } from '../types';
import { ICPService } from '../services/icpService';

export const useStats = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);

      if (await ICPService.whoami()) {
        const statsData = await ICPService.getStats();
        setStats(statsData);
      }
    } catch (error) {
      console.error('統計情報の取得に失敗しました:', error);
      setError('統計情報の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return {
    stats,
    loading,
    error,
    refetch: fetchStats,
  };
};
