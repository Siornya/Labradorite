<script setup lang="ts">
import type { SettingChange } from "../storage/settings.js";
import SettingForm from "./SettingForm.vue";
defineProps<{
	active: SettingChange[];
	pending: SettingChange[];
	selection: string;
	operation: string;
}>();
</script>

<template>
	<h1>设定</h1>
	<details>
		<summary>新增设定</summary>
		<SettingForm :selection="selection" :operation="operation" />
	</details>
	<h2 v-if="pending.length">待主人确认</h2>
	<p v-for="item in pending" :key="item.version">
		<a :href="'/traits/' + item.version">{{ item.title }}</a>
	</p>
	<p v-if="!active.length">暂无生效的设定。</p>
	<article v-for="item in active" :key="item.id">
		<small
			>{{ item.target === "character" ? "角色" : "当前世界" }} ·
			{{ item.mode === "owner" ? "主人维护" : "允许自主变化" }}</small
		>
		<h2>
			<a :href="'/traits/' + item.version">{{ item.title }}</a>
		</h2>
		<p>{{ item.body }}</p>
	</article>
</template>
