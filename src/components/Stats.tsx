import React from 'react';
import { Stats as StatsType } from '../types';
import './Stats.css';

interface StatsProps {
  stats: StatsType | null;
}

const Stats: React.FC<StatsProps> = ({ stats }) => {
  return (
    <section className="stats">
      <h2>📊 統計情報</h2>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-number">
            {stats ? stats.totalVisits.toString() : '-'}
          </div>
          <div className="stat-label">総訪問数</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">
            {stats ? stats.uniqueCountries.toString() : '-'}
          </div>
          <div className="stat-label">異なる国</div>
        </div>
      </div>
    </section>
  );
};

export default Stats; 