<script>
	import { GithubIcon } from "lucide-svelte/icons";
</script>

<footer class="bg-glaucous flex justify-between p-4">
	<div class="flex flex-col my-auto">
		<span class="text-lavendar font-semibold font-display text-xl">TiCoder</span>
		<a href="https://holewinski.dev" class="-mt-1 text-sm">with ♥︎ by <span class="underline">@erwijet</span></a>
	</div>

	<div class="flex flex-col">
		<div class="flex item-center gap-1 my-auto hover:underline">
			<GithubIcon size={16} class="my-auto" />
			<a href="https://github.com/erwijet/ticoder">Source</a>
		</div>
	</div>
</footer>
