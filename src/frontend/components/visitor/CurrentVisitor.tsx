import React from "react";
import { IpInfo } from "../../types";
import "./CurrentVisitor.css";

interface CurrentVisitorProps {
	ipInfo: IpInfo | null;
}

const CurrentVisitor: React.FC<CurrentVisitorProps> = ({ ipInfo }) => {
	if (!ipInfo) {
		return (
			<section className="current-visitor">
				<h2>🔍 WebRTC漏洩診断中...</h2>
				<div className="visitor-info-card">
					<div className="loading">
						<div className="scanning-animation">🔍</div>
						<p>
							WebRTCプロトコルを使用してIPアドレス漏洩をチェックしています...
						</p>
					</div>
				</div>
			</section>
		);
	}

	// セキュリティレベルの判定
	const getSecurityLevel = () => {
		// ここでは簡単な判定を行う（実際のアプリではより詳細な分析が可能）
		if (
			ipInfo.ip.startsWith("192.168.") ||
			ipInfo.ip.startsWith("10.") ||
			ipInfo.ip.startsWith("172.")
		) {
			return { level: "high", text: "高", color: "#00b894", icon: "🛡️" };
		} else {
			return {
				level: "risk",
				text: "リスクあり",
				color: "#fd79a8",
				icon: "⚠️",
			};
		}
	};

	const securityLevel = getSecurityLevel();

	return (
		<section className="current-visitor">
			<h2>🛡️ WebRTC漏洩診断結果</h2>
			<div className="visitor-info-card leak-detection-card">
				<div className="security-status">
					<div
						className="security-level"
						style={{ color: securityLevel.color }}
					>
						<span className="security-icon">
							{securityLevel.icon}
						</span>
						<span className="security-text">
							プライバシーレベル: {securityLevel.text}
						</span>
					</div>
				</div>

				<div className="leak-detection-header">
					<h3>🔍 検出されたIPアドレス情報</h3>
					<p className="detection-description">
						WebRTCプロトコルを通じて以下の情報が漏洩する可能性があります：
					</p>
				</div>

				<div className="visitor-info-grid">
					<div className="visitor-info-item critical">
						<div className="visitor-info-label">
							🚨 漏洩したIPアドレス
						</div>
						<div className="visitor-info-value ip-address">
							{ipInfo.ip}
						</div>
					</div>
					<div className="visitor-info-item">
						<div className="visitor-info-label">🌍 推定国</div>
						<div className="visitor-info-value">
							{ipInfo.country}
						</div>
					</div>
					<div className="visitor-info-item">
						<div className="visitor-info-label">📍 推定地域</div>
						<div className="visitor-info-value">
							{ipInfo.region}
						</div>
					</div>
					<div className="visitor-info-item">
						<div className="visitor-info-label">🏙️ 推定都市</div>
						<div className="visitor-info-value">{ipInfo.city}</div>
					</div>
					<div className="visitor-info-item">
						<div className="visitor-info-label">🧭 位置座標</div>
						<div className="visitor-info-value location-coords">
							{ipInfo.latitude}, {ipInfo.longitude}
						</div>
					</div>
					<div className="visitor-info-item">
						<div className="visitor-info-label">
							🕐 タイムゾーン
						</div>
						<div className="visitor-info-value">
							{ipInfo.timezone}
						</div>
					</div>
					<div className="visitor-info-item">
						<div className="visitor-info-label">
							📡 インターネットプロバイダー
						</div>
						<div className="visitor-info-value">{ipInfo.isp}</div>
					</div>
					<div className="visitor-info-item">
						<div className="visitor-info-label">🕓 検出時刻</div>
						<div className="visitor-info-value">
							{new Date().toLocaleString("ja-JP")}
						</div>
					</div>
				</div>

				<div className="security-recommendations">
					<h4>🔐 セキュリティ対策の推奨事項</h4>
					<ul className="recommendations-list">
						<li>
							<span className="rec-icon">🚫</span>
							ブラウザでWebRTCを無効化する
						</li>
						<li>
							<span className="rec-icon">🔒</span>
							WebRTCリークをブロックするブラウザ拡張機能を使用
						</li>
						<li>
							<span className="rec-icon">🛡️</span>
							WebRTC対応のVPNサービスを使用
						</li>
						<li>
							<span className="rec-icon">⚙️</span>
							ブラウザのプライバシー設定を強化
						</li>
					</ul>
				</div>
			</div>
		</section>
	);
};

export default CurrentVisitor;
