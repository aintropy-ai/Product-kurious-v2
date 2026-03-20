import { SearchResponse } from '../types';

const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY || '';
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1/chat/completions';

const callOpenRouter = async (model: string, query: string): Promise<SearchResponse> => {
  if (!OPENROUTER_API_KEY) {
    return {
      answer: 'OpenRouter API key not configured. Add VITE_OPENROUTER_API_KEY to your .env file.'
    };
  }

  try {
    const response = await fetch(OPENROUTER_BASE_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': window.location.origin,
        'X-Title': 'AIntropy Kurious Engine'
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: query }],
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || `API request failed: ${response.status}`);
    }

    const data = await response.json();
    return {
      answer: data.choices[0]?.message?.content || 'No response from model'
    };
  } catch (error: any) {
    console.error(`Error with ${model}:`, error);
    throw new Error(error.message || 'Failed to get response from model');
  }
};

export const frontierApi = {
  searchWithGPT5: (query: string): Promise<SearchResponse> =>
    callOpenRouter('openai/gpt-3.5-turbo', query),

  searchWithGemini3: (query: string): Promise<SearchResponse> =>
    callOpenRouter('google/gemini-3-pro-preview', query),

  searchWithClaude: (query: string): Promise<SearchResponse> =>
    callOpenRouter('anthropic/claude-3.5-sonnet', query),
};
