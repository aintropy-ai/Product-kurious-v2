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

const MODEL_IDS: Record<string, string> = {
  gpt4omini: 'openai/gpt-4o-mini',
  gpt4o: 'openai/gpt-4o',
  gemini2flash: 'google/gemini-3-pro-preview',
  gemini15pro: 'google/gemini-pro-1.5',
  claude: 'anthropic/claude-3.5-sonnet',
  claude3haiku: 'anthropic/claude-3-haiku',
  llama70b: 'meta-llama/llama-3.1-70b-instruct',
};

export const frontierApi = {
  search: (apiValue: string, query: string): Promise<SearchResponse> => {
    const modelId = MODEL_IDS[apiValue];
    if (!modelId) throw new Error(`Unknown model: ${apiValue}`);
    return callOpenRouter(modelId, query);
  },
};
