import { useState, useEffect } from "react";
import { IpInfo } from "../types";
import { IPService } from "../services/ipService";
import { ICPService } from "../services/icpService";

export const useIpLocation = () => {
	const [currentIpInfo, setCurrentIpInfo] = useState<IpInfo | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const fetchIpLocation = async () => {
		try {
			setLoading(true);
			setError(null);

			// ICPが利用可能な場合はOUTCALLS機能を使用
			if (ICPService.isAvailable()) {
				try {
					// 現在のクライアントIPを取得するために、まず軽量なIP取得APIを使用
					const clientIp = await getClientIp();

					// ICPのOUTCALLS機能でIP情報を取得して記録
					const success = await ICPService.recordVisitByIp(clientIp);
					if (success) {
						// 最新の記録を取得して表示
						const latestVisits = await ICPService.getLatestVisits(
							1
						);
						if (latestVisits.length > 0) {
							setCurrentIpInfo(latestVisits[0]);
							console.log(
								"OUTCALLS機能でIP情報を取得・記録しました"
							);
							return;
						}
					}
				} catch (error) {
					console.warn("OUTCALLS機能での取得に失敗:", error);
				}
			}

			// フォールバック：従来のクライアント側取得
			console.log("フォールバックとして従来の方法でIP情報を取得します");
			const ipInfo = await IPService.fetchIpInfo();
			if (ipInfo) {
				setCurrentIpInfo(ipInfo);

				// ICPに記録（可能な場合）
				if (ICPService.isAvailable()) {
					try {
						await ICPService.recordVisit(ipInfo);
						console.log("訪問情報をCanisterに記録しました");
					} catch (error) {
						console.warn("Canisterへの記録に失敗しました:", error);
					}
				}
			}
		} catch (error) {
			console.error("IP位置情報の取得に失敗しました:", error);
			setError("IP位置情報の取得に失敗しました");
		} finally {
			setLoading(false);
		}
	};

	// クライアントIPを軽量に取得するヘルパー関数
	const getClientIp = async (): Promise<string> => {
		try {
			// 軽量なIP取得サービスを使用
			const response = await fetch("https://api64.ipify.org?format=json");
			const data = await response.json();
			return data.ip || "127.0.0.1";
		} catch (error) {
			console.warn("クライアントIP取得に失敗:", error);
			return "127.0.0.1"; // フォールバック
		}
	};

	useEffect(() => {
		fetchIpLocation();
	}, []);

	return {
		currentIpInfo,
		loading,
		error,
		refetch: fetchIpLocation,
	};
};
