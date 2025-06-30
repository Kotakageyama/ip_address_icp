import React from "react";
import { Stats as StatsType } from "../../types";
import "./Stats.css";

interface StatsProps {
	stats: StatsType | null;
}

const Stats: React.FC<StatsProps> = ({ stats }) => {
	if (!stats) {
		return (
			<section className="stats">
				<h2>📊 診断統計</h2>
				<div className="stats-grid">
					<div className="stats-card">
						<div className="stats-value loading">-</div>
						<div className="stats-label">統計読み込み中...</div>
					</div>
				</div>
			</section>
		);
	}

	return (
		<section className="stats">
			<h2>📊 WebRTC漏洩診断統計</h2>
			<div className="stats-description">
				<p>このツールによって検出されたWebRTC漏洩の統計情報</p>
			</div>
			<div className="stats-grid">
				<div className="stats-card vulnerability-card">
					<div className="stats-icon">🚨</div>
					<div className="stats-value">
						{stats.totalVisits.toString()}
					</div>
					<div className="stats-label">検出された漏洩数</div>
					<div className="stats-subtitle">
						WebRTCによる漏洩が検出された総回数
					</div>
				</div>
				<div className="stats-card location-card">
					<div className="stats-icon">🌍</div>
					<div className="stats-value">
						{stats.uniqueCountries.toString()}
					</div>
					<div className="stats-label">影響を受けた国</div>
					<div className="stats-subtitle">漏洩が確認された国の数</div>
				</div>
				<div className="stats-card risk-card">
					<div className="stats-icon">🛡️</div>
					<div className="stats-value">
						{stats.totalVisits > 0 ? "高" : "低"}
					</div>
					<div className="stats-label">リスクレベル</div>
					<div className="stats-subtitle">
						現在のWebRTC漏洩リスク評価
					</div>
				</div>
			</div>
			<div className="stats-footer">
				<div className="security-tip">
					<span className="tip-icon">💡</span>
					<span className="tip-text">
						WebRTC漏洩を防ぐには、ブラウザの設定でWebRTCを無効化するか、
						専用のブラウザ拡張機能を使用することをお勧めします。
					</span>
				</div>
			</div>
		</section>
	);
};

export default Stats;
