<script setup lang="ts">
defineProps<{
	requested: string;
	error: string;
	folder?: { path: string; usable: boolean; links: { path: string; label: string }[] };
}>();
</script>

<template>
	<h1>更换目录</h1>
	<form action="/choose">
		<input type="hidden" name="browse" value="1" />
		<input class="directory-path" name="dir" aria-label="目录路径" :value="requested" />
		<button>浏览</button>
	</form>
	<p v-if="error" role="alert">{{ error }}</p>
	<template v-if="folder">
		<a v-if="folder.usable" :href="'/choose?dir=' + encodeURIComponent(folder.path)"
			>使用此目录</a
		>
		<p v-else>此目录没有 runtime.json，请选择记忆库所在的文件夹。</p>
		<section>
			<div v-for="dir in folder.links" :key="dir.path">
				<a :href="'/choose?browse=1&dir=' + encodeURIComponent(dir.path)">{{
					dir.label
				}}</a>
			</div>
		</section>
	</template>
</template>
