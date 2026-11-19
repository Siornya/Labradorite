<script setup lang="ts">
import type { Material } from "../storage/materials.js";
defineProps<{
	material: Material;
	related: { id: string; title: string }[];
	corrections: { id: string }[];
}>();
</script>

<template>
	<h1>{{ material.media?.original_name ?? "原始材料" }}</h1>
	<small>{{ material.speaker }} · {{ material.received_at }}</small>
	<img v-if="material.media?.kind === 'photo'" :src="'/media/' + material.id" alt="归档照片" />
	<video
		v-else-if="material.media"
		controls
		preload="metadata"
		:src="'/media/' + material.id"
	></video>
	<p>{{ material.text }}</p>
	<h2>记录范围</h2>
	<p>{{ material.coverage }}</p>
	<p v-if="material.media?.observed_range_ms">
		报告的观看区间：{{ material.media.observed_range_ms[0] / 1000 }}–{{
			material.media.observed_range_ms[1] / 1000
		}}
		秒
	</p>
	<h2>关联经历</h2>
	<ul v-if="related.length">
		<li v-for="e in related" :key="e.id">
			<a :href="'/episode/' + e.id">{{ e.title }}</a>
		</li>
	</ul>
	<p v-else>暂无经历引用这条材料。</p>
	<a v-if="material.corrects" :href="'/material/' + material.corrects">查看被更正的原记录</a>
	<p v-for="x in corrections" :key="x.id"><a :href="'/material/' + x.id">查看后续更正</a></p>
</template>
