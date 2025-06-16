import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { IpInfo } from '../../types';
import './Map.css';

interface MapProps {
  ipInfo: IpInfo | null;
  recentVisits: IpInfo[];
}

const Map: React.FC<MapProps> = ({ ipInfo, recentVisits }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const currentMarkerRef = useRef<L.Marker | null>(null);
  const visitMarkersRef = useRef<L.CircleMarker[]>([]);

  useEffect(() => {
    if (!mapRef.current) return;

    // 地図を初期化
    if (!mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapRef.current).setView([35.6762, 139.6503], 2);
      
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(mapInstanceRef.current);
    }

    return () => {
      // クリーンアップ
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapInstanceRef.current || !ipInfo) return;

    const lat = parseFloat(ipInfo.latitude);
    const lng = parseFloat(ipInfo.longitude);

    if (isNaN(lat) || isNaN(lng)) return;

    // 既存の現在位置マーカーを削除
    if (currentMarkerRef.current) {
      mapInstanceRef.current.removeLayer(currentMarkerRef.current);
    }

    // 新しいマーカーを追加
    currentMarkerRef.current = L.marker([lat, lng])
      .addTo(mapInstanceRef.current)
      .bindPopup(`
        <b>あなたの位置</b><br>
        ${ipInfo.city}, ${ipInfo.region}<br>
        ${ipInfo.country}<br>
        IP: ${ipInfo.ip}
      `);

    // 地図の中心をマーカー位置に設定
    mapInstanceRef.current.setView([lat, lng], 8);
  }, [ipInfo]);

  useEffect(() => {
    if (!mapInstanceRef.current) return;

    // 既存の訪問者マーカーを削除
    visitMarkersRef.current.forEach(marker => {
      mapInstanceRef.current!.removeLayer(marker);
    });
    visitMarkersRef.current = [];

    // 新しい訪問者マーカーを追加
    recentVisits.forEach((visit, index) => {
      const lat = parseFloat(visit.latitude);
      const lng = parseFloat(visit.longitude);

      if (isNaN(lat) || isNaN(lng)) return;

      const marker = L.circleMarker([lat, lng], {
        radius: 6,
        fillColor: '#ff7675',
        color: '#ffffff',
        weight: 2,
        opacity: 1,
        fillOpacity: 0.8
      }).addTo(mapInstanceRef.current!);

      const visitTime = new Date(Number(visit.timestamp) / 1000000);
      marker.bindPopup(`
        <b>訪問者 #${recentVisits.length - index}</b><br>
        ${visit.city}, ${visit.region}<br>
        ${visit.country}<br>
        IP: ${visit.ip}<br>
        時刻: ${visitTime.toLocaleString('ja-JP')}
      `);

      visitMarkersRef.current.push(marker);
    });
  }, [recentVisits]);

  return (
    <section className="map-section">
      <h2>🗺️ 位置情報マップ</h2>
      <div ref={mapRef} className="map"></div>
    </section>
  );
};

export default Map; 