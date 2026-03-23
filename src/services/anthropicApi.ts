import { StreamEvent } from './backendApi';

const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY || '';

/**
 * Synthesize a final answer based on all streaming events
 */
export async function synthesizeAnswer(
  query: string,
  events: StreamEvent[]
): Promise<string> {
  if (!OPENROUTER_API_KEY) {
    console.warn('VITE_OPENROUTER_API_KEY not configured');
    return '';
  }

  // Extract relevant information from events
  const unstructuredEvent = events.find(e => e.stage === 'unstructured') as any;
  const structuredEvent = events.find(e => e.stage === 'structured') as any;

  const context = buildContextFromEvents(events, unstructuredEvent, structuredEvent);

  const systemPrompt = `You are a helpful assistant that answers questions based on structured data query results.
Given a user's question and structured query results, provide a clear and concise answer.
Format your response in markdown. Do not mention SQL or databases — just answer the question directly.`;

  const userPrompt = `Question: ${query}

Data from search:
${context}

Answer the question based on the data above.`;

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3.5-haiku',
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
      console.error('OpenRouter API error:', error);
      return '';
    }

    const data = (await response.json()) as { choices: Array<{ message: { content: string } }> };
    return data.choices[0]?.message?.content || '';
  } catch (error) {
    console.error('Failed to synthesize answer:', error);
    return '';
  }
}

/**
 * Build context string from all available streaming events
 */
function buildContextFromEvents(
  _events: StreamEvent[],
  _unstructuredEvent: any,
  structuredEvent: any
): string {
  const sections: string[] = [];

  // Primary context: structured query results (this runs when unstructured found nothing useful)
  if (structuredEvent?.answer) {
    sections.push(structuredEvent.answer);
  }

  if (structuredEvent?.columns?.length && structuredEvent?.rows?.length) {
    const header = structuredEvent.columns.join(' | ');
    const divider = structuredEvent.columns.map(() => '---').join(' | ');
    const rows = (structuredEvent.rows as unknown[][])
      .slice(0, 20)
      .map((row: unknown[]) => row.join(' | '))
      .join('\n');
    sections.push(`${header}\n${divider}\n${rows}`);
  }

  return sections.join('\n\n') || 'No structured data available.';
}
