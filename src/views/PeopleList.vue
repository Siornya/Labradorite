<script setup lang="ts">
import PersonCards from "./PersonCards.vue";
import type { findPeople } from "../storage/profiles.js";
defineProps<{ q: string; people: ReturnType<typeof findPeople>["items"]; next: string | null }>();
</script>

<template>
	<h1>人物档案</h1>
	<form>
		<input type="hidden" name="tab" value="people" />
		<input name="q" aria-label="姓名或身份线索" placeholder="姓名或身份线索" :value="q" />
		<button>筛选</button>
	</form>
	<PersonCards :people="people" />
	<p v-if="!people.length">没有符合条件的人物档案。</p>
	<a
		v-if="next"
		:href="'/?tab=people&q=' + encodeURIComponent(q) + '&after=' + encodeURIComponent(next)"
		>下一页</a
	>
</template>
