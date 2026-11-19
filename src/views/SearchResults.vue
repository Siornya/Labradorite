<script setup lang="ts">
import PersonCards from "./PersonCards.vue";
import type { findPeople } from "../storage/profiles.js";
defineProps<{
	query: string;
	people: ReturnType<typeof findPeople>["items"];
	items: { id: string; kind: string; label: string; stale: boolean; excerpt?: string }[];
	semantic: { used: boolean; pending_chunks: number };
	reason?: string | false | null;
}>();
</script>

<template>
	<h1>搜索结果</h1>
	<p>{{ query }} · {{ semantic.used ? "混合检索" : "全文检索" }}</p>
	<p v-if="reason" role="status">{{ reason }} <a href="/index-status">查看索引状态</a></p>
	<p v-if="semantic.used && semantic.pending_chunks">
		语义索引尚有 {{ semantic.pending_chunks }} 个片段待处理。<a href="/index-status"
			>查看索引状态</a
		>
	</p>
	<PersonCards :people="people" />
	<article v-for="item in items" :key="item.id">
		<small>{{ item.label }}{{ item.stale ? " · 有后续更正" : "" }}</small>
		<p>
			<a :href="'/' + item.kind + '/' + item.id">{{ item.excerpt ?? "展开记录" }}</a>
		</p>
	</article>
	<p v-if="!items.length && !people.length">没有匹配的记录。</p>
</template>
