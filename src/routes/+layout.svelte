<script>
	import favicon from '$lib/assets/favicon.svg';
    import { injectAnalytics } from '@vercel/analytics/sveltekit'
        import { injectSpeedInsights } from '@vercel/speed-insights/sveltekit';


	let { children } = $props();
        injectSpeedInsights();

</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{@render children?.()}
