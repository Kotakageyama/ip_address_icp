import { Actor, HttpAgent } from "@dfinity/agent";
import {
	IpInfo,
	Stats,
	PagedVisitsResult,
	CountryStats,
	MemoryStats,
} from "../types";

// 環境に応じたホスト設定
const getHost = () => {
	// ローカル開発環境変数が設定されている場合
	if (import.meta.env.VITE_LOCAL_BACKEND_HOST) {
		return import.meta.env.VITE_LOCAL_BACKEND_HOST;
	}

	// 開発モード（npm run dev）の場合
	if (import.meta.env.DEV) {
		return "http://localhost:4943";
	}

	// プロダクションでもローカルネットワーク用の環境変数がある場合
	if (import.meta.env.VITE_IS_LOCAL_NETWORK === "true") {
		return "http://localhost:4943";
	}

	// 本番環境
	return "https://ic0.app";
};

const agent = new HttpAgent({
	host: getHost(),
});

// ローカル開発環境では証明書を検証しない
if (import.meta.env.DEV) {
	agent.fetchRootKey();
}

// Canister IDL インターフェース定義（スケーラブル版）
const idlFactory = ({ IDL }: any) => {
	const IpInfoIDL = IDL.Record({
		ip: IDL.Text,
		country: IDL.Text,
		region: IDL.Text,
		city: IDL.Text,
		latitude: IDL.Text,
		longitude: IDL.Text,
		timezone: IDL.Text,
		isp: IDL.Text,
		timestamp: IDL.Int,
	});

	const PagedVisitsResultIDL = IDL.Record({
		visits: IDL.Vec(IpInfoIDL),
		totalPages: IDL.Nat,
		currentPage: IDL.Nat,
		totalItems: IDL.Nat,
	});

	const MemoryStatsIDL = IDL.Record({
		totalVisits: IDL.Nat,
		bufferCapacity: IDL.Nat,
		uniqueCountries: IDL.Nat,
	});

	const ResultBoolIDL = IDL.Variant({
		ok: IDL.Bool,
		err: IDL.Text,
	});

	const ResultIpInfoIDL = IDL.Variant({
		ok: IpInfoIDL,
		err: IDL.Text,
	});

	return IDL.Service({
		recordVisit: IDL.Func([IpInfoIDL], [IDL.Bool], []),
		getLatestVisits: IDL.Func([IDL.Nat], [IDL.Vec(IpInfoIDL)], ["query"]),
		getAllVisits: IDL.Func([], [IDL.Vec(IpInfoIDL)], ["query"]),
		getStats: IDL.Func(
			[],
			[
				IDL.Record({
					totalVisits: IDL.Nat,
					uniqueCountries: IDL.Nat,
				}),
			],
			["query"]
		),
		whoami: IDL.Func([], [IDL.Text], ["query"]),

		// 新しいスケーラブル機能のIDL
		getVisitsPaged: IDL.Func(
			[IDL.Nat, IDL.Nat],
			[PagedVisitsResultIDL],
			["query"]
		),
		getCountryStats: IDL.Func(
			[],
			[IDL.Vec(IDL.Tuple(IDL.Text, IDL.Nat))],
			["query"]
		),
		clearAllData: IDL.Func([], [IDL.Bool], []),
		getMemoryStats: IDL.Func([], [MemoryStatsIDL], ["query"]),

		// HTTPS Outcalls関連の新しいメソッド
		fetchIpInfo: IDL.Func([IDL.Text], [ResultIpInfoIDL], []),
		recordVisitByIp: IDL.Func([IDL.Text], [ResultBoolIDL], []),
	});
};

// Canister ID（デプロイ後に更新が必要）
const canisterId =
	import.meta.env.VITE_CANISTER_ID_IP_ADDRESS_BACKEND ||
	"uxrrr-q7777-77774-qaaaq-cai";

// Actorインスタンスの作成
let backendActor: any = null;

try {
	backendActor = Actor.createActor(idlFactory, {
		agent,
		canisterId,
	});
} catch (error) {
	console.warn("Backend Actorの初期化に失敗しました:", error);
}

// HTTPS Outcalls用の結果型
type ResultType<T> = { ok: T } | { err: string };

export class ICPService {
	static async recordVisit(ipInfo: IpInfo): Promise<boolean> {
		if (!backendActor) {
			throw new Error("Backend Actorが初期化されていません");
		}

		try {
			const result = await backendActor.recordVisit(ipInfo);
			return result;
		} catch (error) {
			console.error("訪問記録の保存に失敗しました:", error);
			throw error;
		}
	}

	// HTTPS Outcallsを使用してIPアドレス情報を取得
	static async fetchIpInfo(ip: string): Promise<IpInfo> {
		if (!backendActor) {
			throw new Error("Backend Actorが初期化されていません");
		}

		try {
			const result: ResultType<IpInfo> = await backendActor.fetchIpInfo(
				ip
			);

			if ("ok" in result) {
				return result.ok;
			} else {
				throw new Error(result.err);
			}
		} catch (error) {
			console.error("IP情報の取得に失敗しました:", error);
			throw error;
		}
	}

	// IPアドレスから自動的に情報を取得して記録
	static async recordVisitByIp(ip: string): Promise<boolean> {
		if (!backendActor) {
			throw new Error("Backend Actorが初期化されていません");
		}

		try {
			const result: ResultType<boolean> =
				await backendActor.recordVisitByIp(ip);

			if ("ok" in result) {
				return result.ok;
			} else {
				throw new Error(result.err);
			}
		} catch (error) {
			console.error("IP情報による訪問記録の保存に失敗しました:", error);
			throw error;
		}
	}

	static async getLatestVisits(count: number): Promise<IpInfo[]> {
		if (!backendActor) {
			throw new Error("Backend Actorが初期化されていません");
		}

		try {
			const visits = await backendActor.getLatestVisits(count);
			return visits;
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
			return stats;
		} catch (error) {
			console.error("統計情報の取得に失敗しました:", error);
			throw error;
		}
	}

	// 新しいスケーラブル機能のメソッド

	static async getVisitsPaged(
		page: number,
		pageSize: number
	): Promise<PagedVisitsResult> {
		if (!backendActor) {
			throw new Error("Backend Actorが初期化されていません");
		}

		try {
			const result = await backendActor.getVisitsPaged(page, pageSize);
			return result;
		} catch (error) {
			console.error("ページング付き訪問記録の取得に失敗しました:", error);
			throw error;
		}
	}

	static async getCountryStats(): Promise<CountryStats[]> {
		if (!backendActor) {
			throw new Error("Backend Actorが初期化されていません");
		}

		try {
			const stats = await backendActor.getCountryStats();
			// [Text, Nat] タプル配列を CountryStats[] に変換
			return stats.map(([country, visitCount]: [string, bigint]) => ({
				country,
				visitCount,
			}));
		} catch (error) {
			console.error("国別統計の取得に失敗しました:", error);
			throw error;
		}
	}

	static async getMemoryStats(): Promise<MemoryStats> {
		if (!backendActor) {
			throw new Error("Backend Actorが初期化されていません");
		}

		try {
			const stats = await backendActor.getMemoryStats();
			return stats;
		} catch (error) {
			console.error("メモリ統計の取得に失敗しました:", error);
			throw error;
		}
	}

	static async clearAllData(): Promise<boolean> {
		if (!backendActor) {
			throw new Error("Backend Actorが初期化されていません");
		}

		try {
			const result = await backendActor.clearAllData();
			console.log("全データをクリアしました");
			return result;
		} catch (error) {
			console.error("データクリアに失敗しました:", error);
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

	static async getHealthCheck(): Promise<{
		canisterStatus: string;
		memoryStats: MemoryStats;
		latestVersion: string;
	}> {
		try {
			const [memoryStats, version] = await Promise.all([
				this.getMemoryStats(),
				this.whoami(),
			]);

			return {
				canisterStatus: "healthy",
				memoryStats,
				latestVersion: version,
			};
		} catch (error) {
			console.error("ヘルスチェックに失敗しました:", error);
			throw error;
		}
	}
}
