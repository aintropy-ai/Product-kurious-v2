import axios from 'axios';
import { BackendSearchResponse, StreamUnstructuredEvent, StreamStructuredEvent, StreamErrorEvent, StreamDoneEvent } from '../types';

const API_KEY = import.meta.env.VITE_BACKEND_API_KEY || '';
const COMPANY_ID = import.meta.env.VITE_BACKEND_COMPANY_ID || '';
const USER_ID = import.meta.env.VITE_BACKEND_USER_ID || '';

const apiClient = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
    ...(API_KEY && { 'X-API-Key': API_KEY }),
    ...(COMPANY_ID && { 'X-Company-ID': COMPANY_ID })
  }
});

export const backendApi = {
  search: async (query: string, indexName: string): Promise<BackendSearchResponse> => {
    try {
      const response = await apiClient.post(`/v1/blended/${indexName}/_search`, {
        question: query
      });
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to search backend API';
      throw new Error(errorMessage);
    }
  }
};

export interface StreamSearchCallbacks {
  onUnstructured: (event: StreamUnstructuredEvent) => void;
  onStructured: (event: StreamStructuredEvent) => void;
  onError: (event: StreamErrorEvent) => void;
  onDone: (event: StreamDoneEvent) => void;
}

export async function intelligentStreamSearch(
  query: string,
  callbacks: StreamSearchCallbacks,
  signal?: AbortSignal
): Promise<void> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(API_KEY && { 'X-API-Key': API_KEY }),
    ...(COMPANY_ID && { 'X-Company-ID': COMPANY_ID }),
    ...(USER_ID && { 'X-User-ID': USER_ID }),
  };

  const response = await fetch('/api/v1/intelligent/_search/stream', {
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
      switch (event.stage) {
        case 'unstructured': callbacks.onUnstructured(event); break;
        case 'structured': callbacks.onStructured(event); break;
        case 'error': callbacks.onError(event); break;
        case 'done': callbacks.onDone(event); break;
      }
    }
  }
}
