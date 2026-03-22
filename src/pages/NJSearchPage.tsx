import { useState } from 'react';
import { SearchBar } from '../components/SearchBar';
import { ResultPanel } from '../components/ResultPanel';
import { SearchProgress } from '../components/SearchProgress';
import { FrontierAPISelector } from '../components/FrontierAPISelector';
import { GoldenAnswerBox } from '../components/GoldenAnswerBox';
import { intelligentStreamSearch } from '../services/backendApi';
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
  const [structuredResult, setStructuredResult] = useState<StreamStructuredEvent | null>(null);
  const [streamErrors, setStreamErrors] = useState<StreamErrorEvent[]>([]);
  const [backendError, setBackendError] = useState<string | null>(null);

  // Frontier state
  const [frontierResult, setFrontierResult] = useState<SearchResponse | null>(null);
  const [frontierError, setFrontierError] = useState<string | null>(null);
  const [frontierLoading, setFrontierLoading] = useState(false);
  const [frontierRating, setFrontierRating] = useState<number | null>(null);
  const [frontierCorrect, setFrontierCorrect] = useState<boolean | null>(null);
  const [frontierLatency, setFrontierLatency] = useState<number | null>(null);

  const [backendLoading, setBackendLoading] = useState(false);
  const [progressDone, setProgressDone] = useState(true);
  const [backendRating, setBackendRating] = useState<number | null>(null);
  const [backendLatency, setBackendLatency] = useState<number | null>(null);

  const handleSearch = async (query: string) => {
    // Reset all state
    setUnstructuredResult(null);
    setStructuredResult(null);
    setStreamErrors([]);
    setBackendError(null);
    setFrontierResult(null);
    setFrontierError(null);
    setFrontierCorrect(null);
    setBackendLatency(null);
    setFrontierLatency(null);
    setBackendRating(null);
    setFrontierRating(null);

    setProgressDone(false);
    setBackendLoading(true);
    if (comparisonOpen) setFrontierLoading(true);

    // Run frontier request in parallel (fire-and-forget until done)
    const frontierStartTime = Date.now();
    const frontierRequest = comparisonOpen ? (async () => {
      let result: SearchResponse;
      switch (selectedFrontierAPI) {
        case 'gpt5':
          result = await frontierApi.searchWithGPT5(query);
          break;
        case 'gemini3':
          result = await frontierApi.searchWithGemini3(query);
          break;
        case 'claude':
          result = await frontierApi.searchWithClaude(query);
          break;
        default:
          throw new Error('Invalid API selected');
      }
      const latency = (Date.now() - frontierStartTime) / 1000;
      return { result, latency };
    })() : null;

    // Streaming backend request
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 120_000);

    try {
      await intelligentStreamSearch(query, {
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
  };

  // Derive a SearchResponse-compatible object from unstructured result for ResultPanel
  const backendResult: SearchResponse | null = unstructuredResult
    ? { answer: unstructuredResult.answer }
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
            <GoldenAnswerBox goldenAnswer={null} />
          </div>

          {/* Result row */}
          <div className="flex items-stretch">
            <div className="flex-1" />

            <div className="w-full flex items-stretch" style={{ maxWidth: '56rem' }}>
              {/* Backend panel */}
              <div className="flex-1 min-w-0">
                {!progressDone ? (
                  <SearchProgress
                    loading={backendLoading}
                    onComplete={() => setProgressDone(true)}
                  />
                ) : (
                  <ResultPanel
                    title="Kurious"
                    titleNote="Intelligent Search"
                    result={backendResult}
                    loading={false}
                    error={backendError}
                    latency={backendLatency}
                    rating={backendRating}
                    onRate={setBackendRating}
                    showProcessSteps
                    structuredData={structuredResult}
                    realSources={unstructuredResult?.sources}
                    streamErrors={streamErrors}
                  />
                )}
              </div>

              {/* Frontier panel */}
              {comparisonOpen && (
                <div className="flex-1 min-w-0 border-l border-gray-700">
                  <ResultPanel
                    title=""
                    result={frontierResult}
                    loading={frontierLoading}
                    error={frontierError}
                    isCorrect={frontierCorrect}
                    latency={frontierLatency}
                    rating={frontierRating}
                    onRate={setFrontierRating}
                    headerSlot={
                      <FrontierAPISelector
                        selectedAPI={selectedFrontierAPI}
                        onAPIChange={setSelectedFrontierAPI}
                      />
                    }
                  />
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
