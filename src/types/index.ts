export interface SearchResponse {
  answer: string;
  sources?: string[];
  context?: string;
}

export interface StreamSource {
  title?: string;
  h1?: string;
  text?: string;
  url?: string;
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
