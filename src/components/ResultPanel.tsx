import React, { useState, useMemo, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { SearchResponse, StreamSource, StreamErrorEvent } from '../types';
import { StreamEvent } from '../services/backendApi';
import { StarRating } from './StarRating';

interface ResultPanelProps {
  title: string;
  result: SearchResponse | null;
  loading: boolean;
  error: string | null;
  isCorrect?: boolean | null;
  latency?: number | null;
  rating?: number | null;
  onRate?: (rating: number, feedback?: string) => void;
  headerSlot?: React.ReactNode;
  titleNote?: string;
  // Streaming props
  realSources?: StreamSource[];
  streamErrors?: StreamErrorEvent[];
  synthesizingAnswer?: boolean;
  streamingEvents?: StreamEvent[];
  currentStage?: string | null;
  showPipelineProgress?: boolean;
}

const STAGE_LABELS: Record<string, string> = {
  retrieval_done: 'Retrieving documents',
  schema_retrieved: 'Analyzing data schema',
  sql_generated: 'Generating structured query',
  sql_executed: 'Executing query',
  unstructured: 'Processing document content',
  structured: 'Aggregating results',
  error: 'Error encountered',
};

// Strip code fences wrapping pipe tables so remark-gfm renders them as real tables
function unwrapFencedTables(text: string): string {
  return text.replace(/```[^\n]*\n((?:\|[^\n]+\n)+)```/g, '$1');
}

function RealSources({ sources }: { sources: StreamSource[] }) {
  if (sources.length === 0) return null;

  // Deduplicate sources by URL (multiple chunks from same doc share the same source URL)
  const seen = new Set<string>();
  const uniqueSources: Array<{ linkUrl: string | undefined; linkText: string }> = [];

  sources.forEach((src) => {
    const linkUrl = src.source_parent || src.source || src.url;
    const linkText = src.title || src.h1 || '(no title)';
    const key = linkUrl || linkText;
    if (!seen.has(key)) {
      seen.add(key);
      uniqueSources.push({ linkUrl, linkText });
    }
  });

  return (
    <div className="mt-4 pt-1">
      <ol className="space-y-1">
        {uniqueSources.map(({ linkUrl, linkText }, i) => (
          <li key={i} className="flex items-start gap-1.5 text-xs text-gray-500">
            <span className="flex-shrink-0">{i + 1}.</span>
            {linkUrl ? (
              <a
                href={linkUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-500 hover:text-gray-300 underline underline-offset-2"
              >
                {linkText}
              </a>
            ) : (
              <span>{linkText}</span>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}

export const ResultPanel: React.FC<ResultPanelProps> = ({
  title, result, loading, error, isCorrect, latency, rating, onRate,
  headerSlot, titleNote,
  realSources, streamErrors,
  synthesizingAnswer,
  streamingEvents = [],
  currentStage: _currentStage,
  showPipelineProgress = true,
}) => {
  const [traceExpanded, setTraceExpanded] = useState(false);
  // Index into traceEvents for the currently displayed status line (0 = "Search initiated")
  const [displayIdx, setDisplayIdx] = useState(0);

  // Trace events = all events except 'done' (these are shown one-by-one and listed in the trace)
  const traceEvents = useMemo(
    () => streamingEvents.filter(e => e.stage !== 'done'),
    [streamingEvents]
  );

  // Reset displayIdx when a new search starts (streamingEvents emptied)
  useEffect(() => {
    if (streamingEvents.length === 0) setDisplayIdx(0);
  }, [streamingEvents.length]);

  // Advance displayIdx by 1 every 500ms while there are more trace events to show
  useEffect(() => {
    if (displayIdx >= traceEvents.length) return;
    const t = setTimeout(() => setDisplayIdx(i => i + 1), 500);
    return () => clearTimeout(t);
  }, [displayIdx, traceEvents.length]);

  // Stream is truly done only when the 'done' event is received
  const streamComplete = streamingEvents.some(e => e.stage === 'done');
  // displayIdx has caught up = we've shown every trace event for at least 500ms
  const caughtUp = displayIdx >= traceEvents.length;
  // Collapse only after: all events shown, stream done, synthesis done, answer exists
  const answerArrived = caughtUp && streamComplete && !synthesizingAnswer && !!result;

  // Label shown in the single-line status
  const statusLabel = useMemo(() => {
    if (synthesizingAnswer) return 'Synthesizing answer';
    if (displayIdx === 0) return 'Search initiated';
    const event = traceEvents[displayIdx - 1];
    return event ? (STAGE_LABELS[event.stage] ?? event.stage) : 'Search initiated';
  }, [displayIdx, traceEvents, synthesizingAnswer]);

  return (
    <div className="bg-gray-800 shadow-lg p-6 h-full min-h-[300px] flex flex-col border-2 border-gray-700">
      <div className="flex items-center mb-4 pb-1 gap-2">
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
        {/* Pipeline progress */}
        {showPipelineProgress && (loading || synthesizingAnswer || streamingEvents.length > 0) && (
          answerArrived ? (
            /* Collapsed trace after answer */
            <div className="border border-gray-700 mb-4 rounded" style={{ background: '#1a2332' }}>
              <button
                type="button"
                onClick={() => setTraceExpanded(v => !v)}
                className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-700/40 transition-colors rounded"
              >
                <span className={`text-gray-500 text-xs transition-transform duration-200 inline-block ${traceExpanded ? 'rotate-90' : ''}`}>▶</span>
                <span className="text-xs text-gray-500 font-medium uppercase tracking-wide">Knowledge perception trace</span>
                <span className="ml-auto text-xs font-medium text-green-500">
                  {traceEvents.length} step{traceEvents.length !== 1 ? 's' : ''}
                </span>
              </button>
              {traceExpanded && (
                <div className="px-3 pb-3 border-t border-gray-700 pt-2 space-y-1.5">
                  {traceEvents.map((event, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-green-500 text-xs flex-shrink-0">✓</span>
                      <span className="text-sm text-gray-300">{STAGE_LABELS[event.stage] ?? event.stage}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Single-line live status */
            <div className="flex items-center gap-2.5 mb-4 px-3 py-2.5 rounded-lg border border-blue-700/40" style={{ background: 'rgba(30,58,138,0.15)' }}>
              <div className="flex-shrink-0 h-4 w-4 rounded-full border-2 border-blue-400 border-t-transparent animate-spin" />
              <span className="text-sm text-blue-300 font-medium">{statusLabel}</span>
            </div>
          )
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

            {realSources && realSources.length > 0 && (
              <RealSources sources={realSources} />
            )}
          </div>
        )}

        {!loading && !error && !result && (!streamErrors || streamErrors.length === 0) && (
          <div className="flex items-center justify-center h-full text-gray-500">
            <p>No results yet. Enter a query to search.</p>
          </div>
        )}

      </div>

      {(latency != null || (onRate && result)) && (
        <div className="mt-4 pt-2 flex items-center justify-between gap-4">
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
