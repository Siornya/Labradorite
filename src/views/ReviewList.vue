<script setup lang="ts">
import type { ReviewLog } from "../storage/review-log.js";
import { reviewStateLabels } from "./review-state.js";
defineProps<{ items: ReturnType<ReviewLog["list"]>["items"]; pageNumber: number; next: boolean }>();
</script>

<template>
	<h1>回顾记录</h1>
	<p v-if="!items.length">暂无回顾记录。</p>
	<article v-for="row in items" :key="row.key">
		<small>{{ row.time }} · {{ reviewStateLabels[row.state] }}</small>
		<h2>
			<a :href="(row.kind === 'setting' ? '/traits/' : '/reviews/') + row.key">{{
				row.title || row.name || (row.kind === "organize" ? "经历回顾" : "人物回顾")
			}}</a>
		</h2>
		<p>
			<template v-if="row.kind === 'setting'">设定变化</template>
			<template v-if="row.episodeId">经历 · 版本 {{ row.episodeRevision }} </template>
			<template v-if="row.personId"
				>人物档案 · {{ row.name }} 版本 {{ row.personRevision }}</template
			>
		</p>
	</article>
	<a v-if="pageNumber" :href="'/reviews?page=' + (pageNumber - 1)">上一页</a>
	<a v-if="next" :href="'/reviews?page=' + (pageNumber + 1)">下一页</a>
</template>
