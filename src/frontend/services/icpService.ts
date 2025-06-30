import { Actor, HttpAgent } from "@dfinity/agent";
import { IpInfo, Stats, Marker } from "../types";

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
	console.log("Using production mode: https://ic0.app");
	return "https://ic0.app";
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

	const MarkerIDL = IDL.Record({
		lat: IDL.Text,
		lon: IDL.Text,
		color: IDL.Text,
	});

	const ResultIpInfoIDL = IDL.Variant({
		ok: IpInfoIDL,
		err: IDL.Text,
	});

	return IDL.Service({
		getLatestVisits: IDL.Func([IDL.Nat], [IDL.Vec(IpInfoIDL)], ["query"]),
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

		// HTTPS Outcalls関連のメソッド
		// クライアントから送信されたIPで記録
		recordVisitFromClient: IDL.Func([IDL.Text], [ResultIpInfoIDL], []),

		// 静的マップ画像取得機能
		getStaticMap: IDL.Func(
			[
				IDL.Text, // lat
				IDL.Text, // lon
				IDL.Opt(IDL.Nat8), // zoom
				IDL.Opt(IDL.Nat16), // width
				IDL.Opt(IDL.Nat16), // height
				IDL.Opt(IDL.Vec(MarkerIDL)), // markers
			],
			[IDL.Variant({ ok: IDL.Text, err: IDL.Text })],
			[]
		),
	});
};

// Canister ID（デプロイ後に更新が必要）
const canisterId =
	import.meta.env.VITE_CANISTER_ID_IP_ADDRESS_BACKEND ||
	"x7tsu-7yaaa-aaaaj-qnq5a-cai";

console.log("Using canister ID:", canisterId);

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
	// クライアントから送信されたIPアドレスで訪問を記録
	static async recordVisitFromClient(clientIp: string): Promise<IpInfo> {
		if (!backendActor) {
			throw new Error("Backend Actorが初期化されていません");
		}

		try {
			const result: ResultType<IpInfo> =
				await backendActor.recordVisitFromClient(clientIp);

			if ("ok" in result) {
				return result.ok;
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

	// マップタイルを取得

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
			const result: ResultType<string> = await backendActor.getStaticMap(
				lat,
				lon,
				zoom ? [zoom] : [],
				width ? [width] : [],
				height ? [height] : [],
				markers ? [markers] : []
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
