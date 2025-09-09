<script>
	import { onMount, afterUpdate } from 'svelte';
	import { browser } from '$app/environment';
	import { chatStore } from '$lib/stores.js';
	import { uiStrings } from '$lib/utils/config.js';
	import { loadSqlJs, handleDbFileChange } from '$lib/utils/db.js';
	import { getAIResponse } from '$lib/utils/api.js';

	// Define variables to hold the global libraries
	let marked;
	let DOMPurify;

	let apiKeyInput = '';
	let userMessage = '';
	let schemaVisible = false;
	let chatContainer;

	onMount(async () => {
		// Assign the global libraries to our variables
		marked = window.marked;
		DOMPurify = window.DOMPurify;

		await loadSqlJs();
		const savedKey = localStorage.getItem('openaiApiKey');
		if (savedKey) {
			apiKeyInput = savedKey;
			chatStore.update(s => ({ ...s, apiKey: savedKey }));
		}
        const savedHistory = localStorage.getItem('chatHistory');
        if (savedHistory) {
            chatStore.update(s => ({ ...s, conversationHistory: JSON.parse(savedHistory)}));
        }
	});

	// This ensures the chat window always scrolls to the bottom
	afterUpdate(() => {
		if (chatContainer) {
			chatContainer.scrollTop = chatContainer.scrollHeight;
		}
	});

	function handleSaveKey() {
		if (apiKeyInput.trim()) {
			chatStore.update(s => ({ ...s, apiKey: apiKeyInput.trim() }));
			localStorage.setItem('openaiApiKey', apiKeyInput.trim());
			chatStore.addMessage('assistant', $chatStore.strings.keySaved); // FIX
		} else {
			chatStore.addMessage('assistant', $chatStore.strings.keyMissing); // FIX
		}
	}

	async function handleSubmit() {
		if (!$chatStore.apiKey) {
			chatStore.addMessage('assistant', $chatStore.strings.keyMissing); // FIX
			return;
		}
		if (!$chatStore.db) {
			chatStore.addMessage('assistant', $chatStore.strings.dbPrompt); // FIX
			return;
		}
		if (userMessage.trim() && !$chatStore.isModelRunning) {
			const messageToSend = userMessage;
			userMessage = '';
			await getAIResponse(messageToSend);
		}
	}

	function handleCopy(text, event) {
		navigator.clipboard.writeText(text);
        const btn = event.currentTarget;
        const originalText = btn.textContent;
        btn.textContent = $chatStore.strings.copied;
        setTimeout(() => {
            btn.textContent = originalText;
        }, 1500);
	}

	// This is a reactive statement. It re-calculates automatically when the language changes.
	$: $chatStore.strings = uiStrings[$chatStore.currentLang];
</script>

<svelte:head>
    <title>{$chatStore.strings.title}</title>
</svelte:head>

<div class="flex flex-col items-center justify-center min-h-screen p-4">
	<div class="w-full max-w-2xl mx-auto bg-white rounded-2xl shadow-xl flex flex-col h-[90vh]">
		<div class="p-4 border-b border-gray-200 text-center rounded-t-2xl bg-gray-50 relative">
			<h1 class="text-xl font-bold text-gray-800">{$chatStore.strings.title}</h1>
			<p class="text-sm text-gray-500">{$chatStore.strings.subtitle}</p>
			<div class="absolute top-2 right-2 flex space-x-1">
				<button on:click={() => chatStore.setLanguage('en')} class="lang-btn px-3 py-1 text-sm font-medium border rounded-md" class:active={$chatStore.currentLang === 'en'}>EN</button>
				<button on:click={() => chatStore.setLanguage('de')} class="lang-btn px-3 py-1 text-sm font-medium border rounded-md" class:active={$chatStore.currentLang === 'de'}>DE</button>
			</div>
			<div class="absolute top-2 left-2">
				<button on:click={chatStore.clearChat} class="px-3 py-1 text-sm font-medium border rounded-md hover:bg-gray-100">{$chatStore.strings.clearChat}</button>
			</div>
		</div>

		<div class="p-4 border-b border-gray-200 space-y-4">
			<div class="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
				<label for="api-key" class="block text-sm font-medium text-gray-700 mb-1">{$chatStore.strings.apiLabel}</label>
				<div class="flex items-center space-x-2">
					<input type="password" id="api-key" bind:value={apiKeyInput} placeholder="Your API key (sk-...)" class="flex-grow p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
					<button on:click={handleSaveKey} class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">{$chatStore.strings.save}</button>
				</div>
			</div>
			<div class="p-4 bg-blue-50 border border-blue-200 rounded-lg">
				<label for="db-file-input" class="block text-sm font-medium text-gray-700 mb-2">{$chatStore.strings.dbLabel}</label>
				<input type="file" id="db-file-input" on:change={handleDbFileChange} accept=".sqlite,.db,.sqlite3" class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200 disabled:opacity-50" disabled={!$chatStore.apiKey} />
				<div class="flex justify-between items-center">
					<p class="text-xs mt-2 {$chatStore.dbStatus.color}">{$chatStore.dbStatus.text}</p>
					{#if $chatStore.dbSchema}
						<button on:click={() => schemaVisible = !schemaVisible} class="text-xs text-blue-600 hover:underline mt-2">
							{schemaVisible ? $chatStore.strings.hideSchema : $chatStore.strings.viewSchema}
						</button>
					{/if}
				</div>
				{#if schemaVisible && $chatStore.dbSchema}
					<div class="mt-2 bg-gray-100 p-2 rounded border border-gray-200">
						<pre class="text-xs whitespace-pre-wrap max-h-32 overflow-y-auto">{$chatStore.dbSchema}</pre>
					</div>
				{/if}
			</div>
		</div>

		<div bind:this={chatContainer} class="flex-grow p-4 overflow-y-auto flex flex-col space-y-4">
			{#each $chatStore.conversationHistory as msg, i (i)}
				<div class="chat-bubble" class:user-bubble={msg.role === 'user'} class:assistant-bubble={msg.role ==='assistant'} class:code-bubble={msg.type === 'code'}>
                    {#if msg.type === 'typing'}
                        <div class="typing-indicator"><span></span><span></span><span></span></div>
					{:else if msg.type === 'code'}
						<button class="copy-btn" on:click={(e) => handleCopy(msg.content, e)}>{$chatStore.strings.copy}</button>
						<pre><code>{msg.content}</code></pre>
					{:else if msg.role === 'user'}
						{msg.content}
					{:else}
						{#if browser && marked && DOMPurify}
							{@html DOMPurify.sanitize(marked.parse(msg.content))}
						{/if}
					{/if}
				</div>
			{/each}
		</div>

		<div class="p-4 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
			<form on:submit|preventDefault={handleSubmit} class="flex items-center space-x-3">
				<input type="text" bind:value={userMessage} class="flex-grow w-full p-3 border border-gray-300 rounded-full" autocomplete="off" placeholder={$chatStore.db ? $chatStore.strings.inputPlaceholder : $chatStore.strings.inputPlaceholderDisabled} disabled={!$chatStore.db || $chatStore.isModelRunning} />
				<button type="submit" class="bg-blue-600 text-white rounded-full p-3 hover:bg-blue-700 disabled:bg-gray-400 flex items-center justify-center w-12 h-12" disabled={!$chatStore.db || $chatStore.isModelRunning}>
                    {#if $chatStore.isModelRunning}
                        <svg class="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    {:else}
					    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                    {/if}
				</button>
			</form>
		</div>
	</div>
</div>