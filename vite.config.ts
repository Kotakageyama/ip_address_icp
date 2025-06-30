import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath, URL } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => ({
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
		// 本番環境では明示的にDEVをfalseに設定
		...(mode === "production" && {
			"import.meta.env.DEV": false,
			"import.meta.env.PROD": true,
		}),
	},
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src"),
		},
	},
}));
