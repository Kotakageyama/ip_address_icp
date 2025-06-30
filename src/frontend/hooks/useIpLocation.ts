import { useState, useEffect } from "react";
import { IpInfo } from "../types";
import { ICPService } from "../services/icpService";

export const useIpLocation = () => {
	const [currentIpInfo, setCurrentIpInfo] = useState<IpInfo | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	// WebRTC STUN サーバーを使用してクライアントIPを取得
	const fetchClientIpViaWebRTC = async (): Promise<string> => {
		return new Promise((resolve, reject) => {
			console.log("🔍 WebRTC IP取得を開始...");

			// WebRTC設定（複数のSTUNサーバーを使用）
			const configuration = {
				iceServers: [
					{ urls: "stun:stun.l.google.com:19302" },
					{ urls: "stun:stun1.l.google.com:19302" },
					{ urls: "stun:stun2.l.google.com:19302" },
					{ urls: "stun:stun.cloudflare.com:3478" },
				],
			};

			console.log("📡 STUN サーバー設定:", configuration.iceServers);

			const peerConnection = new RTCPeerConnection(configuration);
			let ipDetected = false;
			let candidatesFound = 0;

			// ICE候補が見つかった時の処理
			peerConnection.onicecandidate = (event) => {
				candidatesFound++;
				console.log(
					`🎯 ICE候補 #${candidatesFound}:`,
					event.candidate?.candidate || "null"
				);

				if (event.candidate && !ipDetected) {
					const candidate = event.candidate.candidate;

					// IPv4アドレスを抽出（正規表現を使用）
					const ipRegex = /(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/;
					const match = candidate.match(ipRegex);

					if (match && match[1]) {
						const ip = match[1];
						console.log(`🔍 発見されたIP: ${ip}`);

						// ローカルIPアドレス（192.168.x.x, 10.x.x.x, 172.16-31.x.x）を除外
						if (!isLocalIP(ip)) {
							console.log(`✅ パブリックIPを発見: ${ip}`);
							ipDetected = true;
							peerConnection.close();
							resolve(ip);
						} else {
							console.log(`🏠 ローカルIPをスキップ: ${ip}`);
						}
					}
				}
			};

			// 接続状態の変化を監視
			peerConnection.oniceconnectionstatechange = () => {
				console.log(
					"🔗 ICE接続状態:",
					peerConnection.iceConnectionState
				);
			};

			// ICE収集状態を監視
			peerConnection.onicegatheringstatechange = () => {
				console.log(
					"📊 ICE収集状態:",
					peerConnection.iceGatheringState
				);

				if (
					peerConnection.iceGatheringState === "complete" &&
					!ipDetected
				) {
					console.log(
						"⚠️ ICE収集完了、しかしパブリックIPが見つからない"
					);
					peerConnection.close();
					reject(
						new Error("パブリックIPアドレスが見つかりませんでした")
					);
				}
			};

			// エラー処理
			peerConnection.onicecandidateerror = (event) => {
				console.warn("❌ ICE candidate error:", event);
			};

			// ダミーのデータチャネルを作成してICE候補の収集を開始
			try {
				console.log("🚀 データチャネル作成とOffer生成中...");
				peerConnection.createDataChannel("dummy");

				peerConnection
					.createOffer()
					.then((offer) => {
						console.log("📄 Offer作成成功");
						return peerConnection.setLocalDescription(offer);
					})
					.then(() => {
						console.log(
							"✅ LocalDescription設定完了、ICE候補収集開始"
						);
					})
					.catch(reject);

				// タイムアウト設定（15秒）
				setTimeout(() => {
					if (!ipDetected) {
						console.log("⏰ WebRTC IP取得タイムアウト");
						peerConnection.close();
						reject(
							new Error("WebRTC IP取得がタイムアウトしました")
						);
					}
				}, 15000);
			} catch (error) {
				console.error("❌ WebRTC初期化エラー:", error);
				reject(new Error(`WebRTC初期化エラー: ${error}`));
			}
		});
	};

	// ローカルIPアドレスかどうかを判定
	const isLocalIP = (ip: string): boolean => {
		const parts = ip.split(".").map(Number);
		if (parts.length !== 4) return true;

		// プライベートIPアドレスの範囲をチェック
		return (
			// 192.168.x.x
			(parts[0] === 192 && parts[1] === 168) ||
			// 10.x.x.x
			parts[0] === 10 ||
			// 172.16.x.x - 172.31.x.x
			(parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
			// 127.x.x.x (localhost)
			parts[0] === 127 ||
			// 169.254.x.x (APIPA)
			(parts[0] === 169 && parts[1] === 254)
		);
	};

	// フォールバック: ユーザーに手動入力を求める
	const askUserForIP = async (): Promise<string> => {
		return new Promise((resolve, reject) => {
			// シンプルなプロンプトを使用（実際のアプリでは適切なUIを実装）
			const userIP = prompt(
				"IPアドレスの自動取得に失敗しました。\n" +
					"あなたのパブリックIPアドレスを入力してください：\n" +
					"（https://whatismyipaddress.com/ などで確認できます）"
			);

			if (userIP && userIP.trim()) {
				const ip = userIP.trim();
				// 基本的なIPアドレス形式の検証
				const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
				if (ipRegex.test(ip)) {
					resolve(ip);
				} else {
					reject(new Error("無効なIPアドレス形式です"));
				}
			} else {
				reject(new Error("IPアドレスが入力されませんでした"));
			}
		});
	};

	const fetchIpLocation = async () => {
		try {
			setLoading(true);
			setError(null);

			if (ICPService.isAvailable()) {
				try {
					console.log("WebRTC経由でクライアントIP取得中...");

					let clientIp: string;

					try {
						// 1. WebRTCでIP取得を試行
						clientIp = await fetchClientIpViaWebRTC();
						console.log(
							"WebRTCで取得したクライアントIP:",
							clientIp
						);
					} catch (webrtcError) {
						console.warn("WebRTC IP取得に失敗:", webrtcError);

						// 2. フォールバック: ユーザー手動入力
						try {
							clientIp = await askUserForIP();
							console.log("ユーザー入力IP:", clientIp);
						} catch (userError) {
							throw new Error(
								`IP取得に失敗しました: ${
									userError instanceof Error
										? userError.message
										: "Unknown error"
								}`
							);
						}
					}

					// 3. 取得したIPをcanisterに送信して記録
					const ipInfo = await ICPService.recordVisitFromClient(
						clientIp
					);
					setCurrentIpInfo(ipInfo);
					console.log("IP情報を正常に記録しました:", ipInfo);
				} catch (error) {
					console.warn("IP取得・記録に失敗:", error);
					setError(
						`IP情報の取得に失敗しました: ${
							error instanceof Error
								? error.message
								: "Unknown error"
						}`
					);
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
