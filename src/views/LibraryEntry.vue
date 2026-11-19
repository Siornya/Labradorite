<script setup lang="ts">
defineProps<{ query: string; directory: string }>();
</script>

<template>
	<div class="library-entry">
		<form method="post" :action="'/select?' + query"><button>打开记忆库</button></form>
		<div class="entry-directory">
			<span :title="directory">当前目录：{{ directory }}</span>
			<a :href="'/choose?browse=1&dir=' + encodeURIComponent(directory)">更换目录</a>
		</div>
	</div>
</template>
