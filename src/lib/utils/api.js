// src/lib/utils/api.js
import { get } from 'svelte/store';
import { chatStore } from '../stores.js';
import { SELECTED_MODEL, uiStrings } from './config.js';
import { createFinalAnswerPrompt } from './prompts.js';

async function callApi(url, body) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  const contentType = response.headers.get("content-type");
  if (contentType && contentType.indexOf("application/json") !== -1) {
    const result = await response.json();
    if (!response.ok) {
      throw new Error(`API Error: ${result.error || 'An unknown error occurred'}`);
    }
    return result;
  } else {
    const text = await response.text();
    console.error('Server did not return JSON. Raw response:', text);
    throw new Error(`The server returned an invalid response. Check the browser console for details.`);
  }
}

async function callOpenAIImage(prompt) {
  const result = await callApi('/api/image', { model: 'dall-e-3', prompt });
  return result.imageUrl;
}

export async function getAIResponse(userQuery) {
	chatStore.update(s => ({ ...s, isModelRunning: true }));
	chatStore.addMessage('user', userQuery);

    if (userQuery.toLowerCase().startsWith('generate image of')) {
        const prompt = userQuery.substring('generate image of'.length).trim();
        try {
            chatStore.addMessage('assistant', 'Generating image...', 'typing');
            const imageUrl = await callOpenAIImage(prompt);
            chatStore.update(s => ({...s, conversationHistory: s.conversationHistory.filter(msg => msg.type !== 'typing')}));
            chatStore.addMessage('assistant', imageUrl, 'image');
        } catch (error) {
            console.error('Error in AI Image Response chain:', error);
            chatStore.update(s => ({...s, conversationHistory: s.conversationHistory.filter(msg => msg.type !== 'typing')}));
            chatStore.addMessage('assistant', `Error: ${error.message}`);
        } finally {
            chatStore.update(s => ({ ...s, isModelRunning: false }));
        }
        return;
    }

	const state = get(chatStore);
	const { db, dbSchema, conversationHistory, currentLang } = state;

	const addTypingIndicator = (textKey) => chatStore.addMessage('assistant', uiStrings[currentLang][textKey], 'typing');
	const removeTypingIndicator = () => {
		chatStore.update(s => ({
			...s,
			conversationHistory: s.conversationHistory.filter(msg => msg.type !== 'typing')
		}));
	};

	try {
		addTypingIndicator('intentClassification');
		const intentPrompt = `Classify the user's query as "database_query" or "general_conversation". User's query: "${userQuery}"`;
		const intentResult = await callApi('/api/chat', { model: SELECTED_MODEL, messages: [{ role: 'system', content: intentPrompt }] });
		const intent = intentResult.response.replace(/"/g, '').trim();
		removeTypingIndicator();

		if (intent.includes('general_conversation')) {
			const generalPrompt = `You are a friendly chatbot. Continue the conversation naturally. User's last message: "${userQuery}"`;
			const messages = [...conversationHistory.slice(-6), { role: 'system', content: generalPrompt }];
			const generalResult = await callApi('/api/chat', { model: SELECTED_MODEL, messages });
			chatStore.addMessage('assistant', generalResult.response);
			return;
		}

		if (!db) {
			chatStore.addMessage('assistant', uiStrings[currentLang].dbPrompt);
			return;
		}

		addTypingIndicator('sqlGenerating');
		const textToSqlPrompt = `You are an expert SQLite programmer. Based on the conversation history and schema, write a single, valid SQLite query for the user's LATEST question. Only return the SQL query. Schema: ${dbSchema} Question: "${userQuery}"`;
		const sqlMessages = [{ role: 'system', content: 'An expert SQLite programmer.' }, ...conversationHistory.slice(-6, -1), { role: 'user', content: textToSqlPrompt }];
		const sqlResult = await callApi('/api/chat', { model: SELECTED_MODEL, messages: sqlMessages });
		let generatedSql = sqlResult.response.replace(/^```sql\n?|```$/g, '').trim();
		removeTypingIndicator();
		chatStore.addMessage('assistant', generatedSql, 'code');

		let queryResultData;
		try {
			addTypingIndicator('sqlExecuting');
			const results = db.exec(generatedSql);
			queryResultData = results.length > 0 ? results.map(r => ({ columns: r.columns, values: r.values })) : 'Query executed successfully, but returned no data.';
		} catch (e) {
			removeTypingIndicator();
			chatStore.addMessage('assistant', uiStrings[currentLang].sqlCorrection, 'text');

			const fixSqlPrompt = `The SQLite query \`${generatedSql}\` failed with error: "${e.message}". Please correct it. Only return the corrected SQL query.`;
			const fixMessages = [{ role: 'system', content: 'You are an expert SQLite programmer that corrects faulty queries.' }, { role: 'user', content: fixSqlPrompt }];
			const correctedSqlResult = await callApi('/api/chat', { model: SELECTED_MODEL, messages: fixMessages });
			generatedSql = correctedSqlResult.response.replace(/^```sql\n?|```$/g, '').trim();
			chatStore.addMessage('assistant', generatedSql, 'code');

			try {
				const results = db.exec(generatedSql);
				queryResultData = results.length > 0 ? results.map(r => ({ columns: r.columns, values: r.values })) : "Query executed successfully, but returned no data.";
			} catch (finalError) {
				 throw new Error(uiStrings[currentLang].sqlCorrectionFailed(generatedSql));
			}
		}

		removeTypingIndicator();
		addTypingIndicator('finalAnswer');

		const sqlToTextPrompt = createFinalAnswerPrompt(userQuery, queryResultData);
		const finalAnswerMessages = [{ role: 'system', content: "You are a helpful data analyst assistant that only responds in JSON." }, { role: 'user', content: sqlToTextPrompt }];

		// Send the json_mode flag for this specific call
		const finalAnswerResult = await callApi('/api/chat', {
			model: SELECTED_MODEL,
			messages: finalAnswerMessages,
			json_mode: true
		});

		// The client is now responsible for parsing the JSON string
		const aiJson = JSON.parse(finalAnswerResult.response);
		removeTypingIndicator();

		chatStore.addMessage('assistant', aiJson, 'structured_response');

	} catch (error) {
		console.error('Error in AI Response chain:', error);
		removeTypingIndicator();
		chatStore.addMessage('assistant', `Error: ${error.message}`);
	} finally {
		chatStore.update(s => ({ ...s, isModelRunning: false }));
		localStorage.setItem('chatHistory', JSON.stringify(get(chatStore).conversationHistory));
	}
}