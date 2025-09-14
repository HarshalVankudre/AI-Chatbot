// src/routes/api/chat/+server.js
import { json } from '@sveltejs/kit';
import { OPENAI_API_KEY } from '$env/static/private';

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

export async function POST({ request }) {
    if (!OPENAI_API_KEY) {
        return json({ error: 'Server configuration error: OpenAI API key is missing.' }, { status: 500 });
    }

    const { model, messages, json_mode = false } = await request.json();

    if (!model || !messages) {
        return json({ error: 'Missing model or messages in the request body' }, { status: 400 });
    }

    const openAIBody = {
        model,
        messages,
        stream: false,
        ...(json_mode && { response_format: { type: 'json_object' } })
    };

    try {
        const response = await fetch(OPENAI_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify(openAIBody)
        });

        const result = await response.json();

        if (!response.ok) {
            const errorMsg = result.error ? result.error.message : 'An unknown error occurred with the OpenAI API.';
            console.error('OpenAI API error:', result);
            return json({ error: errorMsg }, { status: response.status });
        }

        // QOL FIX: Ensure content is always a string, defaulting to empty if null/undefined.
        const aiResponse = result.choices[0]?.message?.content || '';

        return json({ response: aiResponse });

    } catch (error) {
        console.error('An unexpected error occurred in the chat endpoint:', error);
        return json({ error: 'An internal server error occurred while contacting the AI model.' }, { status: 500 });
    }
}