<script setup lang="ts">
import type { readIndexStatus } from "../retrieval/index-status.js";
defineProps<{
	status?: ReturnType<typeof readIndexStatus>;
	error?: string;
	href?: string;
	label?: string;
	percent?: number;
	model?: string;
	state?: string;
	reason?: string;
	disabled?: string;
	command?: string;
}>();
</script>

<template>
	<h1>索引状态</h1>
	<p v-if="error">
		{{ error }} <a :href="href">{{ label }}</a
		>。
	</p>
	<template v-else-if="status">
		<p v-if="!status.semantic_enabled">{{ disabled }} 全文检索仍然可用。</p>
		<template v-else>
			<p>当前模型：{{ model }}</p>
			<p>
				语义索引覆盖率：{{ percent }}% · 已索引 {{ status.embedded_chunks }} /
				{{ status.chunks }} 个片段，待处理 {{ status.pending_chunks }} 个。
			</p>
			<progress
				aria-label="语义索引覆盖率"
				:max="Math.max(1, status.chunks)"
				:value="status.chunks ? status.embedded_chunks : 1"
			></progress>
			<p v-if="!status.chunks">记忆库暂无可索引内容。</p>
			<p v-else-if="status.pending_chunks">
				未索引内容仍可通过全文检索查找；语义检索尚未覆盖全部内容。
			</p>
			<p v-else>当前内容已全部建立语义索引。</p>
			<p>
				UTC 今日请求：{{ status.usage.requests }} /
				{{ status.max_requests_per_day }}（整个数据库共享）。
			</p>
			<p>
				最近任务：{{ state
				}}<template v-if="status.indexing">
					· 更新时间（UTC）：{{ status.indexing.updated_at }}</template
				>
			</p>
			<p v-if="reason" role="status">{{ reason }}</p>
			<p>
				在项目目录运行以下命令可继续建立索引。Ctrl+C
				会在当前批次结束后停止，已完成进度会保留。
			</p>
			<pre><code>{{ command }}</code></pre>
		</template>
		<p><a href="/index-status">刷新状态</a></p>
		<p>此页只读取状态，不会发起 embedding 请求。</p>
	</template>
</template>
