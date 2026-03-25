import axios from 'axios';
import {
  BackendSearchResponse, StreamUnstructuredEvent, StreamStructuredEvent, StreamErrorEvent, StreamDoneEvent,
  ConversationResponse, ListConversationsResponse, GetMessagesResponse,
  IntelligentQueryRequest, IntelligentSearchResponse,
  NewStreamEvent, SSEEventSearching, SSEEventToolCall, SSEEventToolResult,
  SSEEventAnswer, SSEEventAnswerStart, SSEEventAnswerToken, SSEEventAnswerEnd,
  SSEEventThinking, SSEEventDone, SSEEventError, SearchMode,
} from '../types';

const API_KEY = import.meta.env.VITE_BACKEND_API_KEY || '';
const COMPANY_ID = import.meta.env.VITE_BACKEND_COMPANY_ID || 'default-company';
// Always use a relative base so requests route through the Cloudflare proxy (prod)
// or the Vite dev proxy (dev) — never directly to the backend, which would be blocked by CORS.
const BACKEND_URL = '/api/v1';

const apiClient = axios.create({
  baseURL: BACKEND_URL,
  headers: {
    'Content-Type': 'application/json',
    ...(API_KEY && { 'X-API-Key': API_KEY }),
    'X-Company-ID': COMPANY_ID
  }
});

// ─── SSE stream types ────────────────────────────────────────────────────────

export interface StreamEventSchemaRetrieved {
  stage: 'schema_retrieved';
  tables: { name: string; description: string }[];
  table_count: number;
}
export interface StreamEventSqlGenerated {
  stage: 'sql_generated';
  sql: string;
}
export interface StreamEventSqlExecuted {
  stage: 'sql_executed';
  columns: string[];
  rows: unknown[][];
  row_count: number;
}
export interface StreamEventStructured {
  stage: 'structured';
  sql: string;
  columns: string[];
  rows: unknown[][];
  row_count: number;
  answer: string;
  elapsed_ms: number;
}
export interface StreamEventRetrievalDone {
  stage: 'retrieval_done';
  source: string;
  hit_count: number;
}
export interface StreamEventUnstructured {
  stage: 'unstructured';
  answer: string;
  sources: unknown[];
  elapsed_ms: number;
}
export interface StreamEventError {
  stage: 'error';
  source: string;
  detail: string;
}
export interface StreamEventDone {
  stage: 'done';
  total_elapsed_ms: number;
}

export type StreamEvent =
  | StreamEventSchemaRetrieved
  | StreamEventSqlGenerated
  | StreamEventSqlExecuted
  | StreamEventStructured
  | StreamEventRetrievalDone
  | StreamEventUnstructured
  | StreamEventError
  | StreamEventDone;

// ─── Search log types ─────────────────────────────────────────────────────────

export interface SearchLogPayload {
  session_id?: string;
  question: string;
  kurious_answer?: string;
  kurious_latency_ms?: number;
  kurious_routing?: string;
  frontier_answer?: string;
  frontier_model?: string;
  frontier_latency_ms?: number;
  is_correct?: boolean;
  golden_answer?: string;
}

export interface SearchFeedbackPayload {
  kurious_rating?: number;
  kurious_feedback_text?: string;
  frontier_rating?: number;
  frontier_feedback_text?: string;
}

// ─── API client ───────────────────────────────────────────────────────────────

export const backendApi = {
  search: async (query: string, indexName: string): Promise<BackendSearchResponse> => {
    try {
      const response = await apiClient.post(`blended/${indexName}/_search`, {
        question: query
      });
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to search backend API';
      throw new Error(errorMessage);
    }
  },

  /**
   * Stream search via the intelligent/_search/stream SSE endpoint.
   * Parses `data: {...}\n\n` events and calls onEvent for each.
   * Resolves when the `done` event is received or the stream ends.
   */
  searchStream: async (
    query: string,
    onEvent: (event: StreamEvent) => void,
    signal?: AbortSignal
  ): Promise<void> => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Company-ID': COMPANY_ID,
    };
    if (API_KEY) headers['X-API-Key'] = API_KEY;

    const response = await fetch(`${BACKEND_URL}/intelligent/_search/stream`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ query, limit: 20 }),
      signal,
    });

    if (!response.ok) {
      throw new Error(`Stream request failed: ${response.status} ${response.statusText}`);
    }

    if (!response.body) {
      throw new Error('Response body is null');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // SSE events are separated by double newlines
      const parts = buffer.split('\n\n');
      buffer = parts.pop() ?? '';

      for (const part of parts) {
        const line = part.trim();
        if (!line.startsWith('data:')) continue;
        const json = line.slice('data:'.length).trim();
        if (!json) continue;
        try {
          const event = JSON.parse(json) as StreamEvent;
          onEvent(event);
        } catch {
          // Ignore malformed events
        }
      }
    }

    // Flush remaining buffer
    if (buffer.trim().startsWith('data:')) {
      const json = buffer.trim().slice('data:'.length).trim();
      if (json) {
        try {
          onEvent(JSON.parse(json) as StreamEvent);
        } catch {
          // ignore
        }
      }
    }
  },

  createSearchLog: async (payload: SearchLogPayload): Promise<{ id: number }> => {
    try {
      const response = await apiClient.post('search-log', payload);
      return response.data;
    } catch (error: any) {
      console.warn('Failed to create search log:', error.message);
      return { id: -1 };
    }
  },

  submitFeedback: async (logId: number, payload: SearchFeedbackPayload): Promise<void> => {
    console.log('[submitFeedback] logId:', logId, 'payload:', payload);
    if (logId < 0) {
      console.warn('[submitFeedback] skipping — logId is negative');
      return;
    }
    try {
      await apiClient.post(`search-log/${logId}/feedback`, payload);
      console.log('[submitFeedback] success for logId:', logId);
    } catch (error: any) {
      console.warn('[submitFeedback] failed:', error.message);
    }
  },
};

// ─── Conversation API ──────────────────────────────────────────────────────────

export const conversationApi = {
  create: async (mode: SearchMode = 'quick', title?: string): Promise<ConversationResponse> => {
    const response = await apiClient.post('conversations', { mode, ...(title && { title }) });
    return response.data;
  },

  list: async (skip = 0, limit = 20): Promise<ListConversationsResponse> => {
    const response = await apiClient.get('conversations', { params: { skip, limit } });
    return response.data;
  },

  getMessages: async (conversationId: string, skip = 0, limit = 50): Promise<GetMessagesResponse> => {
    const response = await apiClient.get(`conversations/${conversationId}/messages`, {
      params: { skip, limit },
    });
    return response.data;
  },

  delete: async (conversationId: string): Promise<void> => {
    await apiClient.delete(`conversations/${conversationId}`);
  },
};

// ─── New intelligent search (non-streaming) ────────────────────────────────────

export const intelligentSearch = async (
  request: IntelligentQueryRequest
): Promise<IntelligentSearchResponse> => {
  const response = await apiClient.post('intelligent/_search', request);
  return response.data;
};

// ─── New SSE streaming search (updated event shapes) ──────────────────────────

export interface ChatStreamCallbacks {
  onSearching?: (event: SSEEventSearching) => void;
  onToolCall?: (event: SSEEventToolCall) => void;
  onToolResult?: (event: SSEEventToolResult) => void;
  onThinking?: (event: SSEEventThinking) => void;
  onAnswer?: (event: SSEEventAnswer) => void;
  onAnswerStart?: (event: SSEEventAnswerStart) => void;
  onAnswerToken?: (event: SSEEventAnswerToken) => void;
  onAnswerEnd?: (event: SSEEventAnswerEnd) => void;
  onDone: (event: SSEEventDone) => void;
  onError?: (event: SSEEventError) => void;
  onEvent?: (event: NewStreamEvent) => void;
}

export async function chatStreamSearch(
  request: IntelligentQueryRequest,
  callbacks: ChatStreamCallbacks,
  signal?: AbortSignal
): Promise<void> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(API_KEY && { 'X-API-Key': API_KEY }),
    'X-Company-ID': COMPANY_ID,
  };

  const response = await fetch(`${BACKEND_URL}/intelligent/_search/stream`, {
    method: 'POST',
    headers,
    body: JSON.stringify(request),
    signal,
  });

  if (!response.ok) {
    const errorText = await response.text();
    let detail = `HTTP ${response.status}`;
    try { detail = JSON.parse(errorText)?.detail || detail; } catch {}
    throw new Error(detail);
  }

  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    // SSE events are separated by double newlines
    const parts = buffer.split('\n\n');
    buffer = parts.pop() ?? '';

    for (const part of parts) {
      for (const line of part.split('\n')) {
        if (!line.startsWith('data:')) continue;
        const json = line.slice(5).trim();
        if (!json) continue;
        try {
          const event = JSON.parse(json) as NewStreamEvent;
          callbacks.onEvent?.(event);
          switch (event.stage) {
            case 'searching':    callbacks.onSearching?.(event); break;
            case 'tool_call':    callbacks.onToolCall?.(event); break;
            case 'tool_result':  callbacks.onToolResult?.(event); break;
            case 'thinking':     callbacks.onThinking?.(event); break;
            case 'answer':       callbacks.onAnswer?.(event); break;
            case 'answer_start': callbacks.onAnswerStart?.(event); break;
            case 'answer_token': callbacks.onAnswerToken?.(event); break;
            case 'answer_end':   callbacks.onAnswerEnd?.(event); break;
            case 'done':         callbacks.onDone(event); break;
            case 'error':        callbacks.onError?.(event); break;
          }
        } catch {
          // Ignore malformed events
        }
      }
    }
  }

  // Flush remaining buffer
  if (buffer.trim()) {
    for (const line of buffer.split('\n')) {
      if (!line.startsWith('data:')) continue;
      const json = line.slice(5).trim();
      if (!json) continue;
      try {
        const event = JSON.parse(json) as NewStreamEvent;
        callbacks.onEvent?.(event);
        switch (event.stage) {
          case 'searching':    callbacks.onSearching?.(event); break;
          case 'tool_call':    callbacks.onToolCall?.(event); break;
          case 'tool_result':  callbacks.onToolResult?.(event); break;
          case 'thinking':     callbacks.onThinking?.(event); break;
          case 'answer':       callbacks.onAnswer?.(event); break;
          case 'answer_start': callbacks.onAnswerStart?.(event); break;
          case 'answer_token': callbacks.onAnswerToken?.(event); break;
          case 'answer_end':   callbacks.onAnswerEnd?.(event); break;
          case 'done':         callbacks.onDone(event); break;
          case 'error':        callbacks.onError?.(event); break;
        }
      } catch {
        // ignore
      }
    }
  }
}

// ─── Legacy streaming search callbacks ────────────────────────────────────────

export interface StreamSearchCallbacks {
  onUnstructured: (event: StreamUnstructuredEvent) => void;
  onStructured: (event: StreamStructuredEvent) => void;
  onError: (event: StreamErrorEvent) => void;
  onDone: (event: StreamDoneEvent) => void;
  onEvent?: (event: StreamEvent) => void; // Track all events
}

export async function intelligentStreamSearch(
  query: string,
  callbacks: StreamSearchCallbacks,
  signal?: AbortSignal
): Promise<void> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(API_KEY && { 'X-API-Key': API_KEY }),
    'X-Company-ID': COMPANY_ID,
  };

  const response = await fetch(`${BACKEND_URL}/intelligent/_search/stream`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query }),
    signal,
  });

  if (!response.ok) {
    const errorText = await response.text();
    let detail = `HTTP ${response.status}`;
    try { detail = JSON.parse(errorText)?.detail || detail; } catch {}
    throw new Error(detail);
  }

  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      if (!line.startsWith('data:')) continue;
      const json = line.slice(5).trim();
      if (!json) continue;
      const event = JSON.parse(json);

      // Track all events
      callbacks.onEvent?.(event);

      // Dispatch specific callbacks
      switch (event.stage) {
        case 'unstructured': callbacks.onUnstructured(event); break;
        case 'structured': callbacks.onStructured(event); break;
        case 'error': callbacks.onError(event); break;
        case 'done': callbacks.onDone(event); break;
      }
    }
  }
}
