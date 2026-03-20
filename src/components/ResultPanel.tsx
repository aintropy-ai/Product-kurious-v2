import React from 'react';
import { SearchResponse } from '../types';
import { StarRating } from './StarRating';
import { ProcessStepsSummary } from './ProcessStepsSummary';

interface ResultPanelProps {
  title: string;
  result: SearchResponse | null;
  loading: boolean;
  error: string | null;
  isCorrect?: boolean | null;
  latency?: number | null;
  rating?: number | null;
  onRate?: (rating: number, feedback?: string) => void;
  showProcessSteps?: boolean;
  headerSlot?: React.ReactNode;
}

export const ResultPanel: React.FC<ResultPanelProps> = ({ title, result, loading, error, isCorrect, latency, rating, onRate, showProcessSteps, headerSlot }) => {
  return (
    <div className="bg-gray-800 shadow-lg p-6 h-full min-h-[300px] flex flex-col border-2 border-gray-700">
      <div className="flex items-center justify-between mb-4 border-b-2 border-gray-700 pb-3 gap-2">
        {title && <h2 className="text-xl font-semibold text-white flex-shrink-0">{title}</h2>}
        {headerSlot && <div className="flex-1">{headerSlot}</div>}
        {isCorrect !== null && isCorrect !== undefined && (
          <div className="text-2xl flex-shrink-0">
            {isCorrect ? (
              <span className="text-green-500">✓</span>
            ) : (
              <span className="text-red-500">✗</span>
            )}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {showProcessSteps && !loading && (result || error) && (
          <ProcessStepsSummary hasError={!!error} />
        )}

        {loading && (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        )}

        {error && (
          <div className="bg-red-900 border-2 border-red-700 p-4">
            <p className="text-red-300 font-medium">Error:</p>
            <p className="text-red-400 mt-1">{error}</p>
          </div>
        )}

        {!loading && !error && result && (
          <div className="space-y-4">
            <div className="prose max-w-none">
              <p className="text-gray-200 whitespace-pre-wrap leading-relaxed">{result.answer}</p>
            </div>

            {result.sources && result.sources.length > 0 && (
              <div className="mt-6 pt-4 border-t-2 border-gray-700">
                <p className="font-medium text-white mb-2">Sources:</p>
                <ul className="list-disc list-inside space-y-1">
                  {result.sources.map((source, idx) => (
                    <li key={idx} className="text-sm text-gray-300">{source}</li>
                  ))}
                </ul>
              </div>
            )}

            {result.context && (
              <div className="mt-6 pt-4 border-t-2 border-gray-700">
                <p className="font-medium text-white mb-2">Context:</p>
                <p className="text-sm text-gray-300 whitespace-pre-wrap">{result.context}</p>
              </div>
            )}
          </div>
        )}

        {!loading && !error && !result && (
          <div className="flex items-center justify-center h-full text-gray-500">
            <p>No results yet. Enter a query to search.</p>
          </div>
        )}
      </div>

      {(latency != null || (onRate && result)) && (
        <div className="mt-4 pt-4 border-t-2 border-gray-700 flex items-center justify-between gap-4">
          {latency != null && (
            <p className="text-sm text-gray-400">Latency: {latency.toFixed(2)}s</p>
          )}
          {onRate && result && (
            <div className="ml-auto">
              <StarRating rating={rating ?? null} onRate={onRate} />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
