<script setup lang="ts">
import type { Episode, Material } from "../storage/materials.js";
import { describeEventTime } from "../domain/event-time.js";
defineProps<{
	tab: string;
	heading: string;
	invalid?: boolean;
	q?: string;
	basis?: string;
	from?: string;
	to?: string;
	unknown?: boolean;
	prev?: string;
	next?: string;
	episodes?: Episode[];
	materials?: Material[];
}>();
</script>

<template>
	<h1>{{ heading }}</h1>
	<p v-if="invalid" role="alert">
		时间筛选无效，请使用带时区的 ISO 时间，且开始时间不能晚于结束时间。
	</p>
	<template v-else>
		<form>
			<input type="hidden" name="tab" :value="tab" />
			<input name="q" aria-label="筛选当前列表" placeholder="筛选当前列表" :value="q" />
			<template v-if="episodes">
				<select name="time_basis" aria-label="时间依据">
					<option value="happen" :selected="basis === 'happen'">发生时间</option>
					<option value="review" :selected="basis === 'review'">记录时间</option>
				</select>
				<label
					>从（含时区）<input
						name="from"
						aria-label="起始时间（含时区）"
						placeholder="2026-10-01T00:00:00+08:00"
						:value="from"
				/></label>
				<label
					>至（含时区）<input
						name="to"
						aria-label="结束时间（含时区）"
						placeholder="2026-10-31T23:59:59+08:00"
						:value="to"
				/></label>
				<label
					><input
						type="checkbox"
						name="unknown"
						value="1"
						:checked="unknown"
					/>仅发生时间未知</label
				>
			</template>
			<button>筛选</button>
		</form>
		<p v-if="episodes">
			发生时间按可能范围与窗口相交筛选；月、年精度不代表持续整月或整年。未知发生时间排在末尾，指定发生时间窗口时不命中。
		</p>
		<div :class="{ grid: tab === 'album' }">
			<article v-for="e in episodes" :key="e.id">
				<small
					>发生：{{ describeEventTime(e.happen) }}<br />记录：{{ e.review }} · 修订
					{{ e.revision }}</small
				>
				<h2>
					<a :href="'/episode/' + e.id">{{ e.title }}</a>
				</h2>
				<p>{{ e.summary.slice(0, 180) }}</p>
			</article>
			<article v-for="m in materials" :key="m.id">
				<a :href="'/material/' + m.id">
					<img
						v-if="tab === 'album' && m.media?.kind === 'photo'"
						loading="lazy"
						alt=""
						:src="'/thumbnail/' + m.id"
					/>
					{{ m.text.slice(0, 100) }} </a
				><br />
				<small>{{ m.media ? m.media.original_name + " · " : "" }}{{ m.received_at }}</small>
			</article>
			<p v-if="!episodes?.length && !materials?.length">没有符合条件的记录</p>
		</div>
		<a v-if="prev" :href="prev">上一页</a>
		<a v-if="next" :href="next">下一页</a>
	</template>
</template>
