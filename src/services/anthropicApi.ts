import { StreamEvent } from './backendApi';

const ANTHROPIC_API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY || '';

/**
 * Synthesize a final answer using Claude Haiku based on all streaming events
 */
export async function synthesizeAnswer(
  query: string,
  events: StreamEvent[]
): Promise<string> {
  if (!ANTHROPIC_API_KEY) {
    console.warn('VITE_ANTHROPIC_API_KEY not configured');
    return '';
  }

  // Extract relevant information from events
  const unstructuredEvent = events.find(e => e.stage === 'unstructured') as any;
  const structuredEvent = events.find(e => e.stage === 'structured') as any;

  const context = buildContextFromEvents(events, unstructuredEvent, structuredEvent);

  const systemPrompt = `You are a helpful assistant that synthesizes search results into clear, concise answers.
Given a user's question and context from multiple sources, provide a comprehensive but concise answer.
Format your response in markdown with clear sections if needed.`;

  const userPrompt = `Question: ${query}

Context from search results:
${context}

Please provide a comprehensive answer based on the context above.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 1024,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: userPrompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Anthropic API error:', error);
      return '';
    }

    const data = (await response.json()) as { content: Array<{ type: string; text: string }> };
    const textContent = data.content.find(c => c.type === 'text');
    return textContent?.text || '';
  } catch (error) {
    console.error('Failed to synthesize answer:', error);
    return '';
  }
}

/**
 * Build context string from all available streaming events
 */
function buildContextFromEvents(
  events: StreamEvent[],
  unstructuredEvent: any,
  structuredEvent: any
): string {
  const sections: string[] = [];

  // Unstructured results
  if (unstructuredEvent?.answer) {
    sections.push(`## Unstructured Search Results\n${unstructuredEvent.answer}`);

    if (unstructuredEvent.sources && Array.isArray(unstructuredEvent.sources)) {
      const topSources = unstructuredEvent.sources.slice(0, 3);
      sections.push(`### Sources\n${topSources
        .map((s: any) => `- ${s.title || s.pdf_file || 'Unknown'}: ${s.text?.substring(0, 100) || ''}...`)
        .join('\n')}`);
    }
  }

  // Structured results
  if (structuredEvent?.answer) {
    sections.push(`## Structured Query Results\n${structuredEvent.answer}`);
  }

  // Data summary from retrieved tables
  const schemaEvent = events.find(e => e.stage === 'schema_retrieved') as any;
  if (schemaEvent?.tables?.length) {
    sections.push(`### Available Datasets\n${schemaEvent.tables
      .map((t: any) => `- **${t.name}**: ${t.description}`)
      .join('\n')}`);
  }

  return sections.join('\n\n') || 'No search results available.';
}
