import { useState, useEffect } from 'react';
import { IpInfo } from '../types';
import { ICPService } from '../services/icpService';

export const useRecentVisits = (count: number = 10) => {
  const [recentVisits, setRecentVisits] = useState<IpInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRecentVisits = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (ICPService.isAvailable()) {
        const visitsData = await ICPService.getLatestVisits(count);
        setRecentVisits(visitsData);
      }
    } catch (error) {
      console.error('最近の訪問者情報の取得に失敗しました:', error);
      setError('最近の訪問者情報の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecentVisits();
  }, [count]);

  return {
    recentVisits,
    loading,
    error,
    refetch: fetchRecentVisits
  };
}; 