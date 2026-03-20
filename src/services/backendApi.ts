import axios from 'axios';
import { BackendSearchResponse } from '../types';

const API_KEY = import.meta.env.VITE_BACKEND_API_KEY || '';
const COMPANY_ID = import.meta.env.VITE_BACKEND_COMPANY_ID || '';

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
