// src/routes/api/chat/+server.js
import { json } from '@sveltejs/kit';
import { OPENAI_API_KEY } from '$env/static/private';

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

export async function POST({ request }) {
  // Look for the new 'json_mode' flag in the request
  const { model, messages, json_mode = false } = await request.json();

  if (!model || !messages) {
    return json({ error: 'Missing model or messages in the request body' }, { status: 400 });
  }

  // Prepare the base request body for OpenAI
  const openAIBody = {
    model,
    messages,
    stream: false
  };

  // If the client requested JSON mode, add the required parameter
  if (json_mode) {
    openAIBody.response_format = { type: 'json_object' };
  }

  try {
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify(openAIBody) // Send the configured body
    });

    if (!response.ok) {
      const errorData = await response.json();
      return json({ error: errorData.error.message }, { status: response.status });
    }

    const result = await response.json();
    // Get the raw content string from OpenAI's response
    const aiResponse = result.choices[0].message.content;

    // Send the raw string back to the client
    return json({ response: aiResponse });

  } catch (error) {
    return json({ error: 'An internal server error occurred.' }, { status: 500 });
  }
}