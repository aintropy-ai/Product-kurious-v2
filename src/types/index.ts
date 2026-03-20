export interface SearchResponse {
  answer: string;
  sources?: string[];
  context?: string;
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
