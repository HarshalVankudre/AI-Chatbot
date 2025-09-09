import { get } from 'svelte/store';
import { chatStore } from '../stores.js';
import { SELECTED_MODEL, uiStrings } from './config.js';

async function callOpenAI(messages, apiKey) {
	const response = await fetch('https://api.openai.com/v1/chat/completions', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
		body: JSON.stringify({ model: SELECTED_MODEL, messages, stream: false })
	});
	if (!response.ok) {
		const errorData = await response.json();
		throw new Error(`OpenAI API Error: ${errorData.error.message || 'Unknown error'}`);
	}
	const result = await response.json();
	return result.choices[0].message.content;
}

/**
 * NEW: Classifies the user's intent.
 */
async function classifyIntent(userQuery, apiKey) {
    const prompt = `You are an intent classification system. Determine if the user's query is a request for data from their database or general conversation.
    User's query: "${userQuery}"
    Classify the intent as either "database_query" or "general_conversation". Return ONLY the classification string.`;

    const messages = [{ role: 'system', content: prompt }];
    const classification = await callOpenAI(messages, apiKey);
    return classification.trim().toLowerCase();
}

/**
 * Main function to handle the entire AI response flow.
 */
export async function getAIResponse(userQuery) {
	chatStore.update(s => ({ ...s, isModelRunning: true }));
	chatStore.addMessage('user', userQuery);

	const state = get(chatStore);
	const { apiKey, db, dbSchema, conversationHistory, currentLang } = state;

	const addTypingIndicator = (textKey) => chatStore.addMessage('assistant', uiStrings[currentLang][textKey], 'typing');
	const removeTypingIndicator = () => {
		chatStore.update(s => ({
			...s,
			conversationHistory: s.conversationHistory.filter(msg => msg.type !== 'typing')
		}));
	};

	try {
        addTypingIndicator('intentClassification');
        const intent = await classifyIntent(userQuery, apiKey);
        removeTypingIndicator();

        // If the intent is general conversation, bypass database logic
        if (intent.includes('general_conversation')) {
            const generalPrompt = `You are a friendly and helpful chatbot assistant. The user is making small talk. Continue the conversation naturally. User's last message: "${userQuery}"`;
            const messages = [...conversationHistory.slice(-6), { role: 'system', content: generalPrompt }];
            const generalResponse = await callOpenAI(messages, apiKey);
            chatStore.addMessage('assistant', generalResponse);
            return; // End the function here
        }

        // --- Database Query Logic ---
        if (!db) {
            chatStore.addMessage('assistant', uiStrings[currentLang].dbPrompt);
            return;
        }

		addTypingIndicator('sqlGenerating');
		const textToSqlPrompt = `You are an expert SQLite programmer. Based on the conversation history and schema, write a single, valid SQLite query for the user's LATEST question. Only return the SQL query. Schema: ${dbSchema} Question: "${userQuery}"`;
		const sqlMessages = [{ role: 'system', content: 'You are an expert SQLite programmer.' }, ...conversationHistory.slice(-6, -1), { role: 'user', content: textToSqlPrompt }];

		const sqlResponse = await callOpenAI(sqlMessages, apiKey);
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

			const fixSqlPrompt = `The SQLite query \`${generatedSql}\` failed with error: "${e.message}". Please correct it based on the schema. Only return the corrected SQL query.`;
			const fixMessages = [{ role: 'system', content: 'You are an expert SQLite programmer that corrects faulty queries.' }, { role: 'user', content: fixSqlPrompt }];

			const correctedSqlResponse = await callOpenAI(fixMessages, apiKey);
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

        // NEW: Improved prompt for smarter formatting
		const sqlToTextPrompt = `You are a helpful AI data analyst. Based on the user's question and the query data, provide a friendly, natural language answer.
        
        **Formatting Rules (Very Important):**
        1.  **Check the Data:** Look at the query result first.
        2.  **Single Value Rule:** If the data is a single value (e.g., one number, one name, one date, a total), respond in a simple sentence. **DO NOT USE A TABLE FOR A SINGLE VALUE.** For example, "The total number of employees is 56." or "The highest salary belongs to King."
        3.  **Multiple Rows Rule:** If the data contains multiple rows/records (e.g., a list of employees, products), you MUST format the result as a markdown table.
        
        User's Question: "${userQuery}"
        Data from query: ${JSON.stringify(queryResultData)}`;
		const finalAnswerMessages = [{ role: 'system', content: 'You are a helpful data analyst assistant.' }, ...get(chatStore).conversationHistory.slice(-6), { role: 'user', content: sqlToTextPrompt }];

		const aiText = await callOpenAI(finalAnswerMessages, apiKey);
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