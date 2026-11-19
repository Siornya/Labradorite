<script setup lang="ts">
defineProps<{
	saved: boolean;
	error?: string;
	revision?: string;
	idle?: number;
	budget?: number;
}>();
</script>

<template>
	<h1>设置</h1>
	<template v-if="error">
		<p role="alert">{{ error }}</p>
		<p><a href="/settings">重新加载设置</a> · <a href="/choose">选择记忆库</a></p>
	</template>
	<template v-else>
		<p v-if="saved" role="status">设置已保存。</p>
		<h2>语义索引</h2>
		<form class="settings" method="post" action="/settings">
			<input type="hidden" name="revision" :value="revision" />
			<label
				>空闲索引时长（分钟）<input
					required
					type="number"
					min="1"
					max="35791"
					name="idle"
					:value="idle"
			/></label>
			<small
				>最后一次 MCP 工具调用结束后，连续空闲达到此时长时开始索引。默认 120 分钟。</small
			>
			<template v-if="budget != null">
				<label
					>每日请求上限（次）<input
						required
						type="number"
						min="0"
						max="100000"
						name="budget"
						:value="budget"
				/></label>
				<small>额度由整个数据库共享，按 UTC 日期重置。</small>
			</template>
			<p v-else>当前使用全文检索。启用 embedding 后，空闲索引时长才会生效。</p>
			<p>保存后，请重启此记忆库的 MCP 服务以应用设置。</p>
			<button>保存设置</button>
		</form>
	</template>
</template>
