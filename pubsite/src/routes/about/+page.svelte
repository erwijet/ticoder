<script>
	import SvelteMarkdown from 'svelte-markdown';
	import source from 'src/routes/about/content.md?raw';
</script>

<div class="markdown container mx-auto">
	<SvelteMarkdown {source} />
</div>