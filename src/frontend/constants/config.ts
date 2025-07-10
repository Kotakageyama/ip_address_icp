/**
 * API関連の設定
 */
export const API_CONFIG = {
	// 外部IP API のエンドポイント
	IP_APIS: [
		"https://ipapi.co/json/",
		"https://ip-api.com/json/",
		"https://ipinfo.io/json",
	],

	// API タイムアウト（ミリ秒）
	TIMEOUT: 10000,

	// リトライ回数
	MAX_RETRIES: 3,
} as const;

/**
 * ICP関連の設定
 */
export const ICP_CONFIG = {
	// ローカル開発環境のホスト
	LOCAL_HOST: "http://localhost:4943",

	// 本番環境のホスト - icp0.ioを使用してCSPエラーを回避
	PRODUCTION_HOST: "https://icp0.io",

	// Canister IDs
	CANISTER_IDS: {
		BACKEND: {
			LOCAL: "uxrrr-q7777-77774-qaaaq-cai",
			PRODUCTION: "x7tsu-7yaaa-aaaaj-qnq5a-cai",
		},
		FRONTEND: {
			LOCAL: "uxrrr-q7777-77774-qaaaq-cai",
			PRODUCTION: "xysua-saaaa-aaaaj-qnq5q-cai",
		},
	},

	// デフォルトのCanister ID
	DEFAULT_CANISTER_ID: "rdmx6-jaaaa-aaaaa-aaadq-cai",
} as const;

/**
 * 現在の環境を判定する
 */
export const getEnvironment = (): "local" | "production" => {
	// 環境変数で明示的に指定されている場合
	if (import.meta.env.VITE_NETWORK) {
		return import.meta.env.VITE_NETWORK === "local"
			? "local"
			: "production";
	}

	// DFX_NETWORK環境変数をチェック
	if (import.meta.env.VITE_DFX_NETWORK === "local") {
		return "local";
	}

	// 開発モードかつlocalhostを使用している場合
	if (
		import.meta.env.DEV &&
		(import.meta.env.VITE_LOCAL_BACKEND_HOST === "http://localhost:4943" ||
			import.meta.env.VITE_IS_LOCAL_NETWORK === "true")
	) {
		return "local";
	}

	// デフォルトは本番環境
	return "production";
};

/**
 * 現在の環境に応じたcanister IDを取得する
 */
export const getCanisterId = (
	type: "backend" | "frontend" = "backend"
): string => {
	const environment = getEnvironment();

	// 環境変数で直接指定されている場合は優先
	if (
		type === "backend" &&
		import.meta.env.VITE_CANISTER_ID_IP_ADDRESS_BACKEND
	) {
		return import.meta.env.VITE_CANISTER_ID_IP_ADDRESS_BACKEND;
	}
	if (
		type === "frontend" &&
		import.meta.env.VITE_CANISTER_ID_IP_ADDRESS_FRONTEND
	) {
		return import.meta.env.VITE_CANISTER_ID_IP_ADDRESS_FRONTEND;
	}

	// 設定に基づいて決定
	if (type === "backend") {
		return environment === "local"
			? ICP_CONFIG.CANISTER_IDS.BACKEND.LOCAL
			: ICP_CONFIG.CANISTER_IDS.BACKEND.PRODUCTION;
	} else {
		return environment === "local"
			? ICP_CONFIG.CANISTER_IDS.FRONTEND.LOCAL
			: ICP_CONFIG.CANISTER_IDS.FRONTEND.PRODUCTION;
	}
};

/**
 * 現在の環境に応じたホストを取得する
 */
export const getHost = (): string => {
	const environment = getEnvironment();

	// 環境変数で直接指定されている場合は優先
	if (import.meta.env.VITE_LOCAL_BACKEND_HOST) {
		return import.meta.env.VITE_LOCAL_BACKEND_HOST;
	}

	return environment === "local"
		? ICP_CONFIG.LOCAL_HOST
		: ICP_CONFIG.PRODUCTION_HOST;
};

/**
 * UI関連の設定
 */
export const UI_CONFIG = {
	// デフォルトで表示する最近の訪問者数
	DEFAULT_RECENT_VISITS_COUNT: 10,

	// 地図のデフォルト表示位置
	DEFAULT_MAP_CENTER: {
		lat: 35.6762,
		lng: 139.6503,
	},

	// 地図のデフォルトズームレベル
	DEFAULT_ZOOM_LEVEL: 2,

	// データ更新間隔（ミリ秒）
	REFRESH_INTERVAL: 30000,

	// アニメーション時間（ミリ秒）
	ANIMATION_DURATION: 300,
} as const;

/**
 * エラーメッセージ
 */
export const ERROR_MESSAGES = {
	NETWORK_ERROR: "ネットワークエラーが発生しました",
	API_ERROR: "APIからのデータ取得に失敗しました",
	CANISTER_ERROR: "Canisterへの接続に失敗しました",
	INVALID_DATA: "無効なデータが検出されました",
	INITIALIZATION_ERROR: "アプリケーションの初期化に失敗しました",
	LOCATION_ERROR: "位置情報の取得に失敗しました",
} as const;

/**
 * ローディングメッセージ
 */
export const LOADING_MESSAGES = {
	INITIALIZING: "アプリケーションを初期化中...",
	FETCHING_IP: "IPアドレス情報を取得中...",
	FETCHING_STATS: "統計情報を取得中...",
	FETCHING_VISITS: "訪問者情報を取得中...",
	SAVING_DATA: "データを保存中...",
} as const;

/**
 * 地図関連の設定
 */
export const MAP_CONFIG = {
	// 地図タイルのURL
	TILE_URL: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",

	// 地図の著作権表示
	ATTRIBUTION:
		'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',

	// マーカーの色設定
	MARKER_COLORS: {
		CURRENT: "#ff4444",
		RECENT: "#4444ff",
		OLD: "#888888",
	},

	// ズームレベルの制限
	MIN_ZOOM: 1,
	MAX_ZOOM: 18,
} as const;

/**
 * ローカルストレージのキー
 */
export const STORAGE_KEYS = {
	USER_PREFERENCES: "ip_tracker_preferences",
	CACHED_IP_INFO: "ip_tracker_cached_ip",
	LAST_VISIT_TIME: "ip_tracker_last_visit",
} as const;

/**
 * アプリケーション情報
 */
export const APP_INFO = {
	NAME: "WebRTC IP漏洩チェッカー",
	VERSION: "1.0.0",
	DESCRIPTION:
		"WebRTCによるIPアドレス漏洩を診断し、プライバシー保護のためのセキュリティチェックツール",
	AUTHOR: "Kota Kageyama",
	REPOSITORY: "https://github.com/Kotakageyama/ip_address_icp",
} as const;

/**
 * デバッグ設定
 */
export const DEBUG_CONFIG = {
	// 開発環境でのログレベル
	LOG_LEVEL: import.meta.env.DEV ? "debug" : "error",

	// パフォーマンス測定を有効にするか
	ENABLE_PERFORMANCE_MONITORING: import.meta.env.DEV,

	// 詳細なエラーレポートを有効にするか
	ENABLE_DETAILED_ERRORS: import.meta.env.DEV,
} as const;
