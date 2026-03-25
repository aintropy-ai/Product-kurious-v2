export interface SearchResponse {
  answer: string;
  sources?: string[];
  context?: string;
}

export interface StreamSource {
  title?: string;
  h1?: string;
  h2?: string;
  h3?: string;
  text?: string;
  url?: string;
  source?: string;
  source_parent?: string;
  catalog_metadata?: string;
}

export interface StreamUnstructuredEvent {
  stage: 'unstructured';
  answer: string;
  sources: StreamSource[];
  elapsed_ms: number;
}

export interface StreamStructuredEvent {
  stage: 'structured';
  sql: string;
  columns: string[];
  rows: unknown[][];
  row_count: number;
  elapsed_ms: number;
}

export interface StreamErrorEvent {
  stage: 'error';
  source: string;
  detail: string;
}

export interface StreamDoneEvent {
  stage: 'done';
  total_elapsed_ms: number;
}

// ─── Chat / Conversation types (new API) ──────────────────────────────────────

export type SearchMode = 'quick' | 'deep_think';
export type ResponseFormat = 'text' | 'table' | 'bullets' | 'auto';

export interface SourceAttribution {
  source_type: 'structured' | 'unstructured';
  category: 'primary' | 'supporting' | 'additional';
  title?: string;
  url?: string;
  relevance_score?: number;
  excerpt?: string;
  table_name?: string;
}

export interface ConversationSummary {
  id: string;
  title?: string;
  mode: SearchMode;
  created_at: string;
  updated_at: string;
}

export interface ConversationResponse extends ConversationSummary {
  user_id: string;
  company_id?: string;
}

export interface MessageResponse {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'tool';
  content: string;
  tool_name?: string;
  sources_json?: string;
  format_used?: string;
  elapsed_ms?: number;
  model_used?: string;
  created_at: string;
}

export interface ListConversationsResponse {
  conversations: ConversationSummary[];
  total: number;
  skip: number;
  limit: number;
}

export interface GetMessagesResponse {
  conversation_id: string;
  messages: MessageResponse[];
}

export interface IntelligentQueryRequest {
  query: string;
  limit?: number;
  mode?: SearchMode;
  response_format?: ResponseFormat;
  conversation_id?: string;
  force_route?: 'structured' | 'unstructured';
}

export interface IntelligentSearchResponse {
  request_id: string;
  query: string;
  answer: string;
  routing_decision: string;
  attributed_sources: SourceAttribution[];
  conversation_id?: string;
  message_id?: string;
  mode: SearchMode;
  elapsed_ms: number;
  iterations?: number;
}

// New SSE event types (updated API)
export interface SSEEventSearching {
  stage: 'searching';
  tools: string[];
}

export interface SSEEventToolCall {
  stage: 'tool_call';
  iteration?: number;
  tool: string;
  query?: string;
}

export interface SSEEventToolResult {
  stage: 'tool_result';
  tool: string;
  iteration?: number;
  sql?: string;
  row_count?: number;
  hit_count?: number;
  error?: string | null;
  summary?: { row_count?: number; hit_count?: number; error?: string | null };
}

export interface SSEEventAnswer {
  stage: 'answer';
  answer: string;
  attributed_sources: SourceAttribution[];
  iterations?: number;
}

export interface SSEEventAnswerStart {
  stage: 'answer_start';
}

export interface SSEEventAnswerToken {
  stage: 'answer_token';
  token: string;
}

export interface SSEEventAnswerEnd {
  stage: 'answer_end';
  attributed_sources: SourceAttribution[];
}

export interface SSEEventThinking {
  stage: 'thinking';
  iteration: number;
}

export interface SSEEventDone {
  stage: 'done';
  total_elapsed_ms: number;
}

export interface SSEEventError {
  stage: 'error';
  detail: string;
}

export type NewStreamEvent =
  | SSEEventSearching
  | SSEEventToolCall
  | SSEEventToolResult
  | SSEEventAnswer
  | SSEEventAnswerStart
  | SSEEventAnswerToken
  | SSEEventAnswerEnd
  | SSEEventThinking
  | SSEEventDone
  | SSEEventError;

// Client-side chat message (richer than MessageResponse — holds streaming state)
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: SourceAttribution[];
  elapsed_ms?: number;
  model_used?: string;
  streaming?: boolean;
  streamEvents?: NewStreamEvent[];
  frontierResult?: {
    answer: string;
    model: string;
    latency: number;
    error?: string;
  };
  kuriousRating?: number;
  frontierRating?: number;
  searchLogId?: number;
}

// ─── Legacy search response types ─────────────────────────────────────────────

export interface BackendSearchResponse {
  request_id: string;
  question: string;
  index_name: string;
  answer: string;
  evaluation_result: {
    question: string;
    generated_answer: string;
    golden_answer?: string;
    golden_answer_texts?: string[];
    correct: boolean;
    message: string;
    fuzzy_score?: number;
  };
  created_at: string;
}
