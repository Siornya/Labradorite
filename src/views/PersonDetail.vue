<script setup lang="ts">
import type { readPerson } from "../storage/profiles.js";
defineProps<{ person: NonNullable<ReturnType<typeof readPerson>> }>();
</script>

<template>
	<h1>{{ person.name }}</h1>
	<p>{{ person.identity }}</p>
	<section v-for="r in person.history.toReversed()" :key="r.revision">
		<h2>
			{{
				r.impression === null
					? "关联经历"
					: r.revision === person.current_impression?.revision
						? "当前印象"
						: "以往印象"
			}}
		</h2>
		<small>{{ r.formed_at }}</small>
		<p v-if="r.impression">{{ r.impression }}</p>
		<ul>
			<li v-for="ref in r.episodes" :key="ref.id">
				<a :href="'/episode/' + ref.id + '?rev=' + ref.revision"
					>{{ ref.title }} · 版本 {{ ref.revision }}</a
				>
			</li>
		</ul>
	</section>
</template>
