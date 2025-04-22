<script>
	import 'src/app.css';

	import Footer from 'src/lib/components/Footer.svelte';
	import Navbar from 'src/lib/components/Navbar.svelte';
</script>

<div class="flex flex-col justify-between min-h-screen">
	<Navbar />
	<slot />
	<Footer />
</div>
