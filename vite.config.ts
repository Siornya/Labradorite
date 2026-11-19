import Vue from "unplugin-vue/rolldown";
import { defineConfig } from "vite-plus";
import type { PackUserConfig } from "vite-plus/pack";
import { fileURLToPath } from "node:url";
export default defineConfig({
	resolve: {
		alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
	},
	pack: {
		// Vite+ bundles Rolldown; unplugin uses the standalone Rolldown type declarations.
		plugins: [Vue({ ssr: true })] as unknown as NonNullable<PackUserConfig["plugins"]>,
		entry: {
			"src/mcp-main": "src/mcp-main.ts",
			"src/viewer": "src/viewer.ts",
		},
		platform: "node",
		format: "esm",
		outExtensions: () => ({ js: ".js" }),
		outDir: "dist",
		copy: [{ from: "src/viewer.css", to: "dist/src" }],
		clean: true,
		dts: false,
		sourcemap: true,
	},
	test: {
		include: ["tests/**/*.test.ts"],
		environment: "node",
	},
	staged: {
		"*": "vp check --fix",
	},
	lint: {
		jsPlugins: [{ name: "vite-plus", specifier: "vite-plus/oxlint-plugin" }],
		rules: { "vite-plus/prefer-vite-plus-imports": "error" },
		options: { typeAware: true, typeCheck: true },
	},
	fmt: {
		useTabs: true,
		tabWidth: 4,
		printWidth: 100,
		ignorePatterns: ["src/contracts/generated/**", "dist/**", ".local-backups/**"],
	},
});
