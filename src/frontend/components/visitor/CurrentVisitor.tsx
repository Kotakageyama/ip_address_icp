import React from 'react';
import { IpInfo } from '../../types';
import './CurrentVisitor.css';

interface CurrentVisitorProps {
  ipInfo: IpInfo | null;
}

const CurrentVisitor: React.FC<CurrentVisitorProps> = ({ ipInfo }) => {
  if (!ipInfo) {
    return (
      <section className="current-visitor">
        <h2>🔍 あなたの情報</h2>
        <div className="info-card">
          <div className="loading">位置情報を取得中...</div>
        </div>
      </section>
    );
  }

  return (
    <section className="current-visitor">
      <h2>🔍 あなたの情報</h2>
      <div className="info-card">
        <div className="info-grid">
          <div className="info-item">
            <div className="info-label">IPアドレス</div>
            <div className="info-value">{ipInfo.ip}</div>
          </div>
          <div className="info-item">
            <div className="info-label">国</div>
            <div className="info-value">{ipInfo.country}</div>
          </div>
          <div className="info-item">
            <div className="info-label">地域</div>
            <div className="info-value">{ipInfo.region}</div>
          </div>
          <div className="info-item">
            <div className="info-label">都市</div>
            <div className="info-value">{ipInfo.city}</div>
          </div>
          <div className="info-item">
            <div className="info-label">緯度・経度</div>
            <div className="info-value">{ipInfo.latitude}, {ipInfo.longitude}</div>
          </div>
          <div className="info-item">
            <div className="info-label">タイムゾーン</div>
            <div className="info-value">{ipInfo.timezone}</div>
          </div>
          <div className="info-item">
            <div className="info-label">ISP</div>
            <div className="info-value">{ipInfo.isp}</div>
          </div>
          <div className="info-item">
            <div className="info-label">訪問時刻</div>
            <div className="info-value">{new Date().toLocaleString('ja-JP')}</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CurrentVisitor; 