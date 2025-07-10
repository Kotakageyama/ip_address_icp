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
import { getHost, getCanisterId, getEnvironment } from "../constants/config";

// 環境とネットワーク設定を取得
const environment = getEnvironment();
const host = getHost();
const canisterId = getCanisterId("backend");

console.log("Environment configuration:", {
	environment,
	host,
	canisterId,
	DEV: import.meta.env.DEV,
	MODE: import.meta.env.MODE,
});

// HttpAgentの初期化
const agent = new HttpAgent({
	host,
});

// ローカル開発環境でのルートキー取得処理を改善
if (environment === "local") {
	console.log("ローカル環境: ルートキーを取得します...");

	// ルートキーの取得を試行
	const fetchRootKeyWithRetry = async (retries = 3) => {
		for (let i = 0; i < retries; i++) {
			try {
				await agent.fetchRootKey();
				console.log("ルートキーの取得に成功しました");
				return;
			} catch (err) {
				console.warn(
					`ルートキー取得試行 ${i + 1}/${retries} 失敗:`,
					err
				);
				if (i === retries - 1) {
					console.error(
						"ルートキーの取得に失敗しました。証明書検証エラーが発生する可能性があります"
					);
					console.log(
						"ローカル環境のため、dfxが正常に起動していることを確認してください"
					);
					console.log(
						"解決方法: 'dfx start --clean' を実行してローカルレプリカを再起動してください"
					);
				}
				// 1秒待ってリトライ
				await new Promise((resolve) => setTimeout(resolve, 1000));
			}
		}
	};

	fetchRootKeyWithRetry();
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

	// 証明書検証エラーかどうかを判定
	private static isCertificateError(error: any): boolean {
		const errorMessage = error.toString().toLowerCase();
		return (
			errorMessage.includes("certificate") ||
			errorMessage.includes("signature verification") ||
			errorMessage.includes("invalid certificate") ||
			errorMessage.includes("root key")
		);
	}

	// エラーメッセージを改善
	private static formatError(error: any, operation: string): Error {
		if (this.isCertificateError(error)) {
			const environment = getEnvironment();
			if (environment === "local") {
				return new Error(
					`証明書検証エラーが発生しました (${operation})。\n` +
						`解決方法:\n` +
						`1. 'dfx start --clean' でローカルレプリカを再起動\n` +
						`2. 'dfx deploy' でCanisterを再デプロイ\n` +
						`3. ブラウザのキャッシュをクリア\n` +
						`元のエラー: ${error}`
				);
			} else {
				return new Error(
					`証明書検証エラーが発生しました (${operation})。\n` +
						`ネットワーク接続を確認してください。\n` +
						`元のエラー: ${error}`
				);
			}
		}
		return new Error(`${operation}に失敗しました: ${error}`);
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
			throw this.formatError(error, "クライアントIPによる訪問記録の保存");
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
			throw this.formatError(error, "最近の訪問記録の取得");
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
			throw this.formatError(error, "統計情報の取得");
		}
	}

	static async whoami(): Promise<string> {
		try {
			this.checkActorInitialized();
			const result = await ip_address_backend.whoami();
			return result;
		} catch (error) {
			console.error("Whoami呼び出しに失敗しました:", error);
			throw this.formatError(error, "Whoami呼び出し");
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
			throw this.formatError(error, "静的マップ画像の取得");
		}
	}
}
