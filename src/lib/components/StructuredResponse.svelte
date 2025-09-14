<script>
	import { browser } from '$app/environment';
	import { marked } from 'marked';
	import DOMPurify from 'dompurify';

	/** @type {{title: string, summary: string, type: 'table' | 'value' | 'nodata', data: any}} */
	export let response;

	function renderMarkdown(markdownText) {
		if (browser && typeof markdownText === 'string') {
			return DOMPurify.sanitize(marked.parse(markdownText));
		}
		return '';
	}
</script>

<div class="space-y-3">
	<h3 class="font-bold text-lg">📊 {response.title || 'Analysis Result'}</h3>

	{#if response.summary}
	<blockquote class="border-l-4 border-blue-500 pl-4 py-1 italic">
		💡 {response.summary}
	</blockquote>
	{/if}

	<hr class="my-3"/>

	<h4 class="font-semibold">Detailed Findings:</h4>

	{#if response.type === 'table' && response.data?.columns?.length > 0}
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
					{#if response.data.values?.length > 0}
						{#each response.data.values as row}
							<tr>
								{#each row as cell}
									<td>{cell}</td>
								{/each}
							</tr>
						{/each}
					{:else}
						<tr>
							<td colspan={response.data.columns.length} class="text-center italic text-gray-500">
								No rows returned.
							</td>
						</tr>
					{/if}
				</tbody>
			</table>
		</div>
	{:else if response.type === 'value'}
		<div class="prose prose-sm">{@html renderMarkdown(response.data)}</div>
	{:else}
		<p class="italic text-gray-600">{response.data || 'No data was returned for this query.'}</p>
	{/if}
</div>