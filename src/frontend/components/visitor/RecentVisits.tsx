import React from "react";
import { useRecentVisits } from "../../hooks/useRecentVisits";
import { formatTimeAgo, maskIpAddress } from "../../utils/formatters";
import "./RecentVisits.css";

const RecentVisits: React.FC = () => {
	const { recentVisits, loading, error } = useRecentVisits(10);

	if (loading) {
		return (
			<section className="recent-visits">
				<h2>🕐 最近の漏洩検出</h2>
				<div className="visits-container">
					<div className="loading-state">
						<div className="scanning-animation">🔍</div>
						<p>最近のWebRTC漏洩記録を読み込み中...</p>
					</div>
				</div>
			</section>
		);
	}

	if (error) {
		return (
			<section className="recent-visits">
				<h2>🕐 最近の漏洩検出</h2>
				<div className="visits-container">
					<div className="error-state">
						<span className="error-icon">❌</span>
						<p>漏洩記録の読み込みに失敗しました</p>
					</div>
				</div>
			</section>
		);
	}

	if (recentVisits.length === 0) {
		return (
			<section className="recent-visits">
				<h2>🕐 最近の漏洩検出</h2>
				<div className="visits-container">
					<div className="empty-state">
						<span className="empty-icon">🔒</span>
						<p>まだWebRTC漏洩が検出されていません</p>
						<small>このツールで初回の診断を実行してください</small>
					</div>
				</div>
			</section>
		);
	}

	return (
		<section className="recent-visits">
			<h2>🕐 最近の漏洩検出</h2>
			<div className="visits-description">
				<p>
					WebRTCによって検出されたIPアドレス漏洩の履歴（プライバシー保護のため一部マスク表示）
				</p>
			</div>
			<div className="visits-container">
				<div className="visits-header">
					<span className="header-ip">🚨 漏洩IP</span>
					<span className="header-location">📍 推定位置</span>
					<span className="header-time">🕓 検出時刻</span>
					<span className="header-risk">⚠️ リスク</span>
				</div>
				{recentVisits.map((visit, index) => {
					const isHighRisk =
						!visit.ip.startsWith("192.168.") &&
						!visit.ip.startsWith("10.") &&
						!visit.ip.startsWith("172.");

					let timestampMs: number;
					try {
						if (typeof visit.timestamp === "bigint") {
							timestampMs = Number(visit.timestamp) / 1000000;
						} else {
							timestampMs = visit.timestamp;
						}

						if (isNaN(timestampMs) || timestampMs <= 0) {
							console.warn(
								"無効なタイムスタンプ:",
								visit.timestamp
							);
							timestampMs = Date.now();
						}
					} catch (error) {
						console.error(
							"タイムスタンプ処理エラー:",
							error,
							visit.timestamp
						);
						timestampMs = Date.now();
					}

					return (
						<div
							key={index}
							className={`visit-item ${
								isHighRisk ? "high-risk" : "low-risk"
							}`}
						>
							<div className="visit-ip">
								<span className="ip-value">
									{maskIpAddress(visit.ip)}
								</span>
								<span className="leak-indicator">📡</span>
							</div>
							<div className="visit-location">
								<span className="location-main">
									{visit.city}, {visit.country}
								</span>
								<span className="location-detail">
									{visit.region}
								</span>
							</div>
							<div className="visit-time">
								<span className="time-main">
									{formatTimeAgo(timestampMs)}
								</span>
								<span className="time-detail">
									{new Date(timestampMs).toLocaleDateString(
										"ja-JP",
										{
											year: "numeric",
											month: "2-digit",
											day: "2-digit",
										}
									)}
								</span>
							</div>
							<div className="visit-risk">
								<span
									className={`risk-badge ${
										isHighRisk ? "high" : "low"
									}`}
								>
									{isHighRisk ? "🚨 高" : "🛡️ 低"}
								</span>
							</div>
						</div>
					);
				})}
			</div>
			<div className="visits-footer">
				<div className="privacy-note">
					<span className="note-icon">🔐</span>
					<span className="note-text">
						プライバシー保護のため、IPアドレスは部分的にマスクして表示されています。
						この診断データは匿名化されており、個人を特定する情報は含まれていません。
					</span>
				</div>
			</div>
		</section>
	);
};

export default RecentVisits;
