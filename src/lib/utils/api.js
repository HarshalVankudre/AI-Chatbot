import { get } from 'svelte/store';
import { chatStore } from '../stores.js';
import { SELECTED_MODEL, uiStrings } from './config.js';

/**
 * A robust helper function to call our server API endpoints.
 * It handles non-JSON responses to prevent crashes.
 */
async function callApi(url, body) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  // Check if the response is JSON before trying to parse it
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.indexOf("application/json") !== -1) {
    const result = await response.json();
    if (!response.ok) {
      throw new Error(`API Error: ${result.error || 'An unknown error occurred'}`);
    }
    return result;
  } else {
    // If it's not JSON, get the raw text for debugging.
    const text = await response.text();
    console.error('Server did not return JSON. Raw response:', text);
    throw new Error(`The server returned an invalid response. Check the browser console for details.`);
  }
}

async function callOpenAI(messages) {
  const result = await callApi('/api/chat', { model: SELECTED_MODEL, messages });
  return result.response;
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
    const intent = await callOpenAI([{ role: 'system', content: intentPrompt }]);
    removeTypingIndicator();

    if (intent.includes('general_conversation')) {
        const generalPrompt = `You are a friendly chatbot. Continue the conversation naturally. User's last message: "${userQuery}"`;
        const messages = [...conversationHistory.slice(-6), { role: 'system', content: generalPrompt }];
        const generalResponse = await callOpenAI(messages);
        chatStore.addMessage('assistant', generalResponse);
        return;
    }

    if (!db) {
        chatStore.addMessage('assistant', uiStrings[currentLang].dbPrompt);
        return;
    }

		addTypingIndicator('sqlGenerating');
		const textToSqlPrompt = `You are an expert SQLite programmer. Based on the conversation history and schema, write a single, valid SQLite query for the user's LATEST question. Only return the SQL query. Schema: ${dbSchema} Question: "${userQuery}"`;
		const sqlMessages = [{ role: 'system', content: 'An expert SQLite programmer.' }, ...conversationHistory.slice(-6, -1), { role: 'user', content: textToSqlPrompt }];

		const sqlResponse = await callOpenAI(sqlMessages);
		let generatedSql = sqlResponse.replace(/^```sql\n?|```$/g, '').trim();
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

			const correctedSqlResponse = await callOpenAI(fixMessages);
			generatedSql = correctedSqlResponse.replace(/^```sql\n?|```$/g, '').trim();
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

		const sqlToTextPrompt = `You are a helpful AI data analyst. Based on the user's question and the query data, provide a friendly, natural language answer.
        
        **Formatting Rules (Very Important):**
        1.  **Single Value Rule:** If the data is a single value (e.g., one number, one name), respond in a simple sentence. **DO NOT USE A TABLE FOR A SINGLE VALUE.**
        2.  **Multiple Rows Rule:** If the data contains multiple rows/records, you MUST format the result as a markdown table.
        
        User's Question: "${userQuery}"
        Data from query: ${JSON.stringify(queryResultData)}`;
		const finalAnswerMessages = [{ role: 'system', content: 'You are a helpful data analyst assistant.' }, ...get(chatStore).conversationHistory.slice(-6), { role: 'user', content: sqlToTextPrompt }];

		const aiText = await callOpenAI(finalAnswerMessages);
		removeTypingIndicator();
		chatStore.addMessage('assistant', aiText);

	} catch (error) {
		console.error('Error in AI Response chain:', error);
		removeTypingIndicator();
		chatStore.addMessage('assistant', `Error: ${error.message}`);
	} finally {
		chatStore.update(s => ({ ...s, isModelRunning: false }));
    localStorage.setItem('chatHistory', JSON.stringify(get(chatStore).conversationHistory));
	}
}