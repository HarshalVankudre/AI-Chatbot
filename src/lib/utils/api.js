// src/lib/utils/api.js
import { get } from 'svelte/store';
import { chatStore } from '../stores.js';
import { SELECTED_MODEL, uiStrings } from './config.js';
import { createFinalAnswerPrompt } from './prompts.js';

/**
 * A robust, centralized function for making API calls.
 * @param {string} url - The API endpoint to call.
 * @param {object} body - The request body.
 * @returns {Promise<any>} - The JSON response from the API.
 */
async function callApi(url, body) {
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        const result = await response.json();
        if (!response.ok) {
            // Prefer the specific error from the API, otherwise use a generic message
            throw new Error(result.error || `Request failed with status ${response.status}`);
        }
        return result;
    } catch (error) {
        console.error(`API call to ${url} failed:`, error);
        // Re-throw to be caught by the main logic
        throw new Error(`Network error or invalid response from server at ${url}.`);
    }
}

/**
 * Sanitizes the chat history to ensure it's in a format the OpenAI API accepts.
 * Converts non-string content to JSON strings and filters out typing indicators.
 * @param {object[]} history - The conversation history from the store.
 * @returns {object[]} - The sanitized history.
 */
const sanitizeHistoryForApi = (history) => {
    return history
        .filter(msg => msg.type !== 'typing') // Remove typing indicators from history
        .map(msg => {
            let content = ''; // Default to a safe empty string
            if (msg.content === null || msg.content === undefined) {
                content = '';
            } else if (typeof msg.content === 'string') {
                content = msg.content;
            } else {
                // Safely stringify objects, like our structured_response
                content = JSON.stringify(msg.content);
            }
            return { role: msg.role, content };
        });
};


export async function getAIResponse(userQuery) {
    chatStore.update(s => ({ ...s, isModelRunning: true, error: null }));
    chatStore.addMessage('user', userQuery);

    const state = get(chatStore);
    const { dbSchema, conversationHistory, currentLang } = state;
    const strings = uiStrings[currentLang];

    const addTypingIndicator = (textKey) => chatStore.addMessage('assistant', strings[textKey], 'typing');
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
        const intent = intentResult.response.trim().replace(/"/g, '');
        removeTypingIndicator();

        if (intent.includes('general_conversation')) {
            const sanitizedHistory = sanitizeHistoryForApi(conversationHistory.slice(-6));
            const messages = [...sanitizedHistory, { role: 'user', content: userQuery }];
            const generalResult = await callApi('/api/chat', { model: SELECTED_MODEL, messages });
            chatStore.addMessage('assistant', generalResult.response);
            return; // End execution here for general conversation
        }

        if (!dbSchema) {
            throw new Error(strings.dbPrompt);
        }

        addTypingIndicator('sqlGenerating');
        const sanitizedSqlHistory = sanitizeHistoryForApi(conversationHistory.slice(-6, -1)); // Don't include the current user message
        const textToSqlPrompt = `Based on the conversation history and schema, write a single, valid MariaDB/MySQL query for the user's LATEST question. Only return the raw SQL query. Schema: ${dbSchema}\n\nQuestion: "${userQuery}"`;
        const sqlMessages = [{ role: 'system', content: 'You are an expert MariaDB/MySQL programmer.' }, ...sanitizedSqlHistory, { role: 'user', content: textToSqlPrompt }];

        const sqlResult = await callApi('/api/chat', { model: SELECTED_MODEL, messages: sqlMessages });
        let generatedSql = sqlResult.response.replace(/^```sql\n?|```$/g, '').trim();
        removeTypingIndicator();
        chatStore.addMessage('assistant', generatedSql, 'code');

        let queryResultData;
        try {
            addTypingIndicator('sqlExecuting');
            queryResultData = await callApi('/api/db', { query: generatedSql });
        } catch (e) {
            removeTypingIndicator();
            chatStore.addMessage('assistant', strings.sqlCorrection, 'text');
            addTypingIndicator('sqlGenerating'); // Show that AI is thinking again

            const fixSqlPrompt = `The SQL query \`${generatedSql}\` failed with error: "${e.message}". Please correct it based on the schema. Only return the corrected SQL query. Schema: ${dbSchema}`;
            const correctedSqlResult = await callApi('/api/chat', { model: SELECTED_MODEL, messages: [{ role: 'user', content: fixSqlPrompt }] });

            generatedSql = correctedSqlResult.response.replace(/^```sql\n?|```$/g, '').trim();
            removeTypingIndicator();
            chatStore.addMessage('assistant', generatedSql, 'code');

            addTypingIndicator('sqlExecuting');
            queryResultData = await callApi('/api/db', { query: generatedSql });
        }

        removeTypingIndicator();
        addTypingIndicator('finalAnswer');

        const sqlToTextPrompt = createFinalAnswerPrompt(userQuery, queryResultData);
        const finalAnswerResult = await callApi('/api/chat', {
            model: SELECTED_MODEL,
            messages: [{ role: 'user', content: sqlToTextPrompt }],
            json_mode: true
        });

        // The response from a json_mode call is a string that needs parsing
        const aiJson = JSON.parse(finalAnswerResult.response);
        removeTypingIndicator();

        chatStore.addMessage('assistant', aiJson, 'structured_response');

    } catch (error) {
        console.error('Error in AI Response chain:', error);
        removeTypingIndicator();
        // Use the dedicated error handler in the store
        chatStore.setError(`An error occurred: ${error.message}`);
    } finally {
        chatStore.update(s => ({ ...s, isModelRunning: false }));
        localStorage.setItem('chatHistory', JSON.stringify(get(chatStore).conversationHistory));
    }
}