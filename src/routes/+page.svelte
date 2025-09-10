<script>
	import { onMount, afterUpdate } from 'svelte';
	import { browser } from '$app/environment';
	import { chatStore } from '$lib/stores.js';
	import { uiStrings } from '$lib/utils/config.js';
	import { loadSqlJs, handleDbFileChange } from '$lib/utils/db.js';
	import { getAIResponse, generateAdImage } from '$lib/utils/api.js';
	let marked;
	let DOMPurify;

	// API key logic is no longer needed here
	let userMessage = '';
	let schemaVisible = false;
	let chatContainer;

	// New state for ad generation
	let adPrompt = '';
	let adImages = [];

	onMount(async () => {
		marked = window.marked;
		DOMPurify = window.DOMPurify;

		await loadSqlJs();
        // Removed logic for loading API key from localStorage
        const savedHistory = localStorage.getItem('chatHistory');
        if (savedHistory) {
            chatStore.update(s => ({ ...s, conversationHistory: JSON.parse(savedHistory)}));
        }
	});
	afterUpdate(() => {
		if (chatContainer) {
			chatContainer.scrollTop = chatContainer.scrollHeight;
		}
	});

    // The handleSaveKey function is no longer needed and has been removed.
	async function handleSubmit() {
		// FIX: The check for a database is removed from here.
		// The API logic will handle prompting the user if they try a DB query.
		if (userMessage.trim() && !$chatStore.isModelRunning) {
			const messageToSend = userMessage;
			userMessage = '';
			await getAIResponse(messageToSend);
		}
	}

	async function handleAdSubmit() {
		if (adImages.length === 0) {
			chatStore.addMessage('assistant', 'Please upload at least one product image.');
			return;
		}
		if (adPrompt.trim() && !$chatStore.isModelRunning) {
			const prompt = adPrompt;
			const files = Array.from(adImages);
			adPrompt = '';
			adImages = [];
			await generateAdImage(prompt, files);
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
                <form action="?/logout" method="POST" class="ml-2">
                   <button type="submit" class="px-3 py-1 text-sm font-medium text-red-600 border rounded-md hover:bg-red-50">Logout</button>
                </form>
			</div>
			<div class="absolute top-2 left-2">
				<button on:click={chatStore.clearChat} class="px-3 py-1 text-sm font-medium border rounded-md hover:bg-gray-100">{$chatStore.strings.clearChat}</button>
			</div>
		</div>

		<div class="p-4 border-b border-gray-200 space-y-4">
            <div class="p-4 bg-blue-50 border border-blue-200 rounded-lg">
				<label for="db-file-input" class="block text-sm font-medium text-gray-700 mb-2">Load your database file (.sqlite, .db)</label>
				<input
                    type="file"
                    id="db-file-input"
                    on:change={handleDbFileChange}
                    accept=".sqlite,.db,.sqlite3"
                    class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-100 file:text-blue-700
hover:file:bg-blue-200"
                />
				<div class="flex justify-between items-center">
					<p class="text-xs mt-2 {$chatStore.dbStatus.color}">{$chatStore.dbStatus.text}</p>
					{#if $chatStore.dbSchema}
						<button on:click={() => schemaVisible = !schemaVisible} class="text-xs text-blue-600 hover:underline mt-2">
							{schemaVisible ?
$chatStore.strings.hideSchema : $chatStore.strings.viewSchema}
						</button>
					{/if}
				</div>
				{#if schemaVisible && $chatStore.dbSchema}
					<div class="mt-2 bg-gray-100 p-2 rounded border border-gray-200">
						<pre class="text-xs whitespace-pre-wrap max-h-32 overflow-y-auto">{$chatStore.dbSchema}</pre>
					</div>
				{/if}
			</div>
			<div class="p-4 bg-green-50 border border-green-200 rounded-lg">
				<h3 class="text-sm font-medium text-gray-700 mb-2">Product Ad Generation</h3>
				<div class="space-y-2">
					<textarea bind:value={adPrompt} rows="2" placeholder="Describe the ad you want to create..." class="w-full p-2 border border-gray-300 rounded-md"></textarea>
					<input type="file" bind:files={adImages} multiple accept="image/*" class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-100 file:text-green-700 hover:file:bg-green-200"/>
					<button on:click={handleAdSubmit} disabled={$chatStore.isModelRunning} class="w-full py-2 font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:bg-gray-400">Generate Ad</button>
				</div>
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
					{:else if msg.type === 'image'}
						<img src={msg.content} alt="Generated" class="rounded-lg"/>
					{:else if msg.role ===
'user'}
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
				<input
					type="text"
					bind:value={userMessage}
					class="flex-grow w-full p-3 border border-gray-300 rounded-full"
					autocomplete="off"
					placeholder={$chatStore.db ? $chatStore.strings.inputPlaceholder : $chatStore.strings.inputPlaceholderDisabled}
					disabled={$chatStore.isModelRunning}
				/>
				<button
					type="submit"
					class="bg-blue-600 text-white rounded-full p-3 hover:bg-blue-700 disabled:bg-gray-400 flex items-center justify-center w-12 h-12"
					disabled={$chatStore.isModelRunning}
				>
                    {#if $chatStore.isModelRunning}
                        <svg class="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                   {:else}
					    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                    {/if}
				</button>
			</form>
		</div>
	</div>
</div>