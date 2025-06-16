import { useState, useEffect } from 'react';
import { IpInfo } from '../types';
import { IPService } from '../services/ipService';
import { ICPService } from '../services/icpService';

export const useIpLocation = () => {
  const [currentIpInfo, setCurrentIpInfo] = useState<IpInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchIpLocation = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // IPアドレス情報を取得
      const ipInfo = await IPService.fetchIpInfo();
      if (ipInfo) {
        setCurrentIpInfo(ipInfo);
        
        // ICPに記録（可能な場合）
        if (ICPService.isAvailable()) {
          try {
            await ICPService.recordVisit(ipInfo);
            console.log('訪問情報をCanisterに記録しました');
          } catch (error) {
            console.warn('Canisterへの記録に失敗しました:', error);
          }
        }
      }
    } catch (error) {
      console.error('IP位置情報の取得に失敗しました:', error);
      setError('IP位置情報の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIpLocation();
  }, []);

  return {
    currentIpInfo,
    loading,
    error,
    refetch: fetchIpLocation
  };
}; 