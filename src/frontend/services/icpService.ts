import { HttpAgent } from "@dfinity/agent";
import { IpInfo, Stats, Marker } from "../types";
// 生成された型定義をインポート
import { createActor } from "../../declarations/ip_address_backend";
import type {
	_SERVICE,
	IpInfo as GeneratedIpInfo,
	Marker as GeneratedMarker,
} from "../../declarations/ip_address_backend/ip_address_backend.did";

// 環境に応じたホスト設定
const getHost = () => {
	// デバッグ情報をログ出力
	console.log("Environment check:", {
		DEV: import.meta.env.DEV,
		MODE: import.meta.env.MODE,
		VITE_LOCAL_BACKEND_HOST: import.meta.env.VITE_LOCAL_BACKEND_HOST,
		VITE_IS_LOCAL_NETWORK: import.meta.env.VITE_IS_LOCAL_NETWORK,
	});

	// 明示的にローカル開発環境変数が設定されている場合
	if (import.meta.env.VITE_LOCAL_BACKEND_HOST) {
		console.log(
			"Using VITE_LOCAL_BACKEND_HOST:",
			import.meta.env.VITE_LOCAL_BACKEND_HOST
		);
		return import.meta.env.VITE_LOCAL_BACKEND_HOST;
	}

	// 明示的にローカルネットワーク用の環境変数がある場合
	if (import.meta.env.VITE_IS_LOCAL_NETWORK === "true") {
		console.log("Using local network: http://localhost:4943");
		return "http://localhost:4943";
	}

	// 開発モード（npm run dev）の場合のみローカルホストを使用
	if (import.meta.env.DEV && import.meta.env.MODE === "development") {
		console.log("Using development mode: http://localhost:4943");
		return "http://localhost:4943";
	}

	// デフォルト: 本番環境（IC mainnet）
	console.log("Using production mode: https://icp0.io");
	return "https://icp0.io";
};

const host = getHost();
console.log("Initializing agent with host:", host);

const agent = new HttpAgent({
	host,
});

// ローカル開発環境では証明書を検証しない
if (
	(import.meta.env.DEV && import.meta.env.MODE === "development") ||
	import.meta.env.VITE_LOCAL_BACKEND_HOST ||
	import.meta.env.VITE_IS_LOCAL_NETWORK === "true"
) {
	agent.fetchRootKey();
}

// Canister ID（デプロイ後に更新が必要）
const canisterId =
	import.meta.env.VITE_CANISTER_ID_IP_ADDRESS_BACKEND ||
	"x7tsu-7yaaa-aaaaj-qnq5a-cai";

console.log("Using canister ID:", canisterId);

// 生成された型定義を使用してActorインスタンスを作成
let backendActor: _SERVICE | null = null;

try {
	backendActor = createActor(canisterId, {
		agent,
	});
} catch (error) {
	console.warn("Backend Actorの初期化に失敗しました:", error);
}

// 型変換ユーティリティ関数
const convertGeneratedIpInfoToIpInfo = (
	generated: GeneratedIpInfo
): IpInfo => ({
	ip: generated.ip,
	country: generated.country,
	region: generated.region,
	city: generated.city,
	latitude: generated.latitude,
	longitude: generated.longitude,
	timezone: generated.timezone,
	isp: generated.isp,
	timestamp: generated.timestamp,
});

const convertMarkerToGeneratedMarker = (marker: Marker): GeneratedMarker => ({
	lat: marker.lat,
	lon: marker.lon,
	color: marker.color,
});

export class ICPService {
	// クライアントから送信されたIPアドレスで訪問を記録
	static async recordVisitFromClient(clientIp: string): Promise<IpInfo> {
		if (!backendActor) {
			throw new Error("Backend Actorが初期化されていません");
		}

		try {
			const result = await backendActor.recordVisitFromClient(clientIp);

			if ("ok" in result) {
				return convertGeneratedIpInfoToIpInfo(result.ok);
			} else {
				throw new Error(result.err);
			}
		} catch (error) {
			console.error(
				"クライアントIPによる訪問記録の保存に失敗しました:",
				error
			);
			throw error;
		}
	}

	static async getLatestVisits(count: number): Promise<IpInfo[]> {
		if (!backendActor) {
			throw new Error("Backend Actorが初期化されていません");
		}

		try {
			const visits = await backendActor.getLatestVisits(BigInt(count));
			return visits.map(convertGeneratedIpInfoToIpInfo);
		} catch (error) {
			console.error("最近の訪問記録の取得に失敗しました:", error);
			throw error;
		}
	}

	static async getStats(): Promise<Stats> {
		if (!backendActor) {
			throw new Error("Backend Actorが初期化されていません");
		}

		try {
			const stats = await backendActor.getStats();
			return {
				totalVisits: stats.totalVisits,
				uniqueCountries: stats.uniqueCountries,
			};
		} catch (error) {
			console.error("統計情報の取得に失敗しました:", error);
			throw error;
		}
	}

	static async whoami(): Promise<string> {
		if (!backendActor) {
			throw new Error("Backend Actorが初期化されていません");
		}

		try {
			const result = await backendActor.whoami();
			return result;
		} catch (error) {
			console.error("Whoami呼び出しに失敗しました:", error);
			throw error;
		}
	}

	static isAvailable(): boolean {
		return backendActor !== null;
	}

	static getCanisterId(): string {
		return canisterId;
	}

	// ユーティリティメソッド
	static formatBigInt(value: bigint): string {
		return value.toString();
	}

	static async getStaticMap(
		lat: string,
		lon: string,
		zoom?: number,
		width?: number,
		height?: number,
		markers?: Marker[]
	): Promise<string> {
		if (!backendActor) {
			throw new Error("Backend Actorが初期化されていません");
		}

		try {
			const convertedMarkers = markers?.map(
				convertMarkerToGeneratedMarker
			);

			const result = await backendActor.getStaticMap(
				lat,
				lon,
				zoom ? [zoom] : [],
				width ? [width] : [],
				height ? [height] : [],
				convertedMarkers ? [convertedMarkers] : []
			);

			if ("ok" in result) {
				return result.ok;
			} else {
				throw new Error(result.err);
			}
		} catch (error) {
			console.error("静的マップ画像の取得に失敗しました:", error);
			throw error;
		}
	}
}
