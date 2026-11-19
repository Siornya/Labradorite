<script setup lang="ts">
import type { SettingChange } from "../storage/settings.js";
import { reviewStateLabels } from "./review-state.js";
import SettingForm from "./SettingForm.vue";
const props = defineProps<{
	row: SettingChange;
	before?: SettingChange;
	current?: SettingChange;
	selection: string;
	operation: string;
	world: string;
	evidence: { id: string; revision: number; title?: string }[];
}>();
const isCurrent = props.row.version === props.current?.version;
</script>

<template>
	<a href="/reviews">回顾记录</a> · <a href="/traits">全部设定</a>
	<h1>{{ row.title }}</h1>
	<p>
		{{ row.time }} · {{ row.author === "owner" ? "主人" : "角色回顾" }} ·
		{{ reviewStateLabels[row.state] }}
	</p>
	<template v-if="before"
		><h2>修改前</h2>
		<a :href="'/traits/' + before.version">{{ before.title }}</a>
		<p>{{ before.body }}</p></template
	>
	<h2>{{ before ? "修改后" : "设定内容" }}</h2>
	<p>{{ row.body }}</p>
	<p>
		{{ row.target === "character" ? "角色设定" : "世界设定" }} ·
		{{ row.mode === "owner" ? "主人维护" : "允许自主变化" }}
	</p>
	<template v-if="row.reason && row.world === world"
		><h2>变化理由</h2>
		<p>{{ row.reason }}</p></template
	>
	<template v-if="row.episodes.length">
		<h2>依据的经历</h2>
		<p v-if="row.world !== world">请切换到世界 {{ row.world }} 查看引用的经历。</p>
		<ul v-else>
			<li v-for="ref in evidence" :key="ref.id + ':' + ref.revision">
				<a v-if="ref.title" :href="'/episode/' + ref.id + '?rev=' + ref.revision"
					>{{ ref.title }} · 版本 {{ ref.revision }}</a
				>
				<span v-else>引用的经历已撤下</span>
			</li>
		</ul>
	</template>
	<form v-if="row.state === 'proposed'" method="post">
		<input type="hidden" name="selection" :value="selection" />
		<template v-if="row.base === (current?.version ?? null)">
			<label
				>生效后的修改方式
				<select name="mode">
					<option value="owner">主人维护</option>
					<option value="autonomous">允许自主变化</option>
				</select></label
			>
			<button name="action" value="approve">确认并生效</button>
		</template>
		<p v-else>此提议所依据的设定已更新。</p>
		<button name="action" value="reject">拒绝提议</button>
	</form>
	<form v-if="row.state === 'unreviewed'" method="post">
		<input type="hidden" name="selection" :value="selection" /><button
			name="action"
			value="check"
		>
			标为已审阅
		</button>
	</form>
	<template v-if="isCurrent">
		<details>
			<summary>修改内容或自主权限</summary>
			<SettingForm :current="row" :selection="selection" :operation="operation" />
		</details>
		<details>
			<summary>撤销这条设定变化</summary>
			<p>{{ before ? "恢复上一版设定。" : "这条设定将停止生效。" }}引用的经历会保留。</p>
			<form method="post">
				<input type="hidden" name="selection" :value="selection" /><button
					name="action"
					value="undo"
				>
					确认撤销
				</button>
			</form>
		</details>
	</template>
	<p v-else-if="current"><a :href="'/traits/' + current.version">查看当前生效版本</a></p>
</template>
