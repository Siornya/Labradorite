import { loadRuntimeConfig } from "./runtime-config.js";
import { isAbsolute } from "node:path";
import { MaterialStore } from "./storage/materials.js";
import { createDaemon, DAEMON_PORT, requireToken } from "./transport/daemon.js";
let store: MaterialStore | undefined;
try {
	const config = process.argv[2] ? loadRuntimeConfig(process.argv[2]) : undefined;
	const token = requireToken(config?.token ?? process.env.FISH_MEMORY_TOKEN);
	const path = config?.database ?? process.env.FISH_MEMORY_DB;
	if (path && !isAbsolute(path)) throw new Error("Database path must be absolute.");
	const memory = path
		? {
				store: (store = new MaterialStore(path)),
				scope: {
					space: config?.space ?? process.env.FISH_MEMORY_SPACE ?? "local",
					character:
						config?.character ?? process.env.FISH_MEMORY_CHARACTER ?? "character",
					world: config?.world ?? process.env.FISH_MEMORY_WORLD ?? "real",
				},
				principal: "local-client",
			}
		: undefined;
	const app = createDaemon(token, memory);
	await app.listen({ host: "127.0.0.1", port: DAEMON_PORT });
	console.error("Fish memory headless service started on loopback.");
	for (const signal of ["SIGINT", "SIGTERM"] as const)
		process.once(signal, () => {
			void app.close().catch(() => {
				process.exitCode = 1;
			});
		});
} catch {
	store?.close();
	console.error(
		"Unable to start: check database path, scope, credentials and whether the headless service is already running.",
	);
	process.exitCode = 1;
}
