import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import { visualizer } from "rollup-plugin-visualizer";
import { defineConfig } from "vitest/config";

const host = process.env.TAURI_DEV_HOST;

export default defineConfig({
	plugins: [
		react(),
		visualizer({
			filename: "dist/stats.html",
			open: false,
			gzipSize: true,
			brotliSize: true,
		}),
	],

	resolve: {
		alias: {
			"@": resolve(__dirname, "./src"),
			"@app": resolve(__dirname, "./src/app"),
			"@layout": resolve(__dirname, "./src/layout"),
			"@features": resolve(__dirname, "./src/features"),
			"@shared": resolve(__dirname, "./src/shared"),
			"@test": resolve(__dirname, "./src/test"),
		},
	},

	build: {
		chunkSizeWarningLimit: 1500,
	},

	test: {
		globals: true,
		environment: "jsdom",
		setupFiles: ["./src/test/setup.ts"],
		include: ["src/**/*.test.{ts,tsx}"],
		coverage: {
			provider: "v8",
			reporter: ["text", "json", "html"],
			exclude: ["node_modules/", "src/test/"],
		},
	},

	clearScreen: false,

	server: {
		port: 1420,
		strictPort: true,
		host: host || false,
		hmr: host
			? {
					protocol: "ws",
					host,
					port: 1421,
				}
			: undefined,
		watch: {
			ignored: ["**/src-tauri/**"],
		},
	},
});
