import { json } from '@sveltejs/kit';
import { OPENAI_API_KEY } from '$env/static/private';

const OPENAI_IMAGE_API_URL = 'https://api.openai.com/v1/images/generations';

export async function POST({ request }) {
  const { model, prompt } = await request.json();

  if (!OPENAI_API_KEY) {
    console.error('OpenAI API key is not set in the environment variables.');
    return json({ error: 'Server configuration error: The API key is missing.' }, { status: 500 });
  }

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
      body: JSON.stringify({
        model,
        prompt,
        n: 1,
        size: "1024x1024"
      })
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('OpenAI API error:', result);
      const errorMessage = result.error ? result.error.message : 'An unknown error occurred with the OpenAI API.';
      return json({ error: errorMessage }, { status: response.status });
    }

    const imageUrl = result.data[0].url;

    return json({ imageUrl });

  } catch (error) {
    console.error('An unexpected error occurred in the image generation endpoint:', error);

    // Specifically handle timeout errors
    if (error.cause && error.cause.code === 'UND_ERR_CONNECT_TIMEOUT') {
        return json({ error: 'Connection to OpenAI timed out. Please check your network or try again later.' }, { status: 504 }); // 504 Gateway Timeout
    }

    return json({ error: 'An internal server error occurred.' }, { status: 500 });
  }
}