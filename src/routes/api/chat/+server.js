import { json } from '@sveltejs/kit';
import { OPENAI_API_KEY } from '$env/static/private'; // Securely import the key

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

export async function POST({ request }) {
  const { model, messages } = await request.json();

  if (!model || !messages) {
    return json({ error: 'Missing model or messages in the request body' }, { status: 400 });
  }

  try {
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}` // Use the key from the .env file
      },
      body: JSON.stringify({
        model,
        messages,
        stream: false
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      // Forward the error from OpenAI
      return json({ error: errorData.error.message }, { status: response.status });
    }

    const result = await response.json();
    const aiResponse = result.choices[0].message.content;

    return json({ response: aiResponse });

  } catch (error) {
    return json({ error: 'An internal server error occurred.' }, { status: 500 });
  }
}
