import React, { useEffect, useRef } from "react";
import L from "leaflet";
import { IpInfo } from "../../types";
import { ICPService } from "../../services/icpService";
import "./Map.css";

interface MapProps {
	ipInfo: IpInfo | null;
	recentVisits: IpInfo[];
}

// カスタムタイルレイヤークラス（OUTCALLS対応）
class ICPTileLayer extends L.TileLayer {
	public tileCache: Map<string, string> = new window.Map<string, string>();

	constructor(templateUrl: string = "", options?: L.TileLayerOptions) {
		super(templateUrl, options);
	}

	createTile(coords: L.Coords, done: L.DoneCallback): HTMLElement {
		const tile = document.createElement("img");
		const tileKey = `${coords.z}-${coords.x}-${coords.y}`;

		// キャッシュから確認
		if (this.tileCache.has(tileKey)) {
			tile.src = this.tileCache.get(tileKey)!;
			done(undefined, tile);
			return tile;
		}

		// ICPのOUTCALLS機能でタイルを取得
		this.fetchTileFromICP(coords.z, coords.x, coords.y)
			.then((blobUrl) => {
				tile.src = blobUrl;
				this.tileCache.set(tileKey, blobUrl);
				done(undefined, tile);
			})
			.catch((error) => {
				console.warn(
					`タイル取得エラー (${coords.z}/${coords.x}/${coords.y}):`,
					error
				);
				// フォールバック：エラー時は透明なタイルを表示
				tile.src =
					"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
				done(undefined, tile);
			});

		return tile;
	}

	private async fetchTileFromICP(
		z: number,
		x: number,
		y: number
	): Promise<string> {
		try {
			if (!ICPService.isAvailable()) {
				throw new Error("ICP Service not available");
			}

			const tileData = await ICPService.fetchMapTile(z, x, y);
			const blob = new Blob([tileData], { type: "image/png" });
			return URL.createObjectURL(blob);
		} catch (error) {
			throw error;
		}
	}
}

const Map: React.FC<MapProps> = ({ ipInfo, recentVisits }) => {
	const mapRef = useRef<HTMLDivElement>(null);
	const mapInstanceRef = useRef<L.Map | null>(null);
	const currentMarkerRef = useRef<L.Marker | null>(null);
	const visitMarkersRef = useRef<L.CircleMarker[]>([]);
	const tileLayerRef = useRef<ICPTileLayer | null>(null);

	useEffect(() => {
		if (!mapRef.current) return;

		// 地図を初期化
		if (!mapInstanceRef.current) {
			mapInstanceRef.current = L.map(mapRef.current).setView(
				[35.6762, 139.6503],
				2
			);

			// ICPのOUTCALLS機能を使用するカスタムタイルレイヤーを追加
			if (ICPService.isAvailable()) {
				tileLayerRef.current = new ICPTileLayer("", {
					attribution:
						"© OpenStreetMap contributors (via ICP OUTCALLS)",
					maxZoom: 18,
					minZoom: 1,
				});
				tileLayerRef.current.addTo(mapInstanceRef.current);
			} else {
				// フォールバック：従来のタイルレイヤー
				L.tileLayer(
					"https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
					{
						attribution: "© OpenStreetMap contributors (Fallback)",
						maxZoom: 18,
					}
				).addTo(mapInstanceRef.current);
			}
		}

		return () => {
			// クリーンアップ
			if (mapInstanceRef.current) {
				mapInstanceRef.current.remove();
				mapInstanceRef.current = null;
			}
			// Blob URLのクリーンアップ
			if (tileLayerRef.current) {
				tileLayerRef.current.tileCache.forEach((url) => {
					if (url.startsWith("blob:")) {
						URL.revokeObjectURL(url);
					}
				});
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
		currentMarkerRef.current = L.marker([lat, lng]).addTo(
			mapInstanceRef.current
		).bindPopup(`
        <b>あなたの位置</b><br>
        ${ipInfo.city}, ${ipInfo.region}<br>
        ${ipInfo.country}<br>
        IP: ${ipInfo.ip}<br>
        ISP: ${ipInfo.isp}
      `);

		// 地図の中心をマーカー位置に設定
		mapInstanceRef.current.setView([lat, lng], 8);
	}, [ipInfo]);

	useEffect(() => {
		if (!mapInstanceRef.current) return;

		// 既存の訪問者マーカーを削除
		visitMarkersRef.current.forEach((marker) => {
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
				fillColor: "#ff7675",
				color: "#ffffff",
				weight: 2,
				opacity: 1,
				fillOpacity: 0.8,
			}).addTo(mapInstanceRef.current!);

			const visitTime = new Date(Number(visit.timestamp) / 1000000);
			marker.bindPopup(`
        <b>訪問者 #${recentVisits.length - index}</b><br>
        ${visit.city}, ${visit.region}<br>
        ${visit.country}<br>
        IP: ${visit.ip}<br>
        ISP: ${visit.isp}<br>
        時刻: ${visitTime.toLocaleString("ja-JP")}
      `);

			visitMarkersRef.current.push(marker);
		});
	}, [recentVisits]);

	return (
		<section className="map-section">
			<h2>
				🗺️ 位置情報マップ{" "}
				{ICPService.isAvailable()
					? "(ICP OUTCALLS)"
					: "(フォールバック)"}
			</h2>
			<div ref={mapRef} className="map"></div>

			{/* 状態表示 */}
			<div className="map-status">
				<p>
					{ICPService.isAvailable()
						? "✅ ICPのOUTCALLS機能でマップタイルを取得中"
						: "⚠️ フォールバックモード：従来のタイル取得"}
				</p>
				{ipInfo && (
					<p>
						📍 現在地: {ipInfo.city}, {ipInfo.country}
					</p>
				)}
				{recentVisits.length > 0 && (
					<p>👥 訪問者: {recentVisits.length}件の記録</p>
				)}
			</div>
		</section>
	);
};

export default Map;
