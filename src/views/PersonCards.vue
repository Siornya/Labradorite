<script setup lang="ts">
import type { findPeople } from "../storage/profiles.js";
defineProps<{ people: ReturnType<typeof findPeople>["items"] }>();
</script>

<template>
	<article v-for="person in people" :key="person.id">
		<h2>
			<a :href="'/person/' + encodeURIComponent(person.id)">{{ person.name }}</a>
		</h2>
		<p>{{ person.identity }}</p>
	</article>
</template>
