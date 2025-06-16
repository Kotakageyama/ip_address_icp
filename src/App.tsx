import React, { useEffect, useState } from 'react';
import Header from './components/Header';
import CurrentVisitor from './components/CurrentVisitor';
import Map from './components/Map';
import Stats from './components/Stats';
import RecentVisits from './components/RecentVisits';
import Footer from './components/Footer';
import { IpInfo, Stats as StatsType } from './types';
import { IPService } from './services/ipService';
import { ICPService } from './services/icpService';
import './App.css';

const App: React.FC = () => {
  const [currentIpInfo, setCurrentIpInfo] = useState<IpInfo | null>(null);
  const [stats, setStats] = useState<StatsType | null>(null);
  const [recentVisits, setRecentVisits] = useState<IpInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      setLoading(true);
      
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

      // 統計情報と最近の訪問者を取得
      if (ICPService.isAvailable()) {
        try {
          const [statsData, visitsData] = await Promise.all([
            ICPService.getStats(),
            ICPService.getLatestVisits(10)
          ]);
          
          setStats(statsData);
          setRecentVisits(visitsData);
        } catch (error) {
          console.warn('ICPからのデータ取得に失敗しました:', error);
        }
      }

    } catch (error) {
      console.error('アプリケーションの初期化に失敗しました:', error);
      setError('アプリケーションの初期化に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading-screen">
          <div className="loading-spinner"></div>
          <p>アプリケーションを初期化中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="error-screen">
          <h2>エラーが発生しました</h2>
          <p>{error}</p>
          <button onClick={initializeApp}>再試行</button>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <Header />
      
      <main className="main-content">
        <CurrentVisitor ipInfo={currentIpInfo} />
        <Map ipInfo={currentIpInfo} recentVisits={recentVisits} />
        <Stats stats={stats} />
        <RecentVisits visits={recentVisits} />
      </main>

      <Footer canisterId={ICPService.getCanisterId()} />
    </div>
  );
};

export default App; 