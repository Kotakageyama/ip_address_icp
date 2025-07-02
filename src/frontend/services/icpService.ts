import { HttpAgent } from "@dfinity/agent";
import { IpInfo, Stats, Marker } from "../types";
// 生成された型定義をインポート
import { createActor } from "../../declarations/ip_address_backend";
import type {
	IpInfo as GeneratedIpInfo,
	Marker as GeneratedMarker,
	_SERVICE,
} from "../../declarations/ip_address_backend/ip_address_backend.did";
import { ActorSubclass } from "@dfinity/agent";

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

// Canister ID（本番環境のIDを使用）
const getCanisterId = () => {
	// 環境変数から取得を試行
	const envCanisterId = import.meta.env.VITE_CANISTER_ID_IP_ADDRESS_BACKEND;
	if (envCanisterId) {
		console.log("Using canister ID from environment:", envCanisterId);
		return envCanisterId;
	}

	// デフォルト: 本番環境のcanister ID
	const productionCanisterId = "x7tsu-7yaaa-aaaaj-qnq5a-cai";
	console.log("Using default production canister ID:", productionCanisterId);
	return productionCanisterId;
};

const host = getHost();
const canisterId = getCanisterId();

console.log("Initializing agent with host:", host);
console.log("Using canister ID:", canisterId);

const agent = new HttpAgent({
	host,
});

// ローカル開発環境でのみroot keyを取得
if (
	(import.meta.env.DEV && import.meta.env.MODE === "development") ||
	import.meta.env.VITE_LOCAL_BACKEND_HOST ||
	import.meta.env.VITE_IS_LOCAL_NETWORK === "true"
) {
	agent.fetchRootKey().catch((err) => {
		console.warn("Root keyの取得に失敗しました:", err);
	});
}

// Actorを手動で作成
let ip_address_backend: ActorSubclass<_SERVICE>;

try {
	ip_address_backend = createActor(canisterId, {
		agent,
	});
	console.log("Actor created successfully");
} catch (error) {
	console.error("Failed to create actor:", error);
	throw new Error(`Failed to initialize ICP backend service: ${error}`);
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
	// Actorが初期化されているかをチェック
	private static checkActorInitialized(): void {
		if (!ip_address_backend) {
			throw new Error(
				"ICP backend actor is not initialized. Please check your canister ID and network configuration."
			);
		}
	}

	// クライアントから送信されたIPアドレスで訪問を記録
	static async recordVisitFromClient(clientIp: string): Promise<IpInfo> {
		try {
			this.checkActorInitialized();
			const result = await ip_address_backend.recordVisitFromClient(
				clientIp
			);

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
		try {
			this.checkActorInitialized();
			const visits = await ip_address_backend.getLatestVisits(
				BigInt(count)
			);
			return visits.map(convertGeneratedIpInfoToIpInfo);
		} catch (error) {
			console.error("最近の訪問記録の取得に失敗しました:", error);
			throw error;
		}
	}

	static async getStats(): Promise<Stats> {
		try {
			this.checkActorInitialized();
			const stats = await ip_address_backend.getStats();
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
		try {
			this.checkActorInitialized();
			const result = await ip_address_backend.whoami();
			return result;
		} catch (error) {
			console.error("Whoami呼び出しに失敗しました:", error);
			throw error;
		}
	}

	static isAvailable(): boolean {
		return ip_address_backend !== null && ip_address_backend !== undefined;
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
		try {
			this.checkActorInitialized();
			const convertedMarkers = markers?.map(
				convertMarkerToGeneratedMarker
			);

			const result = await ip_address_backend.getStaticMap(
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
