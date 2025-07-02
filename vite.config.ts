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

		// ネットワークを判定（local or ic）
		const network = process.env.DFX_NETWORK || "ic";

		return {
			backend:
				canisterIds.ip_address_backend?.[network] ||
				canisterIds.ip_address_backend?.ic ||
				"x7tsu-7yaaa-aaaaj-qnq5a-cai",
			frontend:
				canisterIds.ip_address_frontend?.[network] ||
				canisterIds.ip_address_frontend?.ic ||
				"xysua-saaaa-aaaaj-qnq5q-cai",
		};
	} catch (error) {
		console.warn(
			"canister_ids.jsonの読み込みに失敗しました。デフォルト値を使用します。",
			error
		);
		return {
			backend: "x7tsu-7yaaa-aaaaj-qnq5a-cai",
			frontend: "xysua-saaaa-aaaaj-qnq5q-cai",
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
			// 本番環境では明示的に環境変数を設定
			...(mode === "production" && {
				"import.meta.env.DEV": false,
				"import.meta.env.PROD": true,
				"import.meta.env.VITE_IS_LOCAL_NETWORK":
					JSON.stringify("false"),
				"import.meta.env.VITE_LOCAL_BACKEND_HOST": JSON.stringify(""),
			}),
		},
		resolve: {
			alias: {
				"@": path.resolve(__dirname, "./src"),
			},
		},
	};
});
