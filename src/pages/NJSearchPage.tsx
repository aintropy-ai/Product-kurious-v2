import { useState, useEffect } from 'react';
import { SearchBar } from '../components/SearchBar';
import { ResultPanel } from '../components/ResultPanel';
import { FrontierAPISelector } from '../components/FrontierAPISelector';
import { intelligentStreamSearch, backendApi, StreamEvent } from '../services/backendApi';
import { synthesizeAnswer } from '../services/anthropicApi';
import { frontierApi } from '../services/frontierApi';
import { SearchResponse, StreamUnstructuredEvent, StreamStructuredEvent, StreamErrorEvent } from '../types';

import njQuestions from '../../assets/njopendata_questions_preloaded.txt?raw';

const PRELOADED_QUESTIONS = njQuestions.split('\n---\n').filter(q => q.trim());

const NJ_SOURCES = [
  { name: 'Department of Transportation', documents: '8.5M' },
  { name: 'Department of Health', documents: '7.2M' },
  { name: 'Department of Education', documents: '6.8M' },
  { name: 'Department of Human Services', documents: '5.3M' },
  { name: 'Department of Environmental Protection', documents: '4.9M' },
  { name: 'Department of the Treasury', documents: '4.1M' },
  { name: 'Attorney General / Law & Public Safety', documents: '3.7M' },
  { name: 'Department of Labor & Workforce Development', documents: '3.2M' },
  { name: 'Motor Vehicle Commission', documents: '2.9M' },
  { name: 'Department of Corrections', documents: '2.4M' },
  { name: 'Department of Children & Families', documents: '1.8M' },
  { name: 'Department of Community Affairs', documents: '1.5M' },
  { name: 'Board of Public Utilities', documents: '1.2M' },
  { name: 'Department of Banking and Insurance', documents: '980K' },
  { name: 'Economic Development Authority', documents: '850K' },
  { name: 'State Police', documents: '720K' },
  { name: 'Department of Veterans Affairs', documents: '580K' },
  { name: 'Civil Service Commission', documents: '450K' },
  { name: 'Department of Agriculture', documents: '320K' },
  { name: 'Casino Control Commission', documents: '280K' },
  { name: 'Department of State', documents: '220K' },
  { name: 'Department of Military Affairs', documents: '180K' },
  { name: 'Office of the Governor', documents: '130K' },
];

export const NJSearchPage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [comparisonOpen, setComparisonOpen] = useState(false);
  const [selectedFrontierAPI, setSelectedFrontierAPI] = useState<string>('claude');

  // Streaming result state
  const [unstructuredResult, setUnstructuredResult] = useState<StreamUnstructuredEvent | null>(null);
  const [_structuredResult, setStructuredResult] = useState<StreamStructuredEvent | null>(null);
  const [streamErrors, setStreamErrors] = useState<StreamErrorEvent[]>([]);
  const [backendError, setBackendError] = useState<string | null>(null);
  const [backendLoading, setBackendLoading] = useState(false);

  // Frontier state
  const [frontierResult, setFrontierResult] = useState<SearchResponse | null>(null);
  const [frontierError, setFrontierError] = useState<string | null>(null);
  const [frontierLoading, setFrontierLoading] = useState(false);
  const [frontierRating, setFrontierRating] = useState<number | null>(null);
  const [frontierLatency, setFrontierLatency] = useState<number | null>(null);

  const [progressDone, setProgressDone] = useState(true);
  const [backendRating, setBackendRating] = useState<number | null>(null);
  const [backendLatency, setBackendLatency] = useState<number | null>(null);

  const [searchLogId, setSearchLogId] = useState<number>(-1);

  // Streaming events and synthesis
  const [streamingEvents, setStreamingEvents] = useState<StreamEvent[]>([]);
  const [currentStage, setCurrentStage] = useState<string | null>(null);
  const [synthesizingAnswer, setSynthesizingAnswer] = useState(false);
  const [synthesizedAnswer, setSynthesizedAnswer] = useState<string>('');
  const [lastQuery, setLastQuery] = useState<string>('');

  const handleSearch = async (query: string) => {
    // Reset all state
    setUnstructuredResult(null);
    setStructuredResult(null);
    setStreamErrors([]);
    setBackendError(null);
    setFrontierResult(null);
    setFrontierError(null);
    setBackendLatency(null);
    setFrontierLatency(null);
    setBackendRating(null);
    setFrontierRating(null);
    setStreamingEvents([]);
    setCurrentStage(null);
    setSynthesizingAnswer(false);
    setSynthesizedAnswer('');
    setLastQuery(query);

    setProgressDone(false);
    setBackendLoading(true);
    if (comparisonOpen) setFrontierLoading(true);

    // Run frontier request in parallel (fire-and-forget until done)
    const frontierStartTime = Date.now();
    const frontierRequest = comparisonOpen ? (async () => {
      const result = await frontierApi.search(selectedFrontierAPI, query);
      const latency = (Date.now() - frontierStartTime) / 1000;
      return { result, latency };
    })() : null;

    // Streaming backend request
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 120_000);

    try {
      await intelligentStreamSearch(query, {
        onEvent: (event: StreamEvent) => {
          setStreamingEvents(prev => [...prev, event]);
          setCurrentStage(event.stage === 'done' ? null : event.stage);
        },
        onUnstructured: (event) => {
          setUnstructuredResult(event);
          setBackendLoading(false);
        },
        onStructured: (event) => {
          setStructuredResult(event);
        },
        onError: (event) => {
          setStreamErrors(prev => [...prev, event]);
          // If unstructured failed and we haven't shown any result yet, clear loading
          if (event.source === 'unstructured') {
            setBackendLoading(false);
          }
        },
        onDone: (event) => {
          setBackendLatency(event.total_elapsed_ms / 1000);
          setProgressDone(true);
          setBackendLoading(false);
        },
      }, controller.signal);
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setBackendError(err.message || 'Network error');
      }
      setBackendLoading(false);
      setProgressDone(true);
    } finally {
      clearTimeout(timeout);
    }

    // Resolve frontier
    if (frontierRequest) {
      try {
        const { result, latency } = await frontierRequest;
        setFrontierResult(result);
        setFrontierLatency(latency);
      } catch (err: any) {
        setFrontierError(err.message || 'Failed to search frontier API');
      }
      setFrontierLoading(false);
    }

    // Log search event (fire-and-forget)
    try {
      const logPayload = {
        question: query,
        kurious_answer: unstructuredResult?.answer ?? undefined,
        kurious_latency_ms: backendLatency != null ? Math.round(backendLatency * 1000) : undefined,
      };
      const { id: logId } = await backendApi.createSearchLog(logPayload);
      setSearchLogId(logId);
    } catch (err) {
      // Silently fail logging
    }
  };

  const NO_ANSWER_PHRASE = 'does not contain the answer';

  // Only synthesize when the unstructured answer has no useful content
  useEffect(() => {
    if (!progressDone || streamingEvents.length === 0 || synthesizedAnswer || !lastQuery) return;
    const unstructuredIsUseful = unstructuredResult != null &&
      !unstructuredResult.answer.toLowerCase().includes(NO_ANSWER_PHRASE);
    if (unstructuredIsUseful) return;

    const synthesize = async () => {
      setSynthesizingAnswer(true);
      try {
        const answer = await synthesizeAnswer(lastQuery, streamingEvents);
        setSynthesizedAnswer(answer);
      } catch (err) {
        console.error('Failed to synthesize answer:', err);
      } finally {
        setSynthesizingAnswer(false);
      }
    };
    synthesize();
  }, [progressDone, streamingEvents.length]);

  // Single resolved answer: prefer good unstructured answer, fall back to synthesis
  const unstructuredIsUseful = unstructuredResult != null &&
    !unstructuredResult.answer.toLowerCase().includes(NO_ANSWER_PHRASE);

  const backendResult: SearchResponse | null = unstructuredIsUseful
    ? { answer: unstructuredResult!.answer }
    : synthesizedAnswer
      ? { answer: synthesizedAnswer }
      : null;

  return (
    <div className="min-h-screen bg-gray-900 flex">
      {/* Left Sidebar - NJ Data Sources */}
      <div
        className="flex-shrink-0 border-r border-gray-700 flex flex-col transition-all duration-200 overflow-hidden"
        style={{ background: '#111827', width: sidebarOpen ? '16rem' : '2.25rem' }}
      >
        {sidebarOpen ? (
          <>
            <div className="px-4 py-4 border-b border-gray-700 flex items-start justify-between flex-shrink-0">
              <div>
                <div className="text-xl font-bold text-white">NJ Open Data</div>
                <div className="text-sm text-gray-400">23 agencies · 57M documents</div>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="text-gray-400 hover:text-white transition-colors mt-1 ml-2 flex-shrink-0 text-lg leading-none"
                title="Collapse"
              >
                ‹
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3">
              <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">Data Sources</div>
              <div className="space-y-0.5">
                {NJ_SOURCES.map(source => (
                  <div key={source.name} className="flex items-center gap-2 py-1.5 px-2">
                    <span className="text-xs text-gray-300 flex-1 leading-tight">{source.name}</span>
                    <span className="text-xs text-gray-500 flex-shrink-0">{source.documents}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-gray-400 hover:text-white transition-colors text-lg leading-none"
              title="Expand data sources"
            >
              ›
            </button>
          </div>
        )}
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Header */}
        <div className="bg-gray-800 border-b border-gray-700 px-6 py-4 flex-shrink-0">
          <h1 className="text-xl font-bold text-white">AIntropy Kurious Engine</h1>
          <p className="text-sm text-gray-400">New Jersey Open Data — 57M documents across 23 agencies</p>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Search bar — centered */}
          <div className="max-w-4xl mx-auto mb-6">
            <div className="mb-6">
              <SearchBar
                onSearch={handleSearch}
                disabled={backendLoading || frontierLoading}
                preloadedQuestions={PRELOADED_QUESTIONS}
              />
            </div>
          </div>

          {/* Result row */}
          <div className="flex items-stretch">
            <div className="flex-1" />

            <div className="w-full flex items-stretch" style={{ maxWidth: '56rem' }}>
              {/* Kurious panel */}
              <div className="flex-1 min-w-0">
                <ResultPanel
                  title="Kurious"
                  titleNote="Intelligent Search"
                  result={backendResult}
                  loading={backendLoading}
                  error={backendError}
                  latency={backendLatency}
                  rating={backendRating}
                  onRate={(rating, feedbackText) => {
                    setBackendRating(rating);
                    backendApi.submitFeedback(searchLogId, {
                      kurious_rating: rating,
                      kurious_feedback_text: feedbackText,
                    });
                  }}
                  realSources={unstructuredResult?.sources}
                  streamErrors={streamErrors}
                  synthesizingAnswer={synthesizingAnswer}
                  streamingEvents={streamingEvents}
                  currentStage={currentStage}
                />
              </div>

              {/* Right panel: Frontier comparison */}
              {comparisonOpen && (
                <div className="flex-1 min-w-0 border-l border-gray-700">
                  {frontierLoading ? (
                    <div className="bg-gray-800 shadow-lg p-6 h-full min-h-[300px] flex flex-col border-2 border-gray-700">
                      <div className="flex items-center gap-2 mb-5 border-b-2 border-gray-700 pb-3">
                        <h2 className="text-xl font-semibold text-white">
                          <FrontierAPISelector
                            selectedAPI={selectedFrontierAPI}
                            onAPIChange={setSelectedFrontierAPI}
                          />
                        </h2>
                      </div>
                      <div className="flex-1 flex items-center justify-center">
                        <div className="flex flex-col items-center gap-4">
                          <div className="animate-spin h-12 w-12 border-b-2 border-blue-500"></div>
                          <p className="text-sm text-gray-400">Generating with {selectedFrontierAPI}…</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <ResultPanel
                      title=""
                      result={frontierResult}
                      loading={frontierLoading}
                      error={frontierError}
                      latency={frontierLatency}
                      rating={frontierRating}
                      onRate={(rating, feedbackText) => {
                        setFrontierRating(rating);
                        backendApi.submitFeedback(searchLogId, {
                          frontier_rating: rating,
                          frontier_feedback_text: feedbackText,
                        });
                      }}
                      headerSlot={
                        <FrontierAPISelector
                          selectedAPI={selectedFrontierAPI}
                          onAPIChange={setSelectedFrontierAPI}
                        />
                      }
                      showPipelineProgress={false}
                    />
                  )}
                </div>
              )}
            </div>

            <div className="flex-1 flex items-stretch">
              <div
                className="flex-shrink-0 border-l border-gray-700 flex flex-col"
                style={{ width: '2.25rem', background: '#111827' }}
              >
                <div className="flex-1 flex items-center justify-center">
                  <button
                    onClick={() => setComparisonOpen(v => !v)}
                    className="text-gray-400 hover:text-white transition-colors text-lg leading-none"
                    title={comparisonOpen ? 'Collapse comparison' : 'Compare with LLM'}
                  >
                    {comparisonOpen ? '‹' : '›'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
