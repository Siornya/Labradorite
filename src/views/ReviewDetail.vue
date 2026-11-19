<script setup lang="ts">
import type { ReviewLog } from "../storage/review-log.js";
import { reviewStateLabels } from "./review-state.js";

const { detail } = defineProps<{
	detail: NonNullable<ReturnType<ReviewLog["detail"]>>;
	selection: string;
	conflict?: boolean;
}>();
const { entry, episode, previous, review, profile } = detail;
</script>

<template>
	<a href="/reviews">返回回顾记录</a>
	<h1>{{ entry.title || entry.name || "回顾详情" }}</h1>
	<p>{{ entry.time }} · {{ reviewStateLabels[entry.state] }}</p>
	<p v-if="conflict" role="alert">回顾状态已有变化，请核对当前记录。</p>
	<p v-if="entry.state === 'undone'">本次回顾已撤销。原始材料仍可在材料页查看。</p>
	<template v-else>
		<template v-if="episode">
			<h2>
				{{ previous ? "修订经历" : "新增经历" }} ·
				<a :href="'/episode/' + episode.id + '?rev=' + episode.revision">{{
					episode.title
				}}</a>
			</h2>
			<section v-for="change in detail.changes" :key="change.label">
				<h3>{{ change.label }}</h3>
				<dl class="review-changes">
					<div v-if="previous">
						<dt>修改前</dt>
						<dd>{{ change.before }}</dd>
					</div>
					<div>
						<dt>{{ previous ? "修改后" : "本次记录" }}</dt>
						<dd>{{ change.after }}</dd>
					</div>
				</dl>
			</section>
			<h3>原始材料</h3>
			<ul>
				<li v-for="m in detail.sources" :key="m.id">
					<a :href="'/material/' + m.id">{{ m.text }}</a>
				</li>
			</ul>
		</template>
		<template v-if="review && profile">
			<h2>
				{{ review.revision === 1 ? "新建人物档案" : "更新人物档案" }} ·
				<a :href="'/person/' + profile.id">{{ profile.name }}</a>
			</h2>
			<p v-if="review.revision === 1">{{ profile.identity }}</p>
			<template v-if="review.impression !== null">
				<small>先前印象</small>
				<p>{{ detail.priorImpression ?? "暂无" }}</p>
				<small>本次印象</small>
				<p>{{ review.impression }}</p>
			</template>
			<p v-else>本次关联了经历，沿用已有印象。</p>
			<h3>依据的经历</h3>
			<ul>
				<li v-for="ref in review.episodes" :key="ref.id">
					<a :href="'/episode/' + ref.id + '?rev=' + ref.revision"
						>{{ ref.title }} · 版本 {{ ref.revision }}</a
					>
				</li>
			</ul>
		</template>
		<form v-if="entry.state === 'pending'" method="post">
			<input type="hidden" name="selection" :value="selection" />
			<button name="action" value="check">标为已审阅</button>
		</form>
		<template v-if="detail.blockers.length">
			<h2>暂时无法撤销</h2>
			<ul>
				<li v-for="(reason, i) in detail.blockers" :key="i">{{ reason }}</li>
			</ul>
		</template>
		<details v-else>
			<summary>撤销本次回顾</summary>
			<p>
				<template v-if="episode">{{
					previous
						? "经历将恢复到版本 " + previous.revision + "。"
						: "将移除本次新增的经历。"
				}}</template
				><template v-if="review">{{
					review.revision === 1
						? "将移除本次新建的人物档案。"
						: "人物档案将恢复到本次回顾之前。"
				}}</template
				>保留原始材料。
			</p>
			<form method="post">
				<input type="hidden" name="selection" :value="selection" />
				<button name="action" value="undo">确认撤销</button>
			</form>
		</details>
	</template>
</template>
