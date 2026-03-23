import React, { useState, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { SearchResponse, StreamSource, StreamStructuredEvent, StreamErrorEvent } from '../types';
import { StreamEvent } from '../services/backendApi';
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
  titleNote?: string;
  // New streaming props
  structuredData?: StreamStructuredEvent | null;
  realSources?: StreamSource[];
  streamErrors?: StreamErrorEvent[];
  synthesizedAnswer?: string;
  synthesizingAnswer?: boolean;
  streamingEvents?: StreamEvent[];
  currentStage?: string | null;
  showPipelineProgress?: boolean;
}

// Strip code fences wrapping pipe tables so remark-gfm renders them as real tables
function unwrapFencedTables(text: string): string {
  return text.replace(/```[^\n]*\n((?:\|[^\n]+\n)+)```/g, '$1');
}

const CELL_TRUNCATE_LEN = 80;

function StructuredTable({ data }: { data: StreamStructuredEvent }) {
  const [sqlExpanded, setSqlExpanded] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  const toggleRow = (ri: number) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      next.has(ri) ? next.delete(ri) : next.add(ri);
      return next;
    });
  };

  return (
    <div className="mt-6 pt-4 border-t-2 border-gray-700">
      <div className="flex items-center gap-3 mb-2">
        <p className="font-medium text-white">Structured Data</p>
        <span className="text-xs text-gray-500">{data.row_count} row{data.row_count !== 1 ? 's' : ''}</span>
        <button
          onClick={() => setSqlExpanded(v => !v)}
          className="text-xs text-blue-400 hover:text-blue-300 underline ml-auto"
        >
          {sqlExpanded ? 'Hide SQL' : 'Show SQL'}
        </button>
      </div>

      {sqlExpanded && (
        <pre className="text-xs text-gray-300 bg-gray-900 p-3 rounded overflow-x-auto mb-3 whitespace-pre-wrap">
          {data.sql}
        </pre>
      )}

      {/* Table */}
      {data.columns.length > 0 ? (
        <div className="overflow-x-auto border border-gray-600 rounded">
          <div className="max-h-96 overflow-y-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="sticky top-0 z-10">
                <tr className="bg-gray-700">
                  <th className="px-2 py-2 text-gray-400 font-medium border-r border-gray-600 w-8 text-center">#</th>
                  {data.columns.map((col, i) => (
                    <th key={i} className="px-3 py-2 text-gray-200 font-medium border-r border-gray-600 whitespace-nowrap last:border-r-0">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.rows.map((row, ri) => {
                  const isExpanded = expandedRows.has(ri);
                  const cells = row as unknown[];
                  const hasLongCell = cells.some(cell => String(cell ?? '').length > CELL_TRUNCATE_LEN);
                  return (
                    <tr
                      key={ri}
                      className={`${ri % 2 === 0 ? 'bg-gray-800' : 'bg-gray-850'} ${hasLongCell ? 'cursor-pointer hover:bg-gray-700' : ''} transition-colors`}
                      onClick={hasLongCell ? () => toggleRow(ri) : undefined}
                      title={hasLongCell ? (isExpanded ? 'Click to collapse' : 'Click to expand') : undefined}
                    >
                      <td className="px-2 py-1.5 text-gray-600 border-r border-gray-700 text-center select-none">
                        {hasLongCell ? (
                          <span className="text-gray-400">{isExpanded ? '▾' : '▸'}</span>
                        ) : (
                          <span>{ri + 1}</span>
                        )}
                      </td>
                      {cells.map((cell, ci) => {
                        const str = String(cell ?? '');
                        const truncated = !isExpanded && str.length > CELL_TRUNCATE_LEN;
                        return (
                          <td key={ci} className="px-3 py-1.5 text-gray-300 border-r border-gray-700 last:border-r-0 align-top">
                            {truncated ? (
                              <span title={str}>{str.slice(0, CELL_TRUNCATE_LEN)}<span className="text-gray-500">…</span></span>
                            ) : (
                              <span className={isExpanded ? 'whitespace-pre-wrap break-words' : 'whitespace-nowrap'}>{str}</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <p className="text-sm text-gray-400">No data returned.</p>
      )}
    </div>
  );
}

function RealSources({ sources }: { sources: StreamSource[] }) {
  if (sources.length === 0) return null;

  // Deduplicate sources by linkUrl + linkText
  const seen = new Set<string>();
  const uniqueSources: Array<{ linkUrl: string | undefined; linkText: string }> = [];

  sources.forEach((src) => {
    let linkUrl = src.url;
    let linkText = src.title || src.h1 || '(no title)';

    // Parse catalog_metadata if it's JSON with link info
    if (src.catalog_metadata) {
      try {
        const metadata = JSON.parse(src.catalog_metadata);
        if (metadata.portal_url) {
          linkUrl = metadata.portal_url;
        }
        if (metadata.link_text) {
          linkText = metadata.link_text;
        }
      } catch {
        // If not valid JSON, keep original values
      }
    }

    const key = linkUrl || linkText;
    if (!seen.has(key)) {
      seen.add(key);
      uniqueSources.push({ linkUrl, linkText });
    }
  });

  return (
    <div className="mt-6 pt-4 border-t-2 border-gray-700">
      <p className="font-medium text-white mb-2">Sources ({uniqueSources.length})</p>
      <ul className="space-y-2">
        {uniqueSources.map(({ linkUrl, linkText }, i) => (
          <li key={i} className="text-sm">
            {linkUrl ? (
              <a
                href={linkUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 underline"
              >
                {linkText}
              </a>
            ) : (
              <span className="text-gray-300">{linkText}</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export const ResultPanel: React.FC<ResultPanelProps> = ({
  title, result, loading, error, isCorrect, latency, rating, onRate,
  showProcessSteps, headerSlot, titleNote,
  structuredData, realSources, streamErrors,
  synthesizedAnswer, synthesizingAnswer,
  streamingEvents = [],
  currentStage,
  showPipelineProgress = true,
}) => {
  // Track completed stages from streaming events
  const completedStages = useMemo(() => {
    return new Set(streamingEvents.map(e => e.stage).filter(s => s !== 'done'));
  }, [streamingEvents]);

  const pipelineStages = [
    { stage: 'retrieval_done', label: 'Retrieving Documents', desc: 'Searching across NJ Open Data sources' },
    { stage: 'schema_retrieved', label: 'Analyzing Schema', desc: 'Identifying relevant datasets and tables' },
    { stage: 'sql_generated', label: 'Generating Query', desc: 'Creating optimized SQL queries' },
    { stage: 'sql_executed', label: 'Executing Query', desc: 'Running structured data queries' },
    { stage: 'unstructured', label: 'Processing Documents', desc: 'Extracting insights from unstructured content' },
    { stage: 'structured', label: 'Aggregating Results', desc: 'Combining structured and unstructured findings' },
  ];

  return (
    <div className="bg-gray-800 shadow-lg p-6 h-full min-h-[300px] flex flex-col border-2 border-gray-700">
      <div className="flex items-center mb-4 border-b-2 border-gray-700 pb-3 gap-2">
        {title && <h2 className="text-xl font-semibold text-white flex-shrink-0">{title}</h2>}
        {headerSlot && <div className="flex-1">{headerSlot}</div>}
        {titleNote && <span className="text-xs text-gray-400 ml-auto flex-shrink-0">{titleNote}</span>}
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
        {/* Live Pipeline Progress */}
        {showPipelineProgress && (loading || synthesizingAnswer || streamingEvents.length > 0) && (
          <div className="mb-6 p-4 bg-gradient-to-r from-blue-900/30 to-blue-800/30 border border-blue-700/50 rounded-lg">
            <div className="space-y-3">
              {/* Pipeline stages with detailed descriptions */}
              <div className="space-y-2.5">
                {pipelineStages.map((item) => {
                  const isCompleted = completedStages.has(item.stage as any);
                  const isActive = currentStage === item.stage;
                  return (
                    <div key={item.stage} className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-1">
                        {isCompleted ? (
                          <div className="w-5 h-5 rounded-full bg-green-600 flex items-center justify-center">
                            <span className="text-xs text-white">✓</span>
                          </div>
                        ) : isActive ? (
                          <div className="w-5 h-5 rounded-full bg-blue-500 animate-pulse" />
                        ) : (
                          <div className="w-5 h-5 rounded-full border-2 border-gray-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${isActive ? 'text-blue-300' : isCompleted ? 'text-green-400' : 'text-gray-500'}`}>
                          {item.label}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">{item.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Synthesis stage */}
              {synthesizingAnswer && (
                <div className="mt-3 pt-3 border-t border-blue-700/30 flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-purple-600 animate-pulse flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-purple-300">AI Synthesis</p>
                    <p className="text-xs text-gray-400 mt-0.5">synthesizing a comprehensive answer</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {showProcessSteps && !loading && (result || error) && (
          <ProcessStepsSummary hasError={!!error} />
        )}

        {/* Hard error (network failure before stream started) */}
        {error && (
          <div className="bg-red-900 border-2 border-red-700 p-4">
            <p className="text-red-300 font-medium">Error:</p>
            <p className="text-red-400 mt-1">{error}</p>
          </div>
        )}

        {!loading && !error && result && (
          <div className="space-y-4">
            <div className="prose prose-invert prose-sm max-w-none
              prose-p:text-gray-200 prose-p:leading-relaxed
              prose-headings:text-white prose-headings:font-semibold
              prose-strong:text-white
              prose-a:text-blue-400 hover:prose-a:text-blue-300
              prose-code:text-blue-300 prose-code:bg-gray-900 prose-code:px-1 prose-code:rounded
              prose-pre:bg-gray-900 prose-pre:text-gray-300
              prose-li:text-gray-200
              prose-ol:text-gray-200 prose-ul:text-gray-200
              prose-blockquote:border-l-blue-500 prose-blockquote:text-gray-400
              prose-table:text-sm prose-th:text-gray-200 prose-td:text-gray-300">
              <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
                {unwrapFencedTables(result.answer)}
              </ReactMarkdown>
            </div>

            {/* Real document sources */}
            {realSources && realSources.length > 0 && (
              <RealSources sources={realSources} />
            )}

            {/* Structured SQL table (may arrive after unstructured) */}
            {structuredData && (
              <StructuredTable data={structuredData} />
            )}

            {/* Synthesized answer */}
            {synthesizedAnswer && (
              <div className="mt-6 pt-4 border-t-2 border-gray-700">
                <div className="flex items-center gap-2 mb-3">
                  <p className="font-medium text-white">Final Answer</p>
                  <span className="text-xs text-gray-500">AI-Generated Summary</span>
                </div>
                <div className="prose prose-invert prose-sm max-w-none
                  prose-p:text-gray-200 prose-p:leading-relaxed
                  prose-headings:text-white prose-headings:font-semibold
                  prose-strong:text-white
                  prose-a:text-blue-400 hover:prose-a:text-blue-300
                  prose-code:text-blue-300 prose-code:bg-gray-900 prose-code:px-1 prose-code:rounded
                  prose-pre:bg-gray-900 prose-pre:text-gray-300
                  prose-li:text-gray-200
                  prose-ol:text-gray-200 prose-ul:text-gray-200
                  prose-blockquote:border-l-purple-500 prose-blockquote:text-gray-400">
                  <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
                    {unwrapFencedTables(synthesizedAnswer)}
                  </ReactMarkdown>
                </div>
              </div>
            )}

            {synthesizingAnswer && (
              <div className="mt-6 pt-4 border-t-2 border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="animate-spin h-4 w-4 border-2 border-purple-400 border-t-transparent rounded-full flex-shrink-0" />
                  <span className="text-sm text-purple-300 font-medium">Synthesizing answer …</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Show structured table even if no unstructured result */}
        {!loading && !error && !result && structuredData && (
          <StructuredTable data={structuredData} />
        )}

        {!loading && !error && !result && !structuredData && (!streamErrors || streamErrors.length === 0) && (
          <div className="flex items-center justify-center h-full text-gray-500">
            <p>No results yet. Enter a query to search.</p>
          </div>
        )}

      </div>

      {(latency != null || (onRate && (result || structuredData))) && (
        <div className="mt-4 pt-4 border-t-2 border-gray-700 flex items-center justify-between gap-4">
          {latency != null && (
            <p className="text-sm text-gray-400">Latency: {latency.toFixed(2)}s</p>
          )}
          {onRate && (result || structuredData) && (
            <div className="ml-auto">
              <StarRating rating={rating ?? null} onRate={onRate} />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
