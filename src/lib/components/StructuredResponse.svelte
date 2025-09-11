<script>
	import { browser } from '$app/environment';
	import { marked } from 'marked';
	import DOMPurify from 'dompurify';

	/** @type {{title: string, summary: string, type: 'table' | 'value' | 'nodata', data: any}} */
	export let response;

	function renderMarkdown(markdownText) {
		// DOMPurify only runs in the browser where the 'window' object is available
		if (browser && markdownText) {
			return DOMPurify.sanitize(marked.parse(markdownText));
		}
		return '';
	}
</script>

<div class="space-y-3">
	<h3 class="font-bold text-lg">📊 {response.title}</h3>

	<blockquote>
		💡 {response.summary}
	</blockquote>

	<hr class="my-3"/>

	<h4 class="font-semibold">Detailed Findings:</h4>

	{#if response.type === 'table'}
		<div class="overflow-x-auto">
			<table>
				<thead>
					<tr>
						{#each response.data.columns as column}
							<th>{column}</th>
						{/each}
					</tr>
				</thead>
				<tbody>
					{#each response.data.values as row}
						<tr>
							{#each row as cell}
								<td>{cell}</td>
							{/each}
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{:else if response.type === 'value'}
		<p>{@html renderMarkdown(response.data)}</p>
	{:else if response.type === 'nodata'}
		<p>{response.data}</p>
	{/if}

	<p class="text-sm italic mt-3">
		Let me know if you need more details or have another question!
	</p>
</div>