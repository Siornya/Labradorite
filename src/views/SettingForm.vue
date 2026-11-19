<script setup lang="ts">
import type { SettingChange } from "../storage/settings.js";
defineProps<{ current?: SettingChange; selection: string; operation: string }>();
</script>

<template>
	<form class="settings trait-form" method="post" action="/traits">
		<input type="hidden" name="action" value="save" />
		<input type="hidden" name="selection" :value="selection" />
		<input type="hidden" name="operation" :value="operation" />
		<template v-if="current">
			<input type="hidden" name="id" :value="current.id" />
			<input type="hidden" name="version" :value="current.version" />
			<input type="hidden" name="target" :value="current.target" />
		</template>
		<label v-else
			>适用范围
			<select name="target">
				<option value="character">角色</option>
				<option value="world">当前世界</option>
			</select></label
		>
		<label>标题 <input required name="title" maxlength="128" :value="current?.title" /></label>
		<label
			>设定内容
			<textarea
				required
				name="body"
				rows="4"
				maxlength="4096"
				:value="current?.body"
			></textarea>
		</label>
		<label
			>修改方式
			<select name="mode">
				<option value="owner" :selected="current?.mode !== 'autonomous'">主人维护</option>
				<option value="autonomous" :selected="current?.mode === 'autonomous'">
					允许自主变化
				</option>
			</select></label
		>
		<button>保存设定</button>
	</form>
</template>
