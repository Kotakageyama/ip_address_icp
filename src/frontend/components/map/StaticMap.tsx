import React, { useState, useEffect } from "react";
import { ICPService } from "../../services/icpService";
import { IpInfo, Marker } from "../../types";
import "./Map.css";

interface StaticMapProps {
	ipInfo: IpInfo | null;
	width?: number;
	height?: number;
}

const StaticMap: React.FC<StaticMapProps> = ({
	ipInfo,
	width = 800,
	height = 500,
}) => {
	const [mapImageSrc, setMapImageSrc] = useState<string>("");
	const [loading, setLoading] = useState<boolean>(false);
	const [error, setError] = useState<string>("");

	useEffect(() => {
		if (!ipInfo) return;

		const fetchStaticMap = async () => {
			setLoading(true);
			setError("");

			try {
				if (!ICPService.isAvailable()) {
					throw new Error("ICP Service が利用できません");
				}

				const lat = ipInfo.latitude;
				const lon = ipInfo.longitude;

				// 現在の位置のマーカーのみを作成
				const markers: Marker[] = [
					{
						lat: lat,
						lon: lon,
						color: "red", // 現在の位置は赤
					},
				];

				// 静的マップを取得（固定ズームレベル12）
				// 戻り値はdata URI形式 (data:image/png;base64,{base64文字列})
				const mapImageDataUri = await ICPService.getStaticMap(
					lat,
					lon,
					12, // 固定ズーム
					width,
					height,
					markers
				);

				setMapImageSrc(mapImageDataUri);
			} catch (err) {
				console.error("静的マップの取得に失敗:", err);
				setError(
					err instanceof Error
						? err.message
						: "静的マップの取得に失敗しました"
				);
			} finally {
				setLoading(false);
			}
		};

		fetchStaticMap();
	}, [ipInfo, width, height]);

	if (loading) {
		return (
			<section className="map-section">
				<h2>🗺️ 位置情報マップ (ICP OUTCALLS)</h2>
				<div className="map-loading">
					<div className="loading-spinner"></div>
					<p>マップを読み込み中...</p>
				</div>
			</section>
		);
	}

	if (error) {
		return (
			<section className="map-section">
				<h2>🗺️ 位置情報マップ (ICP OUTCALLS)</h2>
				<div className="map-error">
					<p>❌ {error}</p>
				</div>
			</section>
		);
	}

	if (!mapImageSrc && !loading) {
		return (
			<section className="map-section">
				<h2>🗺️ 位置情報マップ (ICP OUTCALLS)</h2>
				<div className="map-placeholder">
					<p>位置情報が取得されたらマップが表示されます</p>
				</div>
			</section>
		);
	}

	return (
		<section className="map-section">
			<h2>🗺️ 位置情報マップ (ICP OUTCALLS)</h2>
			<div className="static-map-container">
				{mapImageSrc && (
					<img
						src={mapImageSrc}
						alt={`位置: ${ipInfo?.city}, ${ipInfo?.country}`}
						className="static-map-image"
						style={{
							maxWidth: "100%",
							height: "auto",
							borderRadius: "12px",
							boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)",
						}}
					/>
				)}

				{ipInfo && (
					<div className="map-info">
						<div className="info-grid">
							<div className="info-item">
								<span className="info-label">
									📍 現在の位置:
								</span>
								<span className="info-value">
									{ipInfo.city}, {ipInfo.region},{" "}
									{ipInfo.country}
								</span>
							</div>
							<div className="info-item">
								<span className="info-label">🌐 座標:</span>
								<span className="info-value">
									{parseFloat(ipInfo.latitude).toFixed(4)},{" "}
									{parseFloat(ipInfo.longitude).toFixed(4)}
								</span>
							</div>
							<div className="info-item">
								<span className="info-label">🏢 ISP:</span>
								<span className="info-value">{ipInfo.isp}</span>
							</div>
							<div className="info-item">
								<span className="info-label">
									🕐 タイムゾーン:
								</span>
								<span className="info-value">
									{ipInfo.timezone}
								</span>
							</div>
						</div>
					</div>
				)}
			</div>
		</section>
	);
};

export default StaticMap;
