import { useState, useEffect } from "react";
import { IpInfo } from "../types";
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
					// BE経由でグローバルIPを取得
					const clientIp = await ICPService.fetchGlobalIp();

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
					setError("IP情報の取得に失敗しました");
				}
			} else {
				setError("ICPServiceが利用できません");
			}
		} catch (error) {
			console.error("IP位置情報の取得に失敗しました:", error);
			setError("IP位置情報の取得に失敗しました");
		} finally {
			setLoading(false);
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
