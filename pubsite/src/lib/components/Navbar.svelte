<script lang="ts">
	import { page } from '$app/stores';
	import logo from '$lib/assets/brand.svg';
	import { obj } from '@tsly/obj';

	const paths = {
		'/home': 'Home',
		'/about': 'About',
		'https://app.ticoder.dev': 'App'
	};
</script>

<div class="flex justify-between px-6 pt-4 items-center pb-4">
	<a href="/home">
		<img
			alt="ticoder logo"
			src={logo}
			class="h-10"
		/>
	</a>
	<nav class="flex gap-4">
		{#each obj(paths).keys as key}
			<a class="text-xl text-gray-950" class:active={$page.url.pathname?.endsWith(key)} href={key}
				>{paths[key]}
			</a>
		{/each}
	</nav>
</div>

<style>
	.active {
		@apply decoration-glaucous-500 underline font-semibold underline-offset-4 decoration-4;
	}
</style>
