import { activeViewers } from "./viewer-registry.js";
const viewers = await activeViewers();
if (!viewers.length) {
	console.error("没有运行中的查看器。请启动记忆服务并启用 WebView。");
	process.exitCode = 1;
}
for (const { runtime, url } of viewers) {
	const port = new URL(url).port;
	console.log(
		runtime +
			"\n" +
			url +
			"\nSSH 端口转发：ssh -N -L " +
			port +
			":127.0.0.1:" +
			port +
			" user@server",
	);
}
