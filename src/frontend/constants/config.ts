/**
 * API関連の設定
 */
export const API_CONFIG = {
	// 外部IP API のエンドポイント
	IP_APIS: [
		"https://ipapi.co/json/",
		"https://ip-api.com/json/",
		// 'https://ipinfo.io/json' // ICP環境のCSPでブロックされるため削除
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

	// 本番環境のホスト
	PRODUCTION_HOST: "https://ic0.app",

	// デフォルトのCanister ID
	DEFAULT_CANISTER_ID: "rdmx6-jaaaa-aaaaa-aaadq-cai",
} as const;

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
	NAME: "IP Address Location Tracker",
	VERSION: "1.0.0",
	DESCRIPTION: "Internet Computer上で動作するIPアドレス位置情報トラッカー",
	AUTHOR: "Your Name",
	REPOSITORY: "https://github.com/your-username/ip_address_icp",
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
