// src/routes/api/image/+server.js
import { json } from '@sveltejs/kit';
import { OPENAI_API_KEY } from '$env/static/private';

const OPENAI_IMAGE_API_URL = 'https://api.openai.com/v1/images/generations';

export async function POST({ request }) {
    if (!OPENAI_API_KEY) {
        return json({ error: 'Server configuration error: OpenAI API key is missing.' }, { status: 500 });
    }

    const { model, prompt } = await request.json();

    if (!model || !prompt) {
        return json({ error: 'Missing model or prompt in the request body' }, { status: 400 });
    }

    try {
        const response = await fetch(OPENAI_IMAGE_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify({ model, prompt, n: 1, size: "1024x1024" })
        });

        const result = await response.json();

        if (!response.ok) {
            const errorMsg = result.error ? result.error.message : 'An unknown error occurred with the OpenAI API.';
            console.error('OpenAI API error:', result);
            return json({ error: errorMsg }, { status: response.status });
        }

        const imageUrl = result.data[0]?.url;
        if (!imageUrl) {
            return json({ error: 'Image URL was not found in the API response.' }, { status: 500 });
        }

        return json({ imageUrl });

    } catch (error) {
        console.error('An unexpected error occurred in the image generation endpoint:', error);
        return json({ error: 'An internal server error occurred during image generation.' }, { status: 500 });
    }
}