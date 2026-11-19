<script setup lang="ts">
import type { Episode, Material } from "../storage/materials.js";
defineProps<{
	episode: Episode;
	time: string;
	parts: [string, string[]][];
	sources: Material[];
	history: Episode[];
}>();
</script>

<template>
	<h1>{{ episode.title }}</h1>
	<small>模型整理 · {{ episode.review }}</small>
	<p>发生：{{ time }}</p>
	<p v-if="episode.happen?.source_ids?.length">
		时间依据：
		<a v-for="id in episode.happen.source_ids" :key="id" :href="'/material/' + id">{{ id }} </a>
	</p>
	<p>{{ episode.summary }}</p>
	<template v-for="[label, values] in parts" :key="label">
		<section v-if="values.length">
			<h2>{{ label }}</h2>
			<p v-for="(value, i) in values" :key="i">{{ value }}</p>
		</section>
	</template>
	<h2>原始材料</h2>
	<ul>
		<li v-for="m in sources" :key="m.id">
			<a :href="'/material/' + m.id">{{ m.media?.original_name ?? m.text.slice(0, 80) }}</a>
		</li>
	</ul>
	<h2>修订历史</h2>
	<a v-for="x in history" :key="x.revision" :href="'?rev=' + x.revision"
		>版本 {{ x.revision }}
	</a>
</template>
