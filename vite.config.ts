import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath, URL } from "url";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// canister_ids.jsonからcanister IDを読み込む
const loadCanisterIds = () => {
	try {
		const canisterIdsPath = path.resolve(__dirname, "canister_ids.json");
		const canisterIds = JSON.parse(
			fs.readFileSync(canisterIdsPath, "utf8")
		);

		// DFX_NETWORKまたはNODE_ENVから環境を判定
		const network =
			process.env.DFX_NETWORK ||
			(process.env.NODE_ENV === "development" ? "local" : "ic");

		console.log(`Loading canister IDs for network: ${network}`);

		return {
			backend:
				canisterIds.ip_address_backend?.[network] ||
				canisterIds.ip_address_backend?.ic ||
				"x7tsu-7yaaa-aaaaj-qnq5a-cai",
			frontend:
				canisterIds.ip_address_frontend?.[network] ||
				canisterIds.ip_address_frontend?.ic ||
				"xysua-saaaa-aaaaj-qnq5q-cai",
			network,
		};
	} catch (error) {
		console.warn(
			"canister_ids.jsonの読み込みに失敗しました。デフォルト値を使用します。",
			error
		);
		return {
			backend: "x7tsu-7yaaa-aaaaj-qnq5a-cai",
			frontend: "xysua-saaaa-aaaaj-qnq5q-cai",
			network: "ic",
		};
	}
};

export default defineConfig(({ mode }) => {
	const canisterIds = loadCanisterIds();

	return {
		plugins: [react()],
		build: {
			outDir: "dist",
			emptyOutDir: true,
		},
		server: {
			port: 3000,
		},
		define: {
			global: "globalThis",
			// Canister IDsを環境変数として定義
			"import.meta.env.VITE_CANISTER_ID_IP_ADDRESS_BACKEND":
				JSON.stringify(
					process.env.VITE_CANISTER_ID_IP_ADDRESS_BACKEND ||
						canisterIds.backend
				),
			"import.meta.env.VITE_CANISTER_ID_IP_ADDRESS_FRONTEND":
				JSON.stringify(
					process.env.VITE_CANISTER_ID_IP_ADDRESS_FRONTEND ||
						canisterIds.frontend
				),
			// ネットワーク情報を環境変数として追加
			"import.meta.env.VITE_DFX_NETWORK": JSON.stringify(
				canisterIds.network
			),
			"import.meta.env.VITE_NETWORK": JSON.stringify(canisterIds.network),
			// 本番環境では明示的に環境変数を設定
			...(mode === "production" && {
				"import.meta.env.DEV": false,
				"import.meta.env.PROD": true,
				"import.meta.env.VITE_IS_LOCAL_NETWORK":
					JSON.stringify("false"),
				"import.meta.env.VITE_LOCAL_BACKEND_HOST": JSON.stringify(""),
			}),
			// 開発環境では適切なローカル設定を提供
			...(mode === "development" &&
				canisterIds.network === "local" && {
					"import.meta.env.VITE_IS_LOCAL_NETWORK":
						JSON.stringify("true"),
					"import.meta.env.VITE_LOCAL_BACKEND_HOST": JSON.stringify(
						"http://localhost:4943"
					),
				}),
		},
		resolve: {
			alias: {
				"@": path.resolve(__dirname, "./src"),
			},
		},
	};
});
