<script setup lang="ts">
defineProps<{
	tab: string | null;
	managed: boolean;
	standaloneNotice: string;
	links: [string, string, string][];
}>();
</script>

<template>
	<html lang="zh-CN">
		<head>
			<meta charset="utf-8" />
			<meta name="viewport" content="width=device-width,initial-scale=1" />
			<title>Labradorite · 记忆库</title>
			<link rel="stylesheet" href="/viewer.css" />
		</head>
		<body>
			<header>
				<strong>Labradorite</strong>
				<nav v-if="tab">
					<a
						v-for="[key, label, href] in links"
						:key="key"
						:href="href"
						:aria-current="key === tab ? 'page' : undefined"
						>{{ label }}</a
					>
					<a href="/choose">切换记忆库</a>
				</nav>
			</header>
			<main>
				<template v-if="tab">
					<p v-if="!managed" role="status">{{ standaloneNotice }}</p>
					<form action="/search">
						<input
							type="search"
							name="q"
							aria-label="搜索整个记忆库"
							maxlength="512"
							placeholder="搜索经历、人物、材料和相册"
							required
						/>
						<select name="mode" aria-label="检索方式">
							<option v-if="managed" value="hybrid">混合检索</option>
							<option value="lexical">仅本地全文</option>
						</select>
						<button>全库搜索</button>
					</form>
				</template>
				<slot />
			</main>
		</body>
	</html>
</template>
